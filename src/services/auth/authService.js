import supabase from '../supabase';

/**
 * Realiza login do usuário com email e senha
 * @param {string} email Email do usuário
 * @param {string} password Senha do usuário
 * @returns {Promise} Promessa com o resultado do login
 */
export async function signIn(email, password) {
  try {
    // Adicionar logs detalhados antes da tentativa de login
    console.log(`===== INICIANDO PROCESSO DE LOGIN =====`);
    console.log(`Email: ${email}`);
    console.log(`Senha: ${'*'.repeat(password?.length || 0)}`);
    
    // Verificar se o cliente Supabase está disponível
    if (!supabase || !supabase.auth) {
      console.error('Cliente Supabase não está disponível ou configurado corretamente');
      return { error: 'Erro de conexão com o servidor. Tente novamente mais tarde.' };
    }
    
    // Verificar se a função signInWithPassword está disponível
    if (typeof supabase.auth.signInWithPassword !== 'function') {
      console.error('Método signInWithPassword não disponível no cliente Supabase');
      return { error: 'Erro de configuração do aplicativo. Entre em contato com o suporte.' };
    }
    
    // Validação básica
    if (!email || !password) {
      console.error('Email ou senha não fornecidos');
      return { error: 'Email e senha são obrigatórios' };
    }
    
    console.log('Enviando requisição de login para o Supabase...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erro retornado pelo Supabase:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      console.error('Status HTTP:', error.status);
      
      // Tratando mensagens de erro específicas
      if (error.message === 'Invalid login credentials') {
        console.log('Credenciais inválidas fornecidas');
        return { error: 'Email ou senha inválidos' };
      }
      
      // Tratar erro de email não confirmado
      if (error.message === 'Email not confirmed' || error.message.includes('not confirmed')) {
        console.log('Email não confirmado');
        return { error: 'Seu email ainda não foi confirmado. Por favor, verifique sua caixa de entrada e confirme seu email para continuar.' };
      }
      
      if (error.message.includes('email')) {
        console.log('Erro relacionado ao email');
        return { error: 'Verifique se o email está correto' };
      }
      
      if (error.message.includes('password')) {
        console.log('Erro relacionado à senha');
        return { error: 'Verifique se a senha está correta' };
      }
      
      if (error.status === 429) {
        console.log('Muitas tentativas de login');
        return { error: 'Muitas tentativas de login. Tente novamente mais tarde.' };
      }
      
      if (error.status >= 500) {
        console.log('Erro no servidor Supabase');
        return { error: 'Erro no servidor. Tente novamente mais tarde.' };
      }
      
      // Outros erros
      return { error: error.message || 'Erro ao fazer login' };
    }
    
    // Verificar se os dados retornados são válidos
    if (!data) {
      console.error('Supabase retornou sucesso mas sem dados');
      return { error: 'Resposta inválida do servidor' };
    }
    
    console.log('Resposta do Supabase:', JSON.stringify({
      success: true,
      userId: data.user?.id,
      hasSession: !!data.session,
      email: data.user?.email
    }));
    
    if (!data.user || !data.session) {
      console.error('Supabase retornou dados incompletos:', data);
      return { error: 'Resposta incompleta do servidor' };
    }
    
    console.log('===== LOGIN BEM-SUCEDIDO =====');
    return { data };
  } catch (error) {
    console.error('===== EXCEÇÃO NO PROCESSO DE LOGIN =====');
    console.error('Tipo da exceção:', error.name);
    console.error('Mensagem da exceção:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Verificar tipo específico de erro
    if (error.message && error.message.includes('Email not confirmed')) {
      return { error: 'Seu email ainda não foi confirmado. Por favor, verifique sua caixa de entrada e confirme seu email para continuar.' };
    }
    
    if (error.message && error.message.includes('network')) {
      return { error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
    }
    
    return { error: 'Erro inesperado ao tentar fazer login. Tente novamente mais tarde.' };
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
    const { data: authData, error: authError } = await supabase.auth.signUp({
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
    const { error } = await supabase.auth.signOut();
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
    const { data, error } = await supabase.auth.getSession();
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
    const { data, error } = await supabase.auth.getUser();
    if (error) return { error: error.message || 'Erro ao obter usuário atual' };
    return { user: data.user };
  } catch (error) {
    console.error('Erro inesperado ao obter usuário:', error);
    return { error: 'Erro inesperado ao obter usuário atual' };
  }
}

/**
 * Reenvia o email de confirmação para um usuário
 * @param {string} email Email do usuário
 * @returns {Promise} Promessa com o resultado da operação
 */
export async function resendConfirmationEmail(email) {
  try {
    console.log(`Reenviando email de confirmação para: ${email}`);
    
    if (!email) {
      return { error: 'Email não fornecido' };
    }
    
    // O Supabase exige que o email seja válido
    if (!email.includes('@')) {
      return { error: 'Formato de email inválido' };
    }
    
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) {
      console.error('Erro ao reenviar email de confirmação:', error);
      
      // Tratamento de erros específicos
      if (error.message.includes('already confirmed')) {
        return { error: 'Este email já foi confirmado. Tente fazer login normalmente.' };
      }
      
      if (error.message.includes('not found')) {
        return { error: 'Email não encontrado. Verifique se o endereço está correto.' };
      }
      
      if (error.status === 429) {
        return { error: 'Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.' };
      }
      
      return { error: error.message || 'Erro ao reenviar email de confirmação' };
    }
    
    console.log('Email de confirmação reenviado com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Exceção ao reenviar email de confirmação:', error);
    return { error: 'Erro inesperado ao tentar reenviar o email. Tente novamente mais tarde.' };
  }
} 