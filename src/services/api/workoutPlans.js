import { supabase } from '../supabase';
import { checkAndRefreshSession } from './auth';
import { directUpdateWorkoutPlan } from './diretUpdateFunctions';

// Função aprimorada para atualizar treinos - IMPLEMENTAÇÃO ALTERNATIVA
export const updateWorkoutPlan = async (id, data) => {
  try {
    console.log('Iniciando atualização do treino (método alternativo)...');
    console.log('ID do treino:', id);
    console.log('Tipo do ID:', typeof id);
    console.log('Dados a serem atualizados:', data);
    
    // Verificar se a sessão está ativa
    const sessionValid = await checkAndRefreshSession();
    if (!sessionValid) {
      console.error('Sessão inválida ou expirada ao tentar atualizar treino');
      throw new Error('Sessão inválida ou expirada');
    }
    
    // Verificar se o treino existe e pertence ao usuário
    const { data: existingWorkouts, error: fetchError } = await supabase
      .from('workout_plans')
      .select('*')
      .filter('id', 'eq', id);
    
    if (fetchError) {
      console.error('Erro ao verificar existência do treino:', fetchError);
      throw fetchError;
    }
    
    const existingWorkout = existingWorkouts && existingWorkouts.length > 0 ? existingWorkouts[0] : null;
    
    if (!existingWorkout) {
      console.error('Treino não encontrado ou sem permissão');
      throw new Error('Treino não encontrado ou sem permissão');
    }
    
    console.log('Treino encontrado:', existingWorkout);
    
    // TENTATIVA 1: Usar RPC (Stored Procedure) para atualização
    try {
      console.log('Tentativa 1: Usando RPC...');
      const { data: updatedWorkouts, error } = await supabase
        .rpc('update_workout_plan', { 
          workout_id: id,
          workout_data: data
        });
      
      if (!error) {
        console.log('Treino atualizado com sucesso usando RPC:', updatedWorkouts);
        return updatedWorkouts[0];
      }
      
      console.log('RPC falhou, tentando próximo método:', error);
    } catch (rpcError) {
      console.log('Erro ao usar RPC:', rpcError);
    }
    
    // TENTATIVA 2: Usar .match()
    try {
      console.log('Tentativa 2: Usando match...');
      const { data: updatedWithMatch, error } = await supabase
        .from('workout_plans')
        .update(data)
        .match({ id });
      
      if (!error) {
        console.log('Treino atualizado com sucesso usando match:', updatedWithMatch);
        return updatedWithMatch[0];
      }
      
      console.log('Match falhou, tentando próximo método:', error);
    } catch (matchError) {
      console.log('Erro ao usar match:', matchError);
    }
    
    // TENTATIVA 3: Usar .filter()
    try {
      console.log('Tentativa 3: Usando filter...');
      const { data: updatedWithFilter, error } = await supabase
        .from('workout_plans')
        .update(data)
        .filter('id', 'eq', id);
      
      if (!error) {
        console.log('Treino atualizado com sucesso usando filter:', updatedWithFilter);
        return updatedWithFilter[0];
      }
      
      console.log('Filter falhou, tentando método final:', error);
    } catch (filterError) {
      console.log('Erro ao usar filter:', filterError);
    }
    
    // TENTATIVA FINAL: Usar a atualização direta via SQL
    console.log('Tentativa final: Usando atualização direta via SQL...');
    const result = await directUpdateWorkoutPlan(id, data);
    
    if (!result) {
      throw new Error('Todas as tentativas de atualização falharam');
    }
    
    return result;
  } catch (err) {
    console.error('Exceção ao atualizar treino:', err);
    throw err;
  }
}; 