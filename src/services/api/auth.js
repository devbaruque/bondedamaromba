// Função para verificar e possivelmente atualizar a sessão
export const checkAndRefreshSession = async () => {
  try {
    console.log('Verificando sessão atual...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('Sessão não encontrada');
      return false;
    }
    
    // Verificar se o token está próximo de expirar (menos de 5 minutos)
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (expiresAt - now < fiveMinutes) {
      console.log('Token próximo de expirar, tentando refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Erro ao atualizar sessão:', refreshError);
        return false;
      }
      
      console.log('Sessão atualizada com sucesso');
      return true;
    }
    
    console.log('Sessão válida');
    return true;
  } catch (err) {
    console.error('Erro ao verificar sessão:', err);
    return false;
  }
}; 