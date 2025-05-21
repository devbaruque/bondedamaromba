// Importando os clientes específicos para Auth e DB
import { GoTrueClient } from '@supabase/gotrue-js';
import { PostgrestClient } from '@supabase/postgrest-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/env';

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

// Headers padrão para todas as requisições
const defaultHeaders = {
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
};

// Cliente de autenticação
export const auth = new GoTrueClient({
  url: `${supabaseUrl}/auth/v1`,
  headers: defaultHeaders,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
  storage: AsyncStorage,
});

// Cliente de banco de dados
export const db = new PostgrestClient(`${supabaseUrl}/rest/v1`, {
  headers: defaultHeaders,
});

/**
 * Implementação do Storage API usando fetch
 * @param {string} bucket - Nome do bucket
 * @returns {Object} - API do storage
 */
const createStorageClient = (bucket) => {
  return {
    // Upload de arquivos
    upload: async (path, file) => {
      try {
        // Criar um FormData para envio do arquivo
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `${supabaseUrl}/storage/v1/object/${bucket}/${path}`,
          {
            method: 'POST',
            headers: {
              ...defaultHeaders,
              // O Content-Type será definido automaticamente pelo FormData
            },
            body: formData,
          }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao fazer upload');
        }

        return { data };
      } catch (error) {
        console.error('Erro no upload:', error);
        return { error };
      }
    },
    
    // Download de arquivos
    download: async (path) => {
      try {
        const response = await fetch(
          `${supabaseUrl}/storage/v1/object/${bucket}/${path}`,
          {
            method: 'GET',
            headers: defaultHeaders,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao fazer download');
        }

        const blob = await response.blob();
        return { data: blob };
      } catch (error) {
        console.error('Erro no download:', error);
        return { error };
      }
    },
    
    // Obter URL pública de um arquivo
    getPublicUrl: (path) => {
      return { 
        data: { 
          publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}` 
        } 
      };
    },
    
    // Remover arquivos
    remove: async (paths) => {
      try {
        // O paths pode ser uma string ou um array de strings
        const pathsArray = Array.isArray(paths) ? paths : [paths];
        
        const response = await fetch(
          `${supabaseUrl}/storage/v1/object/${bucket}/${pathsArray.join(',')}`,
          {
            method: 'DELETE',
            headers: defaultHeaders,
          }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao remover arquivos');
        }

        return { data };
      } catch (error) {
        console.error('Erro ao remover arquivos:', error);
        return { error };
      }
    },
    
    // Listar arquivos em um bucket/pasta
    list: async (options = {}) => {
      try {
        const queryParams = new URLSearchParams();
        
        if (options.path) queryParams.append('prefix', options.path);
        if (options.limit) queryParams.append('limit', options.limit);
        if (options.offset) queryParams.append('offset', options.offset);
        
        const response = await fetch(
          `${supabaseUrl}/storage/v1/object/list/${bucket}?${queryParams.toString()}`,
          {
            method: 'GET',
            headers: defaultHeaders,
          }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao listar arquivos');
        }

        return { data };
      } catch (error) {
        console.error('Erro ao listar arquivos:', error);
        return { error };
      }
    }
  };
};

// Objeto supabase para manter compatibilidade com o código existente
const supabase = {
  auth,
  
  // Métodos para banco de dados
  from: (table) => db.from(table),
  rpc: (functionName, params = {}) => db.rpc(functionName, params),
  
  // Métodos para schemas
  schema: (schema) => ({
    from: (table) => db.schema(schema).from(table),
    rpc: (fn, params) => db.schema(schema).rpc(fn, params)
  }),
  
  // Storage API
  storage: {
    from: (bucket) => createStorageClient(bucket)
  }
};

export default supabase; 