import React, { createContext, useContext, useState, useEffect } from 'react';
import * as AuthService from '../services/auth/authService';

// Criando o contexto
export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Verifica se existe uma sessão ativa ao iniciar o app
  useEffect(() => {
    checkUserSession();
  }, []);

  // Função para verificar a sessão do usuário
  const checkUserSession = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      const { session: activeSession, error: sessionError } = await AuthService.getCurrentSession();
      
      if (sessionError) {
        console.warn('Erro ao verificar sessão:', sessionError);
        setUser(null);
        setSession(null);
        return;
      }
      
      if (!activeSession) {
        // Nenhuma sessão ativa
        setUser(null);
        setSession(null);
        return;
      }
      
      setSession(activeSession);
      
      // Busca informações do usuário
      const { user: userData, error: userError } = await AuthService.getCurrentUser();
      
      if (userError) {
        console.warn('Erro ao obter dados do usuário:', userError);
        setUser(null);
        return;
      }
      
      // Usuário autenticado com sucesso
      setUser(userData);
      
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para login
  const signIn = async (email, password) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { data, error } = await AuthService.signIn(email, password);
      
      if (error) {
        setAuthError(error);
        return { error };
      }
      
      if (data?.session && data?.user) {
        setUser(data.user);
        setSession(data.session);
        return { success: true };
      } else {
        // Login bem-sucedido mas sem retorno de dados esperados
        setAuthError('Login não retornou os dados esperados');
        return { error: 'Login não retornou os dados esperados' };
      }
    } catch (error) {
      console.error('Erro no signIn:', error);
      const errorMessage = 'Erro ao fazer login. Tente novamente mais tarde.';
      setAuthError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Função para cadastro
  const signUp = async (email, password, userData) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { data, error } = await AuthService.signUp(email, password, userData);
      
      if (error) {
        setAuthError(error);
        return { error };
      }
      
      // Alguns provedores podem não retornar a sessão imediatamente após o cadastro
      if (data?.session && data?.user) {
        setUser(data.user);
        setSession(data.session);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro no signUp:', error);
      const errorMessage = 'Erro ao criar conta. Tente novamente mais tarde.';
      setAuthError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Função para logout
  const signOut = async () => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { error } = await AuthService.signOut();
      
      if (error) {
        setAuthError(error);
        return { error };
      }
      
      setUser(null);
      setSession(null);
      return { success: true };
    } catch (error) {
      console.error('Erro no signOut:', error);
      const errorMessage = 'Erro ao sair da conta.';
      setAuthError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        session, 
        isLoading,
        isAuthenticated: !!user,
        authError,
        signIn,
        signUp,
        signOut,
        refreshUser: checkUserSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para facilitar o uso do contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}; 