import { supabase } from '../services/supabase';

/**
 * Migração para adicionar a coluna 'order' à tabela 'exercises'
 * Esta migração pode ser executada manualmente através do console do Supabase ou chamando esta função
 */
export const addOrderColumnToExercises = async () => {
  try {
    console.log('[Migração] Iniciando migração para adicionar coluna order à tabela exercises');
    
    // Verificar se a coluna já existe
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'exercises')
      .eq('column_name', 'order');
    
    if (columnsError) {
      console.error('[Migração] Erro ao verificar se a coluna já existe:', columnsError);
      throw columnsError;
    }
    
    // Se a coluna já existir, não precisa fazer nada
    if (columns && columns.length > 0) {
      console.log('[Migração] A coluna order já existe na tabela exercises');
      return { success: true, message: 'A coluna order já existe na tabela exercises' };
    }
    
    // Adicionar a coluna 'order' como integer com valor padrão 0
    const { error } = await supabase.rpc('execute_sql', { 
      sql_query: `
        ALTER TABLE exercises
        ADD COLUMN "order" INTEGER DEFAULT 0;
      `
    });
    
    if (error) {
      console.error('[Migração] Erro ao adicionar coluna order:', error);
      throw error;
    }
    
    console.log('[Migração] Coluna order adicionada com sucesso à tabela exercises');
    
    // Atualizar os registros existentes para terem valores únicos por workout_plan_id
    const { error: updateError } = await supabase.rpc('execute_sql', {
      sql_query: `
        WITH numbered_exercises AS (
          SELECT 
            id,
            workout_plan_id,
            ROW_NUMBER() OVER (PARTITION BY workout_plan_id ORDER BY created_at) AS row_num
          FROM exercises
        )
        UPDATE exercises
        SET "order" = numbered_exercises.row_num
        FROM numbered_exercises
        WHERE exercises.id = numbered_exercises.id;
      `
    });
    
    if (updateError) {
      console.error('[Migração] Erro ao atualizar valores da coluna order:', updateError);
      throw updateError;
    }
    
    console.log('[Migração] Valores da coluna order atualizados com sucesso');
    
    return { success: true, message: 'Migração concluída com sucesso' };
  } catch (error) {
    console.error('[Migração] Erro ao executar migração:', error);
    return { success: false, error };
  }
};

// Exportar a função para poder ser executada de outros lugares
export default addOrderColumnToExercises; 