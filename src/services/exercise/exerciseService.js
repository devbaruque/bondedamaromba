import supabase from '../supabase';

/**
 * Busca todos os exercícios de um plano de treino
 * @param {string} workoutPlanId ID do plano de treino
 * @returns {Promise} Promessa com a lista de exercícios
 */
export async function getExercisesByWorkoutPlan(workoutPlanId) {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        exercise_images (id, image_url, order_index)
      `)
      .eq('workout_plan_id', workoutPlanId)
      .order('order_index');
    
    if (error) throw error;
    return { data };
  } catch (error) {
    console.error(`Erro ao buscar exercícios do treino ${workoutPlanId}:`, error);
    return { error: error.message || 'Erro ao buscar exercícios do treino' };
  }
}

/**
 * Busca um exercício específico pelo ID
 * @param {string} id ID do exercício
 * @returns {Promise} Promessa com o exercício
 */
export async function getExerciseById(id) {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        *,
        exercise_images (id, image_url, order_index)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return { data };
  } catch (error) {
    console.error(`Erro ao buscar exercício com ID ${id}:`, error);
    return { error: error.message || 'Erro ao buscar exercício' };
  }
}

/**
 * Cria um novo exercício
 * @param {Object} exercise Dados do exercício
 * @returns {Promise} Promessa com o exercício criado
 */
export async function createExercise(exercise) {
  try {
    // Buscando o maior order_index atual para este workout_plan_id
    const { data: existingExercises, error: queryError } = await supabase
      .from('exercises')
      .select('order_index')
      .eq('workout_plan_id', exercise.workout_plan_id)
      .order('order_index', { ascending: false })
      .limit(1);
    
    if (queryError) throw queryError;
    
    // Definindo a ordem como o maior valor + 1 ou 0 se for o primeiro
    const nextOrder = existingExercises.length > 0 ? existingExercises[0].order_index + 1 : 0;
    const exerciseWithOrder = { ...exercise, order_index: nextOrder };
    
    // Inserindo o exercício
    const { data, error } = await supabase
      .from('exercises')
      .insert([exerciseWithOrder])
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Erro ao criar exercício:', error);
    return { error: error.message || 'Erro ao criar exercício' };
  }
}

/**
 * Atualiza um exercício existente
 * @param {string} id ID do exercício
 * @param {Object} updates Dados atualizados
 * @returns {Promise} Promessa com o exercício atualizado
 */
export async function updateExercise(id, updates) {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return { data };
  } catch (error) {
    console.error(`Erro ao atualizar exercício com ID ${id}:`, error);
    return { error: error.message || 'Erro ao atualizar exercício' };
  }
}

/**
 * Exclui um exercício
 * @param {string} id ID do exercício
 * @returns {Promise} Promessa com o resultado da operação
 */
export async function deleteExercise(id) {
  try {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error(`Erro ao excluir exercício com ID ${id}:`, error);
    return { error: error.message || 'Erro ao excluir exercício' };
  }
}

/**
 * Reordena exercícios em um plano de treino
 * @param {Array} exerciseIds Array com IDs dos exercícios na nova ordem
 * @returns {Promise} Promessa com o resultado da operação
 */
export async function reorderExercises(exerciseIds) {
  try {
    // Criando um array de operações de atualização
    const updates = exerciseIds.map((id, index) => {
      return { id, order_index: index };
    });

    // Executando as atualizações em lote
    const promises = updates.map(item => 
      supabase
        .from('exercises')
        .update({ order_index: item.order_index })
        .eq('id', item.id)
    );

    // Aguardando todas as atualizações
    await Promise.all(promises);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao reordenar exercícios:', error);
    return { error: error.message || 'Erro ao reordenar exercícios' };
  }
}

/**
 * Faz upload de uma imagem para um exercício
 * @param {File} file Arquivo de imagem
 * @param {string} exerciseId ID do exercício
 * @returns {Promise} Promessa com a URL da imagem e ID da imagem salva
 */
export async function uploadExerciseImage(file, exerciseId) {
  try {
    // Upload do arquivo para o Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${exerciseId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exercise-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Obtendo a URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('exercise-images')
      .getPublicUrl(filePath);

    if (!urlData) throw new Error('Não foi possível obter a URL da imagem');

    // Buscando o maior order_index atual para este exercício
    const { data: existingImages, error: queryError } = await supabase
      .from('exercise_images')
      .select('order_index')
      .eq('exercise_id', exerciseId)
      .order('order_index', { ascending: false })
      .limit(1);
      
    if (queryError) throw queryError;
    
    // Definindo a ordem como o maior valor + 1 ou 0 se for a primeira
    const nextOrder = existingImages.length > 0 ? existingImages[0].order_index + 1 : 0;

    // Salvando referência da imagem no banco
    const { data: imageData, error: insertError } = await supabase
      .from('exercise_images')
      .insert([
        { 
          exercise_id: exerciseId, 
          image_url: urlData.publicUrl,
          order_index: nextOrder
        }
      ])
      .select()
      .single();
      
    if (insertError) throw insertError;

    return { 
      data: { 
        url: urlData.publicUrl,
        id: imageData.id,
        order_index: nextOrder
      } 
    };
  } catch (error) {
    console.error('Erro ao fazer upload de imagem:', error);
    return { error: error.message || 'Erro ao fazer upload de imagem' };
  }
}

/**
 * Exclui uma imagem de exercício
 * @param {string} id ID da imagem
 * @returns {Promise} Promessa com o resultado da operação
 */
export async function deleteExerciseImage(id) {
  try {
    const { error } = await supabase
      .from('exercise_images')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error(`Erro ao excluir imagem com ID ${id}:`, error);
    return { error: error.message || 'Erro ao excluir imagem' };
  }
} 