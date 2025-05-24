import { supabase } from '../supabase';
import { checkAndRefreshSession } from './auth';
import { directUpdateExercise } from './diretUpdateFunctions';

// Função aprimorada para atualizar exercícios - IMPLEMENTAÇÃO ALTERNATIVA
export const updateExercise = async (id, data) => {
  try {
    console.log('Iniciando atualização do exercício (método alternativo)...');
    console.log('ID do exercício:', id);
    console.log('Tipo do ID:', typeof id);
    console.log('Dados a serem atualizados:', data);
    
    // Verificar se a sessão está ativa
    const sessionValid = await checkAndRefreshSession();
    if (!sessionValid) {
      console.error('Sessão inválida ou expirada ao tentar atualizar exercício');
      throw new Error('Sessão inválida ou expirada');
    }
    
    // Verificar se o exercício existe e pertence a um treino do usuário
    const { data: exerciseList, error: fetchError } = await supabase
      .from('exercises')
      .select(`
        *,
        workout_plans:workout_plan_id (
          id,
          user_id
        )
      `)
      .filter('id', 'eq', id);
    
    if (fetchError) {
      console.error('Erro ao verificar existência do exercício:', fetchError);
      throw fetchError;
    }
    
    const existingExercise = exerciseList && exerciseList.length > 0 ? exerciseList[0] : null;
    
    if (!existingExercise) {
      console.error('Exercício não encontrado ou sem permissão');
      throw new Error('Exercício não encontrado ou sem permissão');
    }
    
    console.log('Exercício encontrado:', existingExercise);
    
    // Verificar o workout_plan_id, se estiver sendo atualizado
    if (data.workout_plan_id && data.workout_plan_id !== existingExercise.workout_plan_id) {
      const { data: workoutPlans, error: workoutError } = await supabase
        .from('workout_plans')
        .select('id')
        .filter('id', 'eq', data.workout_plan_id);
      
      const workoutPlan = workoutPlans && workoutPlans.length > 0 ? workoutPlans[0] : null;
      
      if (workoutError || !workoutPlan) {
        console.error('Treino de destino não encontrado ou sem permissão:', workoutError);
        throw new Error('Treino de destino não encontrado ou sem permissão');
      }
    }
    
    // TENTATIVA 1: Usar RPC (Stored Procedure) para atualização
    try {
      console.log('Tentativa 1: Usando RPC...');
      const { data: updatedExercises, error } = await supabase
        .rpc('update_exercise', { 
          exercise_id: id,
          exercise_data: data
        });
      
      if (!error) {
        console.log('Exercício atualizado com sucesso usando RPC:', updatedExercises);
        return updatedExercises[0];
      }
      
      console.log('RPC falhou, tentando próximo método:', error);
    } catch (rpcError) {
      console.log('Erro ao usar RPC:', rpcError);
    }
    
    // TENTATIVA 2: Usar .match()
    try {
      console.log('Tentativa 2: Usando match...');
      const { data: updatedWithMatch, error } = await supabase
        .from('exercises')
        .update(data)
        .match({ id });
      
      if (!error) {
        console.log('Exercício atualizado com sucesso usando match:', updatedWithMatch);
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
        .from('exercises')
        .update(data)
        .filter('id', 'eq', id);
      
      if (!error) {
        console.log('Exercício atualizado com sucesso usando filter:', updatedWithFilter);
        return updatedWithFilter[0];
      }
      
      console.log('Filter falhou, tentando método final:', error);
    } catch (filterError) {
      console.log('Erro ao usar filter:', filterError);
    }
    
    // TENTATIVA FINAL: Usar a atualização direta via SQL
    console.log('Tentativa final: Usando atualização direta via SQL...');
    const result = await directUpdateExercise(id, data);
    
    if (!result) {
      throw new Error('Todas as tentativas de atualização falharam');
    }
    
    return result;
  } catch (err) {
    console.error('Exceção ao atualizar exercício:', err);
    throw err;
  }
}; 