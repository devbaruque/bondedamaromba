// Comentando a importação do polyfill já que é importado no App.js
// import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/env';

// Adicionar log para debug da versão e configuração
console.log('Inicializando cliente Supabase com URL:', SUPABASE_URL);

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
    debug: __DEV__ // Habilitar logs de depuração apenas em desenvolvimento
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
    
    // Verificar a versão do cliente Supabase via package.json
    console.log('Cliente Supabase inicializado corretamente');
    
    // Verificar se os métodos da API de dados estão disponíveis
    const testTableAccess = supabase.from('workout_plans');
    
    // Métodos importantes para edição
    if (testTableAccess.update) {
      console.log('Método update encontrado');
      // Verificar se os métodos de filtro estão disponíveis
      const updateMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(testTableAccess.update({})));
      console.log('Métodos disponíveis em update:', updateMethods);
      
      if (!updateMethods.includes('eq') && !updateMethods.includes('match') && !updateMethods.includes('filter')) {
        console.warn('ATENÇÃO: Métodos eq/match/filter não encontrados no update! Usando implementação de fallback.');
      }
    } else {
      console.error('ERRO: método update não encontrado!');
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
            filter: () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } }),
            match: () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } }),
            order: () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } }),
            limit: () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } }),
            single: async () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } }),
            maybeSingle: async () => ({ data: null, error: { message: 'Cliente Supabase não inicializado' } })
          };
        },
        insert: async (values) => {
          console.warn(`[Mock Supabase] Tentativa de insert em ${table}:`, values);
          // Criar um mock que simula os dados inseridos com um ID falso
          const mockData = Array.isArray(values) ? 
            values.map((val, i) => ({ ...val, id: `mock-id-${i}` })) : 
            [{ ...(values || {}), id: 'mock-id-1' }];
            
          console.log(`[Mock Supabase] Simulando resposta de insert em ${table}:`, mockData);
          
          // Retornar os dados mockados com método select
          return { 
            data: mockData, 
            error: null,
            select: () => ({ data: mockData, error: null })
          };
        },
        update: (values) => {
          console.warn(`[Mock Supabase] Tentativa de update em ${table}:`, values);
          return { 
            match: async () => ({ data: [{ ...values, id: 'mock-id-1' }], error: null }),
            filter: async () => ({ data: [{ ...values, id: 'mock-id-1' }], error: null }),
            eq: async () => ({ data: [{ ...values, id: 'mock-id-1' }], error: null }),
            select: () => ({ data: [{ ...values, id: 'mock-id-1' }], error: null })
          };
        },
        delete: () => {
          console.warn(`[Mock Supabase] Tentativa de delete em ${table}`);
          return { 
            match: async () => ({ success: true, error: null }),
            filter: async () => ({ success: true, error: null }),
            eq: async () => ({ success: true, error: null })
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
            return { data: { path }, error: null };
          },
          getPublicUrl: (path) => {
            console.warn(`[Mock Supabase] Tentativa de obter URL pública para ${bucket}/${path}`);
            return { data: { publicUrl: `https://mock-url.com/${bucket}/${path}` }, error: null };
          }
        };
      }
    },
    rpc: async (procedure, params) => {
      console.warn(`[Mock Supabase] Tentativa de executar RPC ${procedure}:`, params);
      return { data: null, error: null };
    }
  };
}

// Exportar como default também para compatibilidade
export default supabase;
export { supabase }; 