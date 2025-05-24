import { workoutService } from '../services/WorkoutService';

/**
 * Função para testar o serviço de treinos
 * Esta função deve ser chamada após um usuário ter feito login
 * Exemplo de uso:
 *   import { testWorkoutService } from './tests/testWorkoutService';
 *   // Após login bem-sucedido:
 *   testWorkoutService();
 */
export const testWorkoutService = async () => {
  console.log('=== INICIANDO TESTE DO WORKOUT SERVICE ===');
  
  try {
    // 1. Verificar usuário atual
    console.log('1. Verificando usuário atual...');
    const userId = await workoutService.getCurrentUserId();
    console.log('   ✅ Usuário atual:', userId);
    
    // 2. Criar um plano de treino para teste
    console.log('2. Criando plano de treino para teste...');
    const testPlan = await workoutService.createWorkoutPlan({
      name: 'Plano de Teste ' + new Date().toISOString(),
      description: 'Plano criado para testar o serviço'
    });
    console.log('   ✅ Plano criado:', testPlan);
    
    // 3. Atualizar o plano de treino
    console.log('3. Atualizando plano de treino...');
    const updatedPlan = await workoutService.updateWorkoutPlan(testPlan.id, {
      name: testPlan.name + ' (Atualizado)',
      description: 'Descrição atualizada ' + new Date().toISOString()
    });
    console.log('   ✅ Plano atualizado:', updatedPlan);
    
    // 4. Adicionar um exercício ao plano
    console.log('4. Adicionando exercício ao plano...');
    const testExercise = await workoutService.createExercise(testPlan.id, {
      name: 'Exercício de Teste',
      sets: 3,
      repetitions: 12,
      rest_time: 60,
      notes: 'Notas de teste'
    });
    console.log('   ✅ Exercício criado:', testExercise);
    
    // 5. Atualizar o exercício
    console.log('5. Atualizando exercício...');
    const updatedExercise = await workoutService.updateExercise(testExercise.id, {
      name: 'Exercício de Teste (Atualizado)',
      sets: 4,
      repetitions: 10,
      rest_time: 90,
      notes: 'Notas atualizadas ' + new Date().toISOString()
    });
    console.log('   ✅ Exercício atualizado:', updatedExercise);
    
    // 6. Obter detalhes do plano com exercícios
    console.log('6. Obtendo detalhes do plano com exercícios...');
    const planDetails = await workoutService.getWorkoutPlanDetails(testPlan.id);
    console.log('   ✅ Detalhes do plano:', planDetails);
    console.log('   ✅ Exercícios do plano:', planDetails.exercises);
    
    // 7. Excluir o exercício
    console.log('7. Excluindo exercício...');
    await workoutService.deleteExercise(testExercise.id);
    console.log('   ✅ Exercício excluído com sucesso');
    
    // 8. Excluir o plano de treino
    console.log('8. Excluindo plano de treino...');
    await workoutService.deleteWorkoutPlan(testPlan.id);
    console.log('   ✅ Plano excluído com sucesso');
    
    console.log('=== TESTE CONCLUÍDO COM SUCESSO ===');
    return {
      success: true,
      message: 'Todos os testes foram concluídos com sucesso'
    };
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}; 