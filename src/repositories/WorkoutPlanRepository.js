import { BaseRepository } from './BaseRepository';

export class WorkoutPlanRepository extends BaseRepository {
  constructor() {
    super('workout_plans');
  }
  
  /**
   * Busca todos os planos de treino de um usuário específico
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} - Lista de planos de treino
   */
  async findByUserId(userId) {
    console.log(`[WorkoutPlanRepository] Buscando planos de treino do usuário: ${userId}`);
    return this.findAll({
      filter: {
        column: 'user_id',
        operator: 'eq',
        value: userId
      },
      order: {
        column: 'created_at',
        ascending: false
      }
    });
  }
  
  /**
   * Cria um novo plano de treino para um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} workoutPlanData - Dados do plano de treino
   * @returns {Promise<Object>} - Plano de treino criado
   */
  async createForUser(userId, workoutPlanData) {
    console.log(`[WorkoutPlanRepository] Criando plano de treino para usuário: ${userId}`);
    return this.create({
      ...workoutPlanData,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  /**
   * Verifica se um plano de treino pertence a um usuário específico
   * @param {string} planId - ID do plano de treino
   * @param {string} userId - ID do usuário
   * @returns {Promise<boolean>} - true se pertencer, false caso contrário
   */
  async belongsToUser(planId, userId) {
    console.log(`[WorkoutPlanRepository] Verificando se plano ${planId} pertence ao usuário ${userId}`);
    const { data, error } = await this.supabase
      .from('workout_plans')
      .select('id')
      .filter('id', 'eq', planId)
      .filter('user_id', 'eq', userId)
      .maybeSingle();
    
    if (error) {
      console.error(`[WorkoutPlanRepository] Erro ao verificar propriedade:`, error);
      throw error;
    }
    
    return !!data;
  }
} 