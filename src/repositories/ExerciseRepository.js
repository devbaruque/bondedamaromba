import { BaseRepository } from './BaseRepository';

export class ExerciseRepository extends BaseRepository {
  constructor() {
    super('exercises');
  }
  
  /**
   * Busca todos os exercícios de um plano de treino específico
   * @param {string} workoutPlanId - ID do plano de treino
   * @returns {Promise<Array>} - Lista de exercícios
   */
  async findByWorkoutPlanId(workoutPlanId) {
    console.log(`[ExerciseRepository] Buscando exercícios do plano: ${workoutPlanId}`);
    return this.findAll({
      filter: {
        column: 'workout_plan_id',
        operator: 'eq',
        value: workoutPlanId
      },
      order: {
        column: 'order',
        ascending: true
      },
      select: `*, workout_plans:workout_plan_id (id, user_id)`
    });
  }
  
  /**
   * Cria um novo exercício para um plano de treino
   * @param {string} workoutPlanId - ID do plano de treino
   * @param {Object} exerciseData - Dados do exercício
   * @returns {Promise<Object>} - Exercício criado
   */
  async createForWorkoutPlan(workoutPlanId, exerciseData) {
    console.log(`[ExerciseRepository] Criando exercício para plano: ${workoutPlanId}`);
    
    // Determinar a ordem do novo exercício (último + 1)
    const exercises = await this.findByWorkoutPlanId(workoutPlanId);
    const maxOrder = exercises.length > 0 
      ? Math.max(...exercises.map(e => e.order || 0)) 
      : 0;
    
    return this.create({
      ...exerciseData,
      workout_plan_id: workoutPlanId,
      order: maxOrder + 1,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  /**
   * Reordena exercícios de um plano de treino
   * @param {string} workoutPlanId - ID do plano de treino
   * @param {Array<Object>} exerciseOrders - Array de { id, order }
   * @returns {Promise<boolean>} - true se bem sucedido
   */
  async reorderExercises(workoutPlanId, exerciseOrders) {
    console.log(`[ExerciseRepository] Reordenando exercícios do plano: ${workoutPlanId}`);
    
    try {
      // Para cada exercício, atualizar sua ordem
      for (const { id, order } of exerciseOrders) {
        await this.update(id, { order });
      }
      
      return true;
    } catch (error) {
      console.error(`[ExerciseRepository] Erro ao reordenar exercícios:`, error);
      throw error;
    }
  }
  
  /**
   * Remove todos os exercícios de um plano de treino
   * @param {string} workoutPlanId - ID do plano de treino
   * @returns {Promise<boolean>} - true se bem sucedido
   */
  async deleteByWorkoutPlanId(workoutPlanId) {
    console.log(`[ExerciseRepository] Removendo todos exercícios do plano: ${workoutPlanId}`);
    
    try {
      const { error } = await this.supabase
        .from('exercises')
        .delete()
        .filter('workout_plan_id', 'eq', workoutPlanId);
      
      if (error) {
        console.error(`[ExerciseRepository] Erro ao remover exercícios:`, error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error(`[ExerciseRepository] Erro ao remover exercícios:`, error);
      throw error;
    }
  }
} 