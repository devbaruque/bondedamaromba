import { supabase } from '../services/supabase';

export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.supabase = supabase;
  }

  async findById(id) {
    try {
      console.log(`[Repository] Buscando ${this.tableName} com ID: ${id}`);
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .filter('id', 'eq', id)
        .maybeSingle();
      
      if (error) {
        console.error(`[Repository] Erro ao buscar ${this.tableName} por ID:`, error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`[Repository] Erro ao buscar ${this.tableName} por ID:`, error);
      throw error;
    }
  }

  async findAll(options = {}) {
    try {
      console.log(`[Repository] Buscando todos os registros de ${this.tableName}`);
      let query = this.supabase.from(this.tableName).select(options.select || '*');
      
      if (options.filter) {
        query = query.filter(options.filter.column, options.filter.operator, options.filter.value);
      }
      
      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending });
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error(`[Repository] Erro ao buscar todos ${this.tableName}:`, error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error(`[Repository] Erro ao buscar todos ${this.tableName}:`, error);
      throw error;
    }
  }

  async create(data) {
    try {
      console.log(`[Repository] Criando registro em ${this.tableName}:`, data);
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(data)
        .select();
      
      if (error) {
        console.error(`[Repository] Erro ao criar ${this.tableName}:`, error);
        throw error;
      }
      
      console.log(`[Repository] Registro criado com sucesso em ${this.tableName}:`, result);
      return result[0];
    } catch (error) {
      console.error(`[Repository] Erro ao criar ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      console.log(`[Repository] Atualizando ${this.tableName} com ID ${id}:`, data);
      
      // Adicionar timestamp de atualização se não estiver presente nos dados
      const dataToUpdate = { 
        ...data, 
        updated_at: data.updated_at || new Date() 
      };
      
      // Tentativa 1: Usando match
      try {
        console.log(`[Repository] Tentativa 1: Atualizando com match`);
        const { data: result, error } = await this.supabase
          .from(this.tableName)
          .update(dataToUpdate)
          .match({ id })
          .select();
        
        if (!error) {
          console.log(`[Repository] Atualização bem-sucedida com match:`, result);
          return result[0];
        }
        
        console.log(`[Repository] Falha ao atualizar com match:`, error);
      } catch (e) {
        console.log(`[Repository] Falha ao usar match para ${this.tableName}:`, e);
      }
      
      // Tentativa 2: Usando filter
      try {
        console.log(`[Repository] Tentativa 2: Atualizando com filter`);
        const { data: result, error } = await this.supabase
          .from(this.tableName)
          .update(dataToUpdate)
          .filter('id', 'eq', id)
          .select();
        
        if (!error) {
          console.log(`[Repository] Atualização bem-sucedida com filter:`, result);
          return result[0];
        }
        
        console.log(`[Repository] Falha ao atualizar com filter:`, error);
      } catch (e) {
        console.log(`[Repository] Falha ao usar filter para ${this.tableName}:`, e);
      }
      
      // Tentativa 3: Construir a query diretamente
      try {
        console.log(`[Repository] Tentativa 3: Atualizando com SQL direto`);
        
        // Construir a consulta SQL manualmente
        const updateFields = Object.entries(dataToUpdate)
          .map(([key, value]) => {
            // Para valores de string, adicionar aspas
            const formattedValue = typeof value === 'string' 
              ? `'${value.replace(/'/g, "''")}'` // Escapar aspas simples
              : value === null 
                ? 'NULL' 
                : value instanceof Date
                  ? `'${value.toISOString()}'`
                  : value;
            
            return `${key} = ${formattedValue}`;
          })
          .join(', ');
        
        // Consulta SQL
        const query = `
          UPDATE ${this.tableName} 
          SET ${updateFields}
          WHERE id = '${id}'
          RETURNING *;
        `;
        
        console.log(`[Repository] SQL Query:`, query);
        
        // Executar a consulta SQL
        const { data: result, error } = await this.supabase.rpc('execute_sql', { sql_query: query });
        
        if (!error && result && result.length > 0) {
          console.log(`[Repository] Atualização bem-sucedida com SQL direto:`, result);
          return result[0];
        }
        
        console.log(`[Repository] Falha ao atualizar com SQL direto:`, error || 'Nenhum resultado retornado');
      } catch (e) {
        console.log(`[Repository] Falha ao usar SQL direto para ${this.tableName}:`, e);
      }
      
      throw new Error(`Não foi possível atualizar ${this.tableName} com ID ${id} após múltiplas tentativas`);
    } catch (error) {
      console.error(`[Repository] Erro ao atualizar ${this.tableName}:`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      console.log(`[Repository] Excluindo ${this.tableName} com ID: ${id}`);
      
      // Tentativa 1: Usando match
      try {
        const { error } = await this.supabase
          .from(this.tableName)
          .delete()
          .match({ id });
        
        if (!error) {
          console.log(`[Repository] Exclusão bem-sucedida`);
          return true;
        }
        
        console.log(`[Repository] Falha ao excluir com match:`, error);
      } catch (e) {
        console.log(`[Repository] Falha ao usar match para exclusão:`, e);
      }
      
      // Tentativa 2: Usando filter
      try {
        const { error } = await this.supabase
          .from(this.tableName)
          .delete()
          .filter('id', 'eq', id);
        
        if (!error) {
          console.log(`[Repository] Exclusão bem-sucedida com filter`);
          return true;
        }
        
        console.log(`[Repository] Falha ao excluir com filter:`, error);
      } catch (e) {
        console.log(`[Repository] Falha ao usar filter para exclusão:`, e);
      }
      
      throw new Error(`Não foi possível excluir ${this.tableName} com ID ${id}`);
    } catch (error) {
      console.error(`[Repository] Erro ao excluir ${this.tableName}:`, error);
      throw error;
    }
  }
} 