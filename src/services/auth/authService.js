import supabase, { auth } from '../supabase';

/**
 * Realiza login do usuário com email e senha
 * @param {string} email Email do usuário
 * @param {string} password Senha do usuário
 * @returns {Promise} Promessa com o resultado do login
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Tratando mensagens de erro específicas
      if (error.message === 'Invalid login credentials') {
        return { error: 'Email ou senha inválidos' };
      }
      // Outros erros
      return { error: error.message || 'Erro ao fazer login' };
    }
    
    return { data };
  } catch (error) {
    console.error('Erro inesperado no login:', error);
    return { error: 'Erro inesperado ao tentar fazer login' };
  }
}

/**
 * Cria o perfil do usuário na tabela users
 * @param {string} userId ID do usuário
 * @param {string} email Email do usuário
 * @param {string} fullName Nome completo do usuário
 * @param {string} avatarUrl URL da imagem de perfil
 * @returns {Promise} Promessa com o resultado da criação
 */
async function createUserProfile(userId, email, fullName, avatarUrl) {
  try {
    console.log('Criando perfil de usuário:', { userId, email, fullName });
    
    // Primeira tentativa: usar a função RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_profile', {
      user_id: userId,
      user_email: email,
      user_full_name: fullName || '',
      user_avatar_url: avatarUrl || ''
    });

    // Verificar se a RPC foi bem-sucedida
    if (!rpcError && rpcData?.success) {
      console.log('Perfil criado com sucesso via RPC');
      return { success: true };
    }
    
    console.warn('Erro ao criar perfil via RPC, tentando método direto:', rpcError);

    // Segunda tentativa: Método direto com cliente autenticado
    const { data: directData, error: directError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: email,
          full_name: fullName || '',
          avatar_url: avatarUrl || '',
        }
      ]);

    if (directError) {
      console.error('Erro ao inserir diretamente na tabela users:', directError);
      return { error: directError.message || 'Erro ao criar perfil do usuário' };
    }
    
    console.log('Perfil criado com sucesso pelo método direto');
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar perfil do usuário:', error);
    return { error: error.message || 'Erro desconhecido ao criar perfil' };
  }
}

/**
 * Cadastra um novo usuário
 * @param {string} email Email do usuário
 * @param {string} password Senha do usuário
 * @param {object} userData Dados adicionais do usuário
 * @returns {Promise} Promessa com o resultado do cadastro
 */
export async function signUp(email, password, userData = {}) {
  try {
    console.log('Iniciando cadastro para:', email);
    
    // Cadastro do usuário no Auth com os metadados
    const { data: authData, error: authError } = await auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.fullName || '',
          avatar_url: userData.avatarUrl || '',
        },
      },
    });

    if (authError) {
      // Tratando mensagens de erro específicas
      if (authError.message.includes('already registered')) {
        return { error: 'Este email já está registrado' };
      }
      
      // Outros erros
      console.error('Erro no cadastro Auth:', authError);
      return { error: authError.message || 'Erro ao criar conta' };
    }

    // Se o usuário foi criado com sucesso, inserimos na tabela users
    if (authData?.user?.id) {
      console.log('Usuário criado no Auth com sucesso:', authData.user.id);
      
      const profileResult = await createUserProfile(
        authData.user.id,
        email,
        userData.fullName,
        userData.avatarUrl
      );
      
      if (profileResult.error) {
        console.error('Erro ao criar perfil:', profileResult.error);
        // Repassar o erro para o cliente mesmo que tenhamos criado o usuário Auth
        return { error: `Conta criada parcialmente: ${profileResult.error}. Entre em contato com o suporte.` };
      }
      
      console.log('Cadastro concluído com sucesso');
    } else {
      console.warn('Auth retornou sucesso mas sem dados de usuário');
    }

    return { data: authData };
  } catch (error) {
    console.error('Erro inesperado no cadastro:', error);
    return { error: 'Erro inesperado ao tentar criar conta' };
  }
}

/**
 * Realiza logout do usuário
 * @returns {Promise} Promessa com o resultado do logout
 */
export async function signOut() {
  try {
    const { error } = await auth.signOut();
    if (error) return { error: error.message || 'Erro ao sair da conta' };
    return { success: true };
  } catch (error) {
    console.error('Erro inesperado no logout:', error);
    return { error: 'Erro inesperado ao tentar sair da conta' };
  }
}

/**
 * Verifica se há uma sessão ativa
 * @returns {Promise} Promessa com a sessão ou null
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await auth.getSession();
    if (error) return { error: error.message || 'Erro ao verificar sessão' };
    return { session: data.session };
  } catch (error) {
    console.error('Erro inesperado ao obter sessão:', error);
    return { error: 'Erro inesperado ao verificar sessão' };
  }
}

/**
 * Obtém o usuário atual
 * @returns {Promise} Promessa com o usuário ou null
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await auth.getUser();
    if (error) return { error: error.message || 'Erro ao obter usuário atual' };
    return { user: data.user };
  } catch (error) {
    console.error('Erro inesperado ao obter usuário:', error);
    return { error: 'Erro inesperado ao obter usuário atual' };
  }
} 