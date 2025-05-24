import { supabase } from '../supabase';

/**
 * Atualiza um plano de treino diretamente usando SQL para contornar problemas de API
 * Esta é uma solução de último recurso se outras abordagens falharem
 */
export const directUpdateWorkoutPlan = async (id, data) => {
  try {
    console.log('Executando atualização direta via SQL para o treino:', id);
    
    // Construir a consulta SQL manualmente
    const updateFields = Object.entries(data)
      .map(([key, value]) => {
        // Para valores de string, adicionar aspas
        const formattedValue = typeof value === 'string' 
          ? `'${value.replace(/'/g, "''")}'` // Escapar aspas simples
          : value === null 
            ? 'NULL' 
            : value;
        
        return `${key} = ${formattedValue}`;
      })
      .join(', ');
    
    // Adicionar timestamp de atualização se não estiver presente nos dados
    const updateWithTimestamp = data.updated_at 
      ? updateFields 
      : `${updateFields}, updated_at = now()`;
    
    // Consulta SQL
    const query = `
      UPDATE workout_plans 
      SET ${updateWithTimestamp}
      WHERE id = '${id}'
      RETURNING *;
    `;
    
    console.log('SQL Query:', query);
    
    // Executar a consulta SQL
    const { data: result, error } = await supabase.rpc('execute_sql', { sql_query: query });
    
    if (error) {
      console.error('Erro ao executar SQL para atualizar treino:', error);
      throw error;
    }
    
    console.log('Resultado da atualização direta:', result);
    return result && result.length > 0 ? result[0] : null;
  } catch (err) {
    console.error('Erro na atualização direta do treino:', err);
    throw err;
  }
};

/**
 * Atualiza um exercício diretamente usando SQL para contornar problemas de API
 * Esta é uma solução de último recurso se outras abordagens falharem
 */
export const directUpdateExercise = async (id, data) => {
  try {
    console.log('Executando atualização direta via SQL para o exercício:', id);
    
    // Construir a consulta SQL manualmente
    const updateFields = Object.entries(data)
      .map(([key, value]) => {
        // Para valores de string, adicionar aspas
        const formattedValue = typeof value === 'string' 
          ? `'${value.replace(/'/g, "''")}'` // Escapar aspas simples
          : value === null 
            ? 'NULL' 
            : value;
        
        return `${key} = ${formattedValue}`;
      })
      .join(', ');
    
    // Adicionar timestamp de atualização se não estiver presente nos dados
    const updateWithTimestamp = data.updated_at 
      ? updateFields 
      : `${updateFields}, updated_at = now()`;
    
    // Consulta SQL
    const query = `
      UPDATE exercises 
      SET ${updateWithTimestamp}
      WHERE id = '${id}'
      RETURNING *;
    `;
    
    console.log('SQL Query:', query);
    
    // Executar a consulta SQL
    const { data: result, error } = await supabase.rpc('execute_sql', { sql_query: query });
    
    if (error) {
      console.error('Erro ao executar SQL para atualizar exercício:', error);
      throw error;
    }
    
    console.log('Resultado da atualização direta:', result);
    return result && result.length > 0 ? result[0] : null;
  } catch (err) {
    console.error('Erro na atualização direta do exercício:', err);
    throw err;
  }
}; 