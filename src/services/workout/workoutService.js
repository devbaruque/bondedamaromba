import supabase from '../supabase';

/**
 * Busca todos os planos de treino do usuário atual
 * @returns {Promise} Promessa com a lista de treinos
 */
export async function getWorkoutPlans() {
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Erro ao buscar planos de treino:', error);
    return { error: error.message || 'Erro ao buscar planos de treino' };
  }
}

/**
 * Busca um plano de treino específico pelo ID
 * @param {string} id ID do plano de treino
 * @returns {Promise} Promessa com o plano de treino
 */
export async function getWorkoutPlanById(id) {
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return { data };
  } catch (error) {
    console.error(`Erro ao buscar plano de treino com ID ${id}:`, error);
    return { error: error.message || 'Erro ao buscar plano de treino' };
  }
}

/**
 * Cria um novo plano de treino
 * @param {Object} workoutPlan Dados do plano de treino
 * @returns {Promise} Promessa com o plano de treino criado
 */
export async function createWorkoutPlan(workoutPlan) {
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .insert([workoutPlan])
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Erro ao criar plano de treino:', error);
    return { error: error.message || 'Erro ao criar plano de treino' };
  }
}

/**
 * Atualiza um plano de treino existente
 * @param {string} id ID do plano de treino
 * @param {Object} updates Dados atualizados
 * @returns {Promise} Promessa com o plano de treino atualizado
 */
export async function updateWorkoutPlan(id, updates) {
  try {
    const { data, error } = await supabase
      .from('workout_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  } catch (error) {
    console.error(`Erro ao atualizar plano de treino com ID ${id}:`, error);
    return { error: error.message || 'Erro ao atualizar plano de treino' };
  }
}

/**
 * Exclui um plano de treino
 * @param {string} id ID do plano de treino
 * @returns {Promise} Promessa com o resultado da operação
 */
export async function deleteWorkoutPlan(id) {
  try {
    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error(`Erro ao excluir plano de treino com ID ${id}:`, error);
    return { error: error.message || 'Erro ao excluir plano de treino' };
  }
}

/**
 * Faz upload de uma imagem para um plano de treino
 * @param {File} file Arquivo de imagem
 * @param {string} workoutPlanId ID do plano de treino
 * @returns {Promise} Promessa com a URL da imagem
 */
export async function uploadWorkoutImage(file, workoutPlanId) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${workoutPlanId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('workout-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('workout-images')
      .getPublicUrl(filePath);

    if (!urlData) throw new Error('Não foi possível obter a URL da imagem');

    return { data: { url: urlData.publicUrl } };
  } catch (error) {
    console.error('Erro ao fazer upload de imagem:', error);
    return { error: error.message || 'Erro ao fazer upload de imagem' };
  }
} 