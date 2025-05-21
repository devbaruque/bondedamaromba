/**
 * Utilitário para testar o fluxo completo de autenticação do Supabase
 * Este arquivo pode ser usado para verificar se a autenticação está funcionando corretamente
 * 
 * COMO USAR:
 * 1. Importe este utilitário em um componente de desenvolvimento
 * 2. Chame testAuthFlow() e verifique os logs no console
 */

import * as AuthService from '../services/auth/authService';

/**
 * Testa o fluxo completo de autenticação
 * @param {Object} userData Dados para teste (opcional)
 * @returns {Promise<Object>} Resultado dos testes
 */
export async function testAuthFlow(userData = {}) {
  console.log('🧪 INICIANDO TESTES DE AUTENTICAÇÃO');
  const results = {
    success: true,
    steps: {}
  };

  try {
    // Dados de teste
    const testUser = {
      email: userData.email || `teste${Date.now()}@example.com`,
      password: userData.password || 'Teste@123',
      fullName: userData.fullName || 'Usuário de Teste',
      avatarUrl: userData.avatarUrl || null
    };

    console.log('📝 Testando cadastro com:', testUser.email);
    
    // 1. Teste de registro
    const { data: signUpData, error: signUpError } = await AuthService.signUp(
      testUser.email, 
      testUser.password, 
      {
        fullName: testUser.fullName,
        avatarUrl: testUser.avatarUrl
      }
    );

    if (signUpError) {
      console.error('❌ Erro no cadastro:', signUpError);
      results.steps.signUp = { success: false, error: signUpError };
      results.success = false;
    } else {
      console.log('✅ Cadastro realizado com sucesso:', signUpData?.user?.id);
      results.steps.signUp = { success: true, userId: signUpData?.user?.id };
    }

    // 2. Teste de logout (para limpar a sessão atual)
    const { error: signOutError } = await AuthService.signOut();
    
    if (signOutError) {
      console.warn('⚠️ Aviso no logout após registro:', signOutError);
    }

    // 3. Teste de login
    console.log('🔑 Testando login com:', testUser.email);
    const { data: signInData, error: signInError } = await AuthService.signIn(
      testUser.email, 
      testUser.password
    );

    if (signInError) {
      console.error('❌ Erro no login:', signInError);
      results.steps.signIn = { success: false, error: signInError };
      results.success = false;
    } else {
      console.log('✅ Login realizado com sucesso:', signInData?.user?.id);
      results.steps.signIn = { success: true, userId: signInData?.user?.id };
    }

    // 4. Teste de verificação de sessão
    console.log('🔍 Verificando sessão atual');
    const { session, error: sessionError } = await AuthService.getCurrentSession();
    
    if (sessionError || !session) {
      console.error('❌ Erro ao verificar sessão:', sessionError || 'Sessão não encontrada');
      results.steps.session = { success: false, error: sessionError || 'Sessão não encontrada' };
      results.success = false;
    } else {
      console.log('✅ Sessão verificada com sucesso:', session.user.id);
      results.steps.session = { success: true, userId: session.user.id };
    }

    // 5. Teste de obtenção de dados do usuário
    console.log('👤 Obtendo dados do usuário atual');
    const { user, error: userError } = await AuthService.getCurrentUser();
    
    if (userError || !user) {
      console.error('❌ Erro ao obter usuário:', userError || 'Usuário não encontrado');
      results.steps.user = { success: false, error: userError || 'Usuário não encontrado' };
      results.success = false;
    } else {
      console.log('✅ Usuário obtido com sucesso:', user);
      results.steps.user = { success: true, userData: user };
    }

    // 6. Teste de logout final
    console.log('🚪 Testando logout final');
    const { error: finalSignOutError } = await AuthService.signOut();
    
    if (finalSignOutError) {
      console.error('❌ Erro no logout final:', finalSignOutError);
      results.steps.signOut = { success: false, error: finalSignOutError };
      results.success = false;
    } else {
      console.log('✅ Logout final realizado com sucesso');
      results.steps.signOut = { success: true };
    }

    // 7. Verificando se a sessão foi realmente encerrada
    console.log('🔍 Verificando se a sessão foi encerrada');
    const { session: finalSession, error: finalSessionError } = await AuthService.getCurrentSession();
    
    if (finalSession) {
      console.error('❌ A sessão ainda existe após o logout');
      results.steps.sessionAfterLogout = { success: false, error: 'Sessão ainda existe após logout' };
      results.success = false;
    } else {
      console.log('✅ Sessão encerrada com sucesso');
      results.steps.sessionAfterLogout = { success: true };
    }

  } catch (error) {
    console.error('❌ Erro inesperado nos testes:', error);
    results.success = false;
    results.unexpectedError = error.message;
  }

  // Resultado final
  if (results.success) {
    console.log('🎉 TODOS OS TESTES DE AUTENTICAÇÃO PASSARAM COM SUCESSO!');
  } else {
    console.error('❌ ALGUNS TESTES DE AUTENTICAÇÃO FALHARAM. Verifique os logs acima.');
  }

  return results;
}

export default {
  testAuthFlow
}; 