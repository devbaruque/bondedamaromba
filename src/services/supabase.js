// Comentando a importação do polyfill já que é importado no App.js
// import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/env';

// Log mais detalhado para depuração
console.log('Inicializando cliente Supabase:', {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'Não definida'
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente Supabase não definidas corretamente!');
}

// Criar cliente Supabase com configurações para ambiente mobile
let supabase;

try {
  // Verificar se AsyncStorage está disponível
  if (!AsyncStorage) {
    console.error('ERRO: AsyncStorage não está disponível!');
    throw new Error('AsyncStorage não está disponível');
  }
  
  // Verificar se estamos em um ambiente React Native
  if (typeof navigator === 'undefined') {
    console.warn('AVISO: navigator indefinido, possível problema com ambiente React Native');
  }
  
  console.log('Criando cliente Supabase...');
  
  // Criando o cliente com configurações específicas para mobile
  const options = {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    // Ajustando opções para ambiente mobile
    global: {
      fetch: fetch,
    },
    realtime: {
      // Desativar canais realtime para diminuir problemas iniciais
      enabled: false,
    },
  };
  
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
  
  // Log de verificação
  if (supabase && supabase.auth) {
    console.log('Cliente Supabase inicializado com sucesso');
    
    // Verificar se os métodos críticos existem
    if (typeof supabase.auth.getSession !== 'function') {
      console.error('ERRO: supabase.auth.getSession não é uma função!');
    }
    if (typeof supabase.auth.signInWithPassword !== 'function') {
      console.error('ERRO: supabase.auth.signInWithPassword não é uma função!');
    }
  } else {
    console.error('Cliente Supabase foi criado mas auth não está disponível!');
  }
} catch (error) {
  console.error('Erro na criação do cliente Supabase:', error);
  // Criando um cliente manualmente com métodos vazios para evitar erros fatais
  supabase = {
    auth: {
      getSession: async () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } }),
      signUp: async () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } }),
      signOut: async () => ({ error: { message: 'Cliente Supabase não inicializado' } }),
      getUser: async () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } })
    },
    from: (table) => {
      console.warn(`[Mock Supabase] Tentativa de acessar tabela ${table}`);
      return {
        select: (columns) => {
          console.warn(`[Mock Supabase] Tentativa de select ${columns || '*'} em ${table}`);
          return {
            eq: () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } }),
            order: () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } }),
            limit: () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } }),
            single: async () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } })
          };
        },
        insert: async (values) => {
          console.warn(`[Mock Supabase] Tentativa de insert em ${table}:`, values);
          return { data: null, error: { message: 'Cliente Supabase não inicializado' } };
        },
        update: async (values) => {
          console.warn(`[Mock Supabase] Tentativa de update em ${table}:`, values);
          return { 
            eq: () => {
              return {
                select: () => {
                  return {
                    single: async () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } })
                  };
                }
              };
            }
          };
        },
        delete: async () => {
          console.warn(`[Mock Supabase] Tentativa de delete em ${table}`);
          return { 
            eq: async () => ({ error: { message: 'Cliente Supabase não inicializado' } })
          };
        },
      };
    },
    storage: {
      from: (bucket) => {
        console.warn(`[Mock Supabase] Tentativa de acessar bucket ${bucket}`);
        return {
          upload: async (path, file) => {
            console.warn(`[Mock Supabase] Tentativa de upload para ${bucket}/${path}`);
            return { error: { message: 'Cliente Supabase não inicializado' } };
          },
          getPublicUrl: (path) => {
            console.warn(`[Mock Supabase] Tentativa de obter URL pública para ${bucket}/${path}`);
            return { data: null, error: { message: 'Cliente Supabase não inicializado' } };
          }
        };
      }
    }
  };
}

// Verificar se temos acesso ao auth antes de instrumentar
if (supabase && supabase.auth) {
  // Adicionar logs para operações de autenticação
  const originalGetSession = supabase.auth.getSession;
  supabase.auth.getSession = async function() {
    try {
      console.log('[Supabase Auth Debug] Obtendo sessão');
      return await originalGetSession.apply(this);
    } catch (error) {
      console.error('[Supabase Auth Error] getSession falhou:', error);
      throw error;
    }
  };

  // Adicionar logs para operações de banco de dados
  if (supabase.from) {
    const originalFrom = supabase.from;
    supabase.from = function(table) {
      console.log(`[Supabase Debug] Acessando tabela ${table}`);
      const result = originalFrom.call(this, table);
      
      // Adicionar logging para operações insert
      const originalInsert = result.insert;
      result.insert = async function() {
        try {
          console.log(`[Supabase Debug] Inserindo na tabela ${table}:`, arguments[0]);
          return await originalInsert.apply(this, arguments);
        } catch (error) {
          console.error(`[Supabase Error] Insert em ${table} falhou:`, error);
          throw error;
        }
      };
      
      return result;
    };
  }
}

export default supabase; 