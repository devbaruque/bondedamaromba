-- ########## SCRIPT PARA CONFIGURAÇÃO DO BANCO DE DADOS BONDE DA MAROMBA ##########
-- Execute este script no Editor SQL do Supabase
-- NOTA: Os buckets devem ser criados manualmente com os nomes: workout-images e exercise-images

-- ########## CRIAÇÃO DAS TABELAS ##########

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de planos de treino
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de exercícios
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_plan_id UUID REFERENCES public.workout_plans ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sets INTEGER DEFAULT 3 NOT NULL,
  repetitions INTEGER DEFAULT 12 NOT NULL,
  rest_time INTEGER DEFAULT 60 NOT NULL, -- tempo em segundos
  notes TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de imagens de exercícios
CREATE TABLE IF NOT EXISTS public.exercise_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID REFERENCES public.exercises ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de histórico de treinos
CREATE TABLE IF NOT EXISTS public.workout_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users ON DELETE CASCADE NOT NULL,
  workout_plan_id UUID REFERENCES public.workout_plans ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de logs de exercícios
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_history_id UUID REFERENCES public.workout_history ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  completed_sets INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ########## FUNÇÕES E TRIGGERS ##########

-- Função para atualizar o timestamp updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at na tabela users
CREATE TRIGGER set_updated_at_users
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

-- Trigger para atualizar updated_at na tabela workout_plans
CREATE TRIGGER set_updated_at_workout_plans
BEFORE UPDATE ON public.workout_plans
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

-- Trigger para atualizar updated_at na tabela exercises
CREATE TRIGGER set_updated_at_exercises
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

-- Função para criar automaticamente um perfil de usuário após o registro no Auth
-- IMPORTANTE: Essa função é executada com privilégios elevados para evitar problemas de permissão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erro ao inserir usuário na tabela users: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho para executar a função quando um novo usuário for criado no Auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função RPC para criar perfil de usuário com privilégios elevados
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT DEFAULT '',
  user_avatar_url TEXT DEFAULT ''
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (user_id, user_email, user_full_name, user_avatar_url)
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  
  result := json_build_object('success', true);
  RETURN result;
EXCEPTION 
  WHEN OTHERS THEN
    result := json_build_object('success', false, 'error', SQLERRM);
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir que qualquer usuário chame esta função (importante para o processo de cadastro)
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO service_role;

-- ########## POLÍTICAS DE SEGURANÇA (RLS) ##########

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela users
CREATE POLICY "Usuários podem ver apenas seu próprio perfil"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar apenas seu próprio perfil"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Política para a função trigger criar usuários
CREATE POLICY "Função do sistema pode criar perfis"
  ON public.users
  FOR INSERT
  TO postgres
  WITH CHECK (true);

-- Políticas mais permissivas para INSERT na tabela users
CREATE POLICY "Usuários podem criar seu próprio perfil"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Políticas para tabela workout_plans
CREATE POLICY "Usuários podem ver apenas seus próprios treinos"
  ON public.workout_plans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios treinos"
  ON public.workout_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios treinos"
  ON public.workout_plans
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios treinos"
  ON public.workout_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para tabela exercises
CREATE POLICY "Usuários podem ver seus exercícios"
  ON public.exercises
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp 
      WHERE wp.id = workout_plan_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar exercícios em seus treinos"
  ON public.exercises
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp 
      WHERE wp.id = workout_plan_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar exercícios em seus treinos"
  ON public.exercises
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp 
      WHERE wp.id = workout_plan_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar exercícios em seus treinos"
  ON public.exercises
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp 
      WHERE wp.id = workout_plan_id AND wp.user_id = auth.uid()
    )
  );

-- Políticas para tabela exercise_images
CREATE POLICY "Usuários podem ver imagens de seus exercícios"
  ON public.exercise_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exercises e 
      JOIN public.workout_plans wp ON e.workout_plan_id = wp.id 
      WHERE e.id = exercise_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem adicionar imagens em seus exercícios"
  ON public.exercise_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exercises e 
      JOIN public.workout_plans wp ON e.workout_plan_id = wp.id 
      WHERE e.id = exercise_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar imagens em seus exercícios"
  ON public.exercise_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exercises e 
      JOIN public.workout_plans wp ON e.workout_plan_id = wp.id 
      WHERE e.id = exercise_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar imagens em seus exercícios"
  ON public.exercise_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exercises e 
      JOIN public.workout_plans wp ON e.workout_plan_id = wp.id 
      WHERE e.id = exercise_id AND wp.user_id = auth.uid()
    )
  );

-- Políticas para tabela workout_history
CREATE POLICY "Usuários podem ver apenas seu próprio histórico"
  ON public.workout_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem registrar apenas seu próprio histórico"
  ON public.workout_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seu próprio histórico"
  ON public.workout_history
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar apenas seu próprio histórico"
  ON public.workout_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para tabela exercise_logs
CREATE POLICY "Usuários podem ver apenas seus próprios logs"
  ON public.exercise_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_history wh 
      WHERE wh.id = workout_history_id AND wh.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem registrar apenas seus próprios logs"
  ON public.exercise_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_history wh 
      WHERE wh.id = workout_history_id AND wh.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar apenas seus próprios logs"
  ON public.exercise_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_history wh 
      WHERE wh.id = workout_history_id AND wh.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar apenas seus próprios logs"
  ON public.exercise_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_history wh 
      WHERE wh.id = workout_history_id AND wh.user_id = auth.uid()
    )
  );

-- Definir permissões de acesso às tabelas
GRANT ALL ON public.users TO postgres, service_role;
GRANT ALL ON public.workout_plans TO postgres, service_role;
GRANT ALL ON public.exercises TO postgres, service_role;
GRANT ALL ON public.exercise_images TO postgres, service_role;
GRANT ALL ON public.workout_history TO postgres, service_role;
GRANT ALL ON public.exercise_logs TO postgres, service_role;

GRANT SELECT ON public.users TO anon, authenticated;
GRANT INSERT ON public.users TO anon, authenticated;
GRANT UPDATE ON public.users TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE workout_plans_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE exercises_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE exercise_images_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE workout_history_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE exercise_logs_id_seq TO authenticated;

-- Confirmar conclusão bem-sucedida
SELECT 'Configuração do banco de dados do Bonde da Maromba concluída com sucesso!' as resultado; 