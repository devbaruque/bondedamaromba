import supabase from '../services/supabase';

/**
 * Utilitário para testar autenticação no Supabase
 */

/**
 * Testa o login com email e senha
 * @param {string} email Email do usuário
 * @param {string} password Senha do usuário
 * @returns {Promise} Resultado do teste
 */
export async function testLogin(email, password) {
  console.log(`🔑 Testando login com: ${email}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error(`❌ Erro no login: ${error.message}`);
      return { error: error.message };
    }

    console.log(`✅ Login bem-sucedido para: ${email}`);
    console.log(`👤 Dados do usuário: ${JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      lastSignIn: data.user.last_sign_in_at
    })}`);

    return { data };
  } catch (e) {
    console.error(`❌ Erro inesperado no login: ${e.message}`);
    return { error: e.message };
  }
}

/**
 * Verifica se há uma sessão ativa
 * @returns {Promise} Resultado do teste
 */
export async function checkSession() {
  console.log(`🔍 Verificando sessão atual`);
  
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error(`❌ Erro ao verificar sessão: ${error.message}`);
      return { error: error.message };
    }

    if (!data.session) {
      console.error(`❌ Erro ao verificar sessão: Sessão não encontrada`);
      return { error: 'Sessão não encontrada' };
    }

    console.log(`✅ Sessão válida encontrada`);
    console.log(`👤 Usuário autenticado: ${data.session.user.email}`);
    return { data };
  } catch (e) {
    console.error(`❌ Erro inesperado ao verificar sessão: ${e.message}`);
    return { error: e.message };
  }
}

/**
 * Tenta fazer logout
 * @returns {Promise} Resultado do teste
 */
export async function testLogout() {
  console.log(`🚪 Testando logout`);
  
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(`❌ Erro ao fazer logout: ${error.message}`);
      return { error: error.message };
    }

    console.log(`✅ Logout realizado com sucesso`);
    return { success: true };
  } catch (e) {
    console.error(`❌ Erro inesperado ao fazer logout: ${e.message}`);
    return { error: e.message };
  }
}

/**
 * Executa todos os testes de autenticação
 * @param {string} email Email do usuário para teste
 * @param {string} password Senha do usuário para teste
 */
export async function runFullLoginTest(email, password) {
  console.log(`\n🧪 INICIANDO TESTES DE LOGIN\n`);
  
  // Testar login
  const loginResult = await testLogin(email, password);
  if (loginResult.error) {
    console.error(`❌ TESTE DE LOGIN FALHOU`);
    return { success: false, error: loginResult.error };
  }
  
  // Verificar sessão
  const sessionResult = await checkSession();
  if (sessionResult.error) {
    console.error(`❌ TESTE DE SESSÃO FALHOU`);
    return { success: false, error: sessionResult.error };
  }
  
  // Testar logout
  const logoutResult = await testLogout();
  if (logoutResult.error) {
    console.error(`❌ TESTE DE LOGOUT FALHOU`);
    return { success: false, error: logoutResult.error };
  }

  // Verificar se logout funcionou
  const finalCheck = await checkSession();
  if (!finalCheck.error) {
    console.error(`❌ TESTE FINAL FALHOU - AINDA HÁ UMA SESSÃO ATIVA`);
    return { success: false, error: 'Logout não encerrou a sessão corretamente' };
  }

  console.log(`\n✅ TODOS OS TESTES DE LOGIN CONCLUÍDOS COM SUCESSO\n`);
  return { success: true };
}

/**
 * Solicita redefinição de senha para um email
 * @param {string} email Email do usuário
 * @returns {Promise} Resultado do processo
 */
export async function requestPasswordReset(email) {
  console.log(`🔑 Solicitando redefinição de senha para: ${email}`);
  
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'bondedamaromba://reset-password',
    });

    if (error) {
      console.error(`❌ Erro ao solicitar redefinição: ${error.message}`);
      return { error: error.message };
    }

    console.log(`✅ Email de redefinição enviado para: ${email}`);
    return { success: true };
  } catch (e) {
    console.error(`❌ Erro inesperado ao solicitar redefinição: ${e.message}`);
    return { error: e.message };
  }
}

/**
 * Verifica o status de confirmação de um email
 * @param {string} email Email do usuário
 * @returns {Promise} Resultado da verificação
 */
export async function checkEmailConfirmationStatus(email) {
  console.log(`📧 Verificando status de confirmação para: ${email}`);
  
  try {
    // Infelizmente, a API pública não oferece uma maneira direta de checar o status
    // de confirmação de um email específico. A melhor abordagem é tentar fazer login 
    // e verificar se há erro de "Email not confirmed"
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'senha-incorreta-para-testar-status' // Senha incorreta deliberadamente 
    });

    if (error) {
      if (error.message === 'Email not confirmed') {
        console.log(`⚠️ Email ainda não confirmado: ${email}`);
        return { confirmed: false, reason: 'not_confirmed' };
      } else if (error.message === 'Invalid login credentials') {
        // Se o erro for de credenciais inválidas, significa que o email existe e está confirmado,
        // só a senha que está incorreta
        console.log(`✅ Email confirmado: ${email}`);
        return { confirmed: true };
      } else {
        console.error(`❌ Erro ao verificar status: ${error.message}`);
        return { error: error.message };
      }
    }

    // Se não houver erro, significa que o login foi bem-sucedido (improvável neste teste)
    console.log(`✅ Email confirmado e credenciais corretas: ${email}`);
    return { confirmed: true };
  } catch (e) {
    console.error(`❌ Erro inesperado ao verificar status: ${e.message}`);
    return { error: e.message };
  }
}

export default {
  testLogin,
  checkSession,
  testLogout,
  runFullLoginTest,
  requestPasswordReset,
  checkEmailConfirmationStatus
}; 