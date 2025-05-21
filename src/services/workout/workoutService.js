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
    // Obtém a sessão do usuário atual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Erro ao obter sessão:', sessionError);
      throw sessionError;
    }
    
    if (!sessionData?.session?.user) {
      console.error('Usuário não autenticado');
      throw new Error('Usuário não autenticado');
    }
    
    console.log('Criando workout plan com user_id:', sessionData.session.user.id);
    
    // Garantir que o user_id está definido
    const workoutWithUserId = {
      ...workoutPlan,
      user_id: sessionData.session.user.id
    };
    
    // Separar as operações para evitar problemas com chain de métodos
    const insertResult = await supabase
      .from('workout_plans')
      .insert([workoutWithUserId]);
      
    if (insertResult.error) {
      console.error('Erro ao inserir treino:', insertResult.error);
      throw insertResult.error;
    }
    
    // Buscar o treino recém-criado
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('name', workoutPlan.name)
      .eq('user_id', sessionData.session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Erro ao buscar treino após criação:', error);
      throw error;
    }
    
    console.log('Treino criado com sucesso:', data);
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
    console.log(`Iniciando processo de exclusão do treino: ${id}`);
    
    if (!id) {
      console.error('ID do treino não fornecido para exclusão');
      throw new Error('ID do treino não fornecido para exclusão');
    }
    
    // Primeiro excluir todos os exercícios relacionados a este treino
    console.log(`Excluindo exercícios relacionados ao treino ${id}`);
    const { error: exercisesError } = await supabase
      .from('exercises')
      .delete()
      .eq('workout_plan_id', id);
    
    if (exercisesError) {
      console.error(`Erro ao excluir exercícios do treino ${id}:`, exercisesError);
      // Não impede a exclusão do treino, apenas registra o erro
    }
    
    // Agora excluir o treino em si
    console.log(`Excluindo treino ${id}`);
    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erro ao excluir treino ${id}:`, error);
      throw error;
    }
    
    console.log(`Treino ${id} excluído com sucesso`);
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
    console.log('Iniciando upload de imagem para treino:', workoutPlanId);
    console.log('Arquivo recebido:', file ? `${file.name || 'sem nome'} (${typeof file})` : 'nenhum arquivo');
    
    if (!file) {
      throw new Error('Nenhum arquivo fornecido para upload');
    }
    
    if (!workoutPlanId) {
      throw new Error('ID do treino não fornecido');
    }
    
    // Garantir que temos um nome de arquivo
    const fileName = file.name || `workout_image_${Date.now()}.jpg`;
    
    // Preparar caminho para o arquivo
    const fileExt = fileName.split('.').pop();
    const filePath = `${workoutPlanId}/${Date.now()}.${fileExt}`;
    
    console.log('Fazendo upload para caminho:', filePath);

    // Fazer o upload do arquivo
    const { data, error: uploadError } = await supabase.storage
      .from('workout-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erro no upload de imagem:', uploadError);
      throw uploadError;
    }

    console.log('Upload concluído com sucesso, obtendo URL pública');

    // Obter a URL pública do arquivo
    const { data: urlData, error: urlError } = supabase.storage
      .from('workout-images')
      .getPublicUrl(filePath);

    if (urlError || !urlData) {
      console.error('Erro ao obter URL pública:', urlError);
      throw urlError || new Error('Não foi possível obter a URL da imagem');
    }

    console.log('URL pública obtida:', urlData.publicUrl);

    return { data: { url: urlData.publicUrl } };
  } catch (error) {
    console.error('Erro ao fazer upload de imagem:', error);
    return { 
      error: error.message || 'Erro ao fazer upload de imagem',
      details: error
    };
  }
} 