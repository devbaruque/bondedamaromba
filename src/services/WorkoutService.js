import { WorkoutPlanRepository } from '../repositories/WorkoutPlanRepository';
import { ExerciseRepository } from '../repositories/ExerciseRepository';
import { supabase } from './supabase';

/**
 * Serviço que gerencia todas as operações relacionadas a planos de treino e exercícios
 */
export class WorkoutService {
  constructor() {
    this.workoutPlanRepo = new WorkoutPlanRepository();
    this.exerciseRepo = new ExerciseRepository();
  }
  
  /**
   * Obtém o ID do usuário atual
   * @returns {Promise<string>} - ID do usuário
   */
  async getCurrentUserId() {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[WorkoutService] Erro ao obter sessão:', error);
      throw error;
    }
    
    if (!data.session || !data.session.user) {
      throw new Error('Usuário não autenticado');
    }
    
    return data.session.user.id;
  }
  
  /**
   * Obtém todos os planos de treino do usuário atual
   * @returns {Promise<Array>} - Lista de planos de treino
   */
  async getWorkoutPlans() {
    const userId = await this.getCurrentUserId();
    return this.workoutPlanRepo.findByUserId(userId);
  }
  
  /**
   * Obtém detalhes de um plano de treino específico, incluindo exercícios
   * @param {string} planId - ID do plano de treino
   * @returns {Promise<Object>} - Plano de treino com exercícios
   */
  async getWorkoutPlanDetails(planId) {
    const userId = await this.getCurrentUserId();
    
    // Verificar se o plano pertence ao usuário
    const belongsToUser = await this.workoutPlanRepo.belongsToUser(planId, userId);
    if (!belongsToUser) {
      throw new Error('Acesso negado: este plano de treino não pertence ao usuário atual');
    }
    
    // Buscar o plano
    const plan = await this.workoutPlanRepo.findById(planId);
    if (!plan) {
      throw new Error('Plano de treino não encontrado');
    }
    
    // Buscar os exercícios
    const exercises = await this.exerciseRepo.findByWorkoutPlanId(planId);
    
    // Combinar os dados
    return { ...plan, exercises };
  }
  
  /**
   * Cria um novo plano de treino
   * @param {Object} data - Dados do plano de treino
   * @returns {Promise<Object>} - Plano de treino criado
   */
  async createWorkoutPlan(data) {
    const userId = await this.getCurrentUserId();
    return this.workoutPlanRepo.createForUser(userId, data);
  }
  
  /**
   * Atualiza um plano de treino existente
   * @param {string} planId - ID do plano de treino
   * @param {Object} data - Dados a serem atualizados
   * @returns {Promise<Object>} - Plano de treino atualizado
   */
  async updateWorkoutPlan(planId, data) {
    const userId = await this.getCurrentUserId();
    
    // Verificar se o plano pertence ao usuário
    const belongsToUser = await this.workoutPlanRepo.belongsToUser(planId, userId);
    if (!belongsToUser) {
      throw new Error('Acesso negado: este plano de treino não pertence ao usuário atual');
    }
    
    return this.workoutPlanRepo.update(planId, data);
  }
  
  /**
   * Remove um plano de treino e todos os seus exercícios
   * @param {string} planId - ID do plano de treino
   * @returns {Promise<boolean>} - true se bem sucedido
   */
  async deleteWorkoutPlan(planId) {
    const userId = await this.getCurrentUserId();
    
    // Verificar se o plano pertence ao usuário
    const belongsToUser = await this.workoutPlanRepo.belongsToUser(planId, userId);
    if (!belongsToUser) {
      throw new Error('Acesso negado: este plano de treino não pertence ao usuário atual');
    }
    
    // Remover todos os exercícios
    await this.exerciseRepo.deleteByWorkoutPlanId(planId);
    
    // Remover o plano
    return this.workoutPlanRepo.delete(planId);
  }
  
  /**
   * Cria um novo exercício em um plano de treino
   * @param {string} planId - ID do plano de treino
   * @param {Object} data - Dados do exercício
   * @returns {Promise<Object>} - Exercício criado
   */
  async createExercise(planId, data) {
    const userId = await this.getCurrentUserId();
    
    // Verificar se o plano pertence ao usuário
    const belongsToUser = await this.workoutPlanRepo.belongsToUser(planId, userId);
    if (!belongsToUser) {
      throw new Error('Acesso negado: este plano de treino não pertence ao usuário atual');
    }
    
    return this.exerciseRepo.createForWorkoutPlan(planId, data);
  }
  
  /**
   * Atualiza um exercício existente
   * @param {string} exerciseId - ID do exercício
   * @param {Object} data - Dados a serem atualizados
   * @returns {Promise<Object>} - Exercício atualizado
   */
  async updateExercise(exerciseId, data) {
    // Buscar o exercício para verificar permissões
    const exercise = await this.exerciseRepo.findById(exerciseId);
    if (!exercise) {
      throw new Error('Exercício não encontrado');
    }
    
    const userId = await this.getCurrentUserId();
    const workoutPlanId = exercise.workout_plan_id;
    
    // Verificar se o plano pertence ao usuário
    const belongsToUser = await this.workoutPlanRepo.belongsToUser(workoutPlanId, userId);
    if (!belongsToUser) {
      throw new Error('Acesso negado: este exercício não pertence ao usuário atual');
    }
    
    return this.exerciseRepo.update(exerciseId, data);
  }
  
  /**
   * Remove um exercício
   * @param {string} exerciseId - ID do exercício
   * @returns {Promise<boolean>} - true se bem sucedido
   */
  async deleteExercise(exerciseId) {
    // Buscar o exercício para verificar permissões
    const exercise = await this.exerciseRepo.findById(exerciseId);
    if (!exercise) {
      throw new Error('Exercício não encontrado');
    }
    
    const userId = await this.getCurrentUserId();
    const workoutPlanId = exercise.workout_plan_id;
    
    // Verificar se o plano pertence ao usuário
    const belongsToUser = await this.workoutPlanRepo.belongsToUser(workoutPlanId, userId);
    if (!belongsToUser) {
      throw new Error('Acesso negado: este exercício não pertence ao usuário atual');
    }
    
    return this.exerciseRepo.delete(exerciseId);
  }
  
  /**
   * Reordena os exercícios de um plano de treino
   * @param {string} planId - ID do plano de treino
   * @param {Array<Object>} exerciseOrders - Array de { id, order }
   * @returns {Promise<boolean>} - true se bem sucedido
   */
  async reorderExercises(planId, exerciseOrders) {
    const userId = await this.getCurrentUserId();
    
    // Verificar se o plano pertence ao usuário
    const belongsToUser = await this.workoutPlanRepo.belongsToUser(planId, userId);
    if (!belongsToUser) {
      throw new Error('Acesso negado: este plano de treino não pertence ao usuário atual');
    }
    
    return this.exerciseRepo.reorderExercises(planId, exerciseOrders);
  }
}

// Exportar uma instância única para uso em toda a aplicação
export const workoutService = new WorkoutService(); 