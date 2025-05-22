import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl, Animated,
  InteractionManager
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TEXT_VARIANT, BORDER_RADIUS } from '../../design';
import { 
  getExercisesByWorkoutPlan, 
  deleteExercise,
  startWorkoutSession,
  endWorkoutSession,
  logExerciseCompletion,
  supabase 
} from '../../services';
import { Modal, Button } from '../../components/ui';
import ExerciseCard from '../../components/features/ExerciseCard';
import { useWorkoutTimer } from '../../contexts/WorkoutTimerContext';

// Constante para a altura de cada item da lista
const EXERCISE_ITEM_HEIGHT = 220; // Altura aproximada de um exercício

const ExerciseListScreen = ({ navigation, route }) => {
  const { workout } = route.params;
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [completedExercises, setCompletedExercises] = useState({});
  const [completedSets, setCompletedSets] = useState({});
  const [activeSession, setActiveSession] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  // Acessar o contexto do timer
  const { startTimer, finishWorkout, isActive: timerActive } = useWorkoutTimer();
  
  // Referência para o flatlist para poder rolar até os exercícios
  const flatListRef = useRef(null);
  
  // State para controlar a animação de conclusão
  const [animatingCompletion, setAnimatingCompletion] = useState(false);
  
  // Exercício sendo destacado durante a animação
  const [highlightedExerciseId, setHighlightedExerciseId] = useState(null);
  
  // State para mostrar o modal de conclusão
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // Configurar a navegação ao montar o componente
  useEffect(() => {
    navigation.setOptions({
      title: workout.name,
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleAddExercise}
        >
          <Ionicons name="add" size={24} color={COLORS.TEXT.LIGHT} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, workout]);

  // Verificar se há sessão ativa quando a tela é focada
  useFocusEffect(
    useCallback(() => {
      // Usar InteractionManager para adiar carregamento até que a navegação esteja concluída
      InteractionManager.runAfterInteractions(() => {
        fetchExercises();
      });
    }, [])
  );

  // Buscar exercícios
  const fetchExercises = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getExercisesByWorkoutPlan(workout.id);
      
      if (error) {
        console.error('Erro ao buscar exercícios:', error);
        Alert.alert('Erro', 'Não foi possível carregar os exercícios.');
        return;
      }
      
      setExercises(data || []);
    } catch (error) {
      console.error('Erro ao buscar exercícios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os exercícios.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [workout.id]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExercises();
  }, [fetchExercises]);

  // Navegação para adicionar um exercício
  const handleAddExercise = useCallback(() => {
    navigation.navigate('AddExercise', { workoutId: workout.id });
  }, [navigation, workout.id]);

  // Iniciar sessão de treino
  const handleStartSession = useCallback(async () => {
    if (exercises.length === 0) {
      Alert.alert(
        'Sem exercícios', 
        'Adicione pelo menos um exercício ao treino antes de iniciá-lo.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log('Iniciando sessão de treino para:', workout.id);
      
      // Verificar conexão com o Supabase antes de prosseguir
      try {
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
          console.error('Erro de autenticação:', authError);
          Alert.alert('Erro de conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.');
          setIsLoading(false);
          return;
        }
        console.log('Usuário autenticado:', authData?.session?.user?.id);
      } catch (authTestError) {
        console.error('Erro ao testar autenticação:', authTestError);
        Alert.alert('Erro de conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.');
        setIsLoading(false);
        return;
      }
      
      console.log('Chamando startWorkoutSession...');
      const response = await startWorkoutSession(workout.id);
      console.log('Resposta da API:', JSON.stringify(response));
      
      if (response.error) {
        console.error('Erro ao iniciar sessão de treino:', response.error);
        Alert.alert('Erro', 'Não foi possível iniciar o treino. Tente novamente.');
        return;
      }
      
      if (!response.data) {
        console.error('Dados da sessão não retornados');
        Alert.alert('Erro', 'Não foi possível iniciar o treino. Tente novamente.');
        return;
      }
      
      // Verificar se temos um ID válido na resposta
      if (!response.data.id) {
        console.error('ID da sessão não encontrado na resposta:', response.data);
        Alert.alert('Erro', 'Ocorreu um problema ao criar a sessão de treino. Tente novamente.');
        return;
      }
      
      console.log('Sessão iniciada com sucesso, ID:', response.data.id);
      setActiveSession(response.data);
      setIsSessionActive(true);
      
      // Iniciar o timer de treino - garantir que os parâmetros corretos são passados
      console.log('Iniciando timer com nome:', workout.name);
      startTimer(response.data.id, workout.name);
      
      Alert.alert('Treino Iniciado', 'Seu treino foi iniciado! Marque os exercícios conforme for concluindo.');
      
    } catch (error) {
      console.error('Erro ao iniciar sessão de treino:', error);
      Alert.alert('Erro', 'Não foi possível iniciar o treino. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [exercises.length, workout.id, workout.name, startTimer]);

  // Função para calcular métricas do treino concluído
  const calculateWorkoutMetrics = useCallback(() => {
    const totalExercises = exercises.length;
    const completedExercisesCount = Object.keys(completedExercises).length;
    const totalSets = exercises.reduce((acc, exercise) => acc + (exercise.sets || 0), 0);
    const completedSetsCount = Object.values(completedSets).reduce((acc, sets) => acc + sets, 0);
    
    return {
      totalExercises,
      completedExercisesCount,
      completionPercentage: totalExercises > 0 ? Math.round((completedExercisesCount / totalExercises) * 100) : 0,
      totalSets,
      completedSetsCount,
      setsCompletionPercentage: totalSets > 0 ? Math.round((completedSetsCount / totalSets) * 100) : 0
    };
  }, [exercises, completedExercises, completedSets]);

  // Finalizar sessão de treino
  const handleEndSession = useCallback(async () => {
    try {
      if (!activeSession || !activeSession.id) {
        Alert.alert('Erro', 'Não há sessão de treino ativa.');
        return;
      }
      
      setIsLoading(true);
      // Alterar o estado para indicar que estamos finalizando - isso afetará o texto do botão
      setAnimatingCompletion(true);
      console.log('Finalizando sessão:', activeSession.id);
      
      // Marcar exercícios um por um com pequeno delay para efeito visual
      const markExercisesSequentially = async () => {
        const completed = {};
        const sets = {};
        
        // Aumentar o tempo de pausa para cada exercício
        const animationPause = 500; // 500ms para cada exercício
        
        for (let i = 0; i < exercises.length; i++) {
          const exercise = exercises[i];
          
          // Destacar o exercício atual
          setHighlightedExerciseId(exercise.id);
          
          // Rolar até o exercício atual
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index: i,
              animated: true,
              viewPosition: 0.5,
            });
          }
          
          // Marcar como completo
          completed[exercise.id] = true;
          sets[exercise.id] = completedSets[exercise.id] || exercise.sets || 1;
          
          // Atualizar estado para mostrar visual de conclusão
          setCompletedExercises({...completed});
          setCompletedSets({...sets});
          
          // Esperar um pouco para efeito visual
          await new Promise(resolve => setTimeout(resolve, animationPause));
        }
        
        // Limpar o destaque ao finalizar
        setHighlightedExerciseId(null);
        setAnimatingCompletion(false);
        return {completed, sets};
      };
      
      // Executar a animação e esperar que termine
      const {completed, sets} = await markExercisesSequentially();
      
      // Enviar logs de exercícios para o servidor
      const logPromises = exercises.map(exercise => {
        const exerciseSets = sets[exercise.id] || 1;
        console.log(`Registrando exercício ${exercise.id} com ${exerciseSets} séries`);
        return logExerciseCompletion(activeSession.id, exercise.id, exerciseSets);
      });
      
      try {
        const logResults = await Promise.all(logPromises);
        console.log('Resultados dos logs:', logResults);
      } catch (logError) {
        console.error('Erro ao registrar exercícios:', logError);
        // Continuar mesmo com erro no log
      }
      
      // Finalizar a sessão
      console.log('Chamando endWorkoutSession...');
      const { data, error } = await endWorkoutSession(activeSession.id);
      console.log('Resposta da API:', JSON.stringify({ data, error }));
      
      if (error) {
        console.error('Erro ao finalizar sessão:', error);
        Alert.alert('Erro', 'Não foi possível finalizar o treino corretamente, mas seus exercícios foram registrados.');
      } else {
        console.log('Sessão finalizada com sucesso');
        // Notificar o contexto do timer
        finishWorkout();
        setIsSessionActive(false);
        setActiveSession(null);
        
        // Mostrar o modal de conclusão personalizado em vez de um Alert
        setShowCompletionModal(true);
      }
      
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
      Alert.alert('Erro', 'Não foi possível finalizar o treino. Tente novamente.');
    } finally {
      setIsLoading(false);
      setAnimatingCompletion(false);
      setHighlightedExerciseId(null);
    }
  }, [activeSession, exercises, completedSets, finishWorkout]);

  // Fechar o modal de conclusão
  const handleCloseCompletionModal = useCallback(() => {
    setShowCompletionModal(false);
    // Manter os exercícios marcados como completos por alguns segundos para dar feedback visual
    setTimeout(() => {
      // Resetar os estados de exercícios completos depois de 3 segundos
      setCompletedExercises({});
      setCompletedSets({});
    }, 3000);
  }, []);

  // Navegar para detalhes do exercício
  const handleExercisePress = useCallback((exercise) => {
    if (isSessionActive && !animatingCompletion) {
      // Durante sessão ativa, abrir a tela de detalhes do exercício
      navigation.navigate('ExerciseDetail', { 
        exercise, 
        workoutId: workout.id,
        sessionId: activeSession?.id,
        isSessionActive: true,
        onComplete: (exerciseId, completedSets) => {
          handleToggleComplete(exerciseId, completedSets);
        }
      });
    } else if (!animatingCompletion) {
      // Fora de sessão, apenas visualizar o exercício
      navigation.navigate('ExerciseDetail', { 
        exercise, 
        workoutId: workout.id 
      });
    }
  }, [isSessionActive, animatingCompletion, navigation, workout.id, activeSession, handleToggleComplete]);

  // Navegar para edição do exercício
  const handleEditExercise = useCallback((exercise) => {
    navigation.navigate('EditExercise', { exercise, workoutId: workout.id });
  }, [navigation, workout.id]);

  // Confirmar exclusão de exercício
  const confirmDeleteExercise = useCallback((exerciseId) => {
    setSelectedExerciseId(exerciseId);
    setShowDeleteModal(true);
  }, []);

  // Excluir exercício
  const handleDeleteExercise = useCallback(async () => {
    if (!selectedExerciseId) return;
    
    setShowDeleteModal(false);
    setIsLoading(true);
    
    try {
      const { error } = await deleteExercise(selectedExerciseId);
      
      if (error) {
        console.error('Erro ao excluir exercício:', error);
        Alert.alert('Erro', 'Não foi possível excluir o exercício. Tente novamente.');
        return;
      }
      
      // Atualizar a lista de exercícios
      setExercises(prevExercises => 
        prevExercises.filter(ex => ex.id !== selectedExerciseId)
      );
      
      // Limpar estados relacionados ao exercício excluído
      if (completedExercises[selectedExerciseId]) {
        setCompletedExercises(prev => {
          const newState = {...prev};
          delete newState[selectedExerciseId];
          return newState;
        });
      }
      
      if (completedSets[selectedExerciseId]) {
        setCompletedSets(prev => {
          const newState = {...prev};
          delete newState[selectedExerciseId];
          return newState;
        });
      }
      
    } catch (error) {
      console.error('Erro ao excluir exercício:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar excluir o exercício. Tente novamente.');
    } finally {
      setIsLoading(false);
      setSelectedExerciseId(null);
    }
  }, [selectedExerciseId, completedExercises, completedSets]);

  // Alternar estado de conclusão do exercício
  const handleToggleComplete = useCallback((exerciseId, setsCompleted = 0) => {
    if (animatingCompletion) return;
    
    setCompletedExercises(prev => {
      const newState = {...prev};
      
      if (newState[exerciseId]) {
        // Se já estava completo, desmarcar
        delete newState[exerciseId];
      } else {
        // Marcar como completo
        newState[exerciseId] = true;
      }
      
      return newState;
    });
    
    // Atualizar quantidade de séries completadas, se informado
    if (setsCompleted > 0) {
      setCompletedSets(prev => ({
        ...prev,
        [exerciseId]: setsCompleted
      }));
    }
    
    // Se estiver em uma sessão ativa, registrar no servidor
    if (isSessionActive && activeSession && activeSession.id) {
      const exercise = exercises.find(ex => ex.id === exerciseId);
      if (exercise) {
        // Determinar quantas séries foram completadas
        const sets = setsCompleted || exercise.sets || 1;
        
        // Enviar log para o servidor em background
        logExerciseCompletion(activeSession.id, exerciseId, sets)
          .then(({ data, error }) => {
            if (error) {
              console.error('Erro ao registrar conclusão do exercício:', error);
              // Não mostrar alerta para não interromper o fluxo do usuário
            } else {
              console.log('Exercício registrado com sucesso:', data);
            }
          })
          .catch(error => {
            console.error('Erro ao registrar conclusão do exercício:', error);
          });
      }
    }
  }, [animatingCompletion, isSessionActive, activeSession, exercises]);

  // Configuração para otimizar a FlatList
  const getItemLayout = useCallback((data, index) => ({
    length: EXERCISE_ITEM_HEIGHT,
    offset: EXERCISE_ITEM_HEIGHT * index,
    index
  }), []);

  // Extrator de chave para a FlatList
  const keyExtractor = useCallback((item) => item.id, []);

  // Renderizador de item otimizado com useMemo
  const renderExerciseItem = useCallback(({ item }) => {
    const isCompleted = completedExercises[item.id] || false;
    const isHighlighted = highlightedExerciseId === item.id;
    
    return (
      <ExerciseCard 
        exercise={item}
        onPress={() => handleExercisePress(item)}
        isCompleted={isCompleted}
        onToggleComplete={isSessionActive ? handleToggleComplete : null}
        onEdit={!isSessionActive ? handleEditExercise : null}
        onDelete={!isSessionActive ? confirmDeleteExercise : null}
        isHighlighted={isHighlighted}
      />
    );
  }, [completedExercises, highlightedExerciseId, isSessionActive, handleExercisePress, handleToggleComplete, handleEditExercise, confirmDeleteExercise]);

  // Renderizar botão de sessão
  const renderSessionButton = useCallback(() => {
    if (isSessionActive) {
      return (
        <Button 
          title={animatingCompletion ? 'Finalizando...' : 'Finalizar Treino'}
          onPress={handleEndSession}
          disabled={animatingCompletion}
          leftIcon={
            <Ionicons name="checkmark-circle" size={20} color={COLORS.TEXT.LIGHT} />
          }
          style={[styles.actionButton, styles.endSessionButton]}
        />
      );
    } else {
      return (
        <Button 
          title="Iniciar Treino"
          onPress={handleStartSession}
          leftIcon={
            <Ionicons name="play-circle" size={20} color={COLORS.TEXT.LIGHT} />
          }
          style={styles.actionButton}
        />
      );
    }
  }, [isSessionActive, handleEndSession, animatingCompletion, handleStartSession]);

  // Função memoizada para lidar com o onScroll da FlatList
  const handleScroll = useMemo(() => {
    // Usar o throttle para limitar a frequência de eventos de scroll
    let lastScrollTime = 0;
    return ({ nativeEvent }) => {
      const now = Date.now();
      if (now - lastScrollTime < 16) { // Limitar a ~60fps
        return;
      }
      lastScrollTime = now;
      // Aqui você pode adicionar lógica de scroll se necessário
    };
  }, []);

  // Renderizar conteúdo principal
  const renderContent = useCallback(() => {
    if (isLoading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      );
    }
    
    if (exercises.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={64} color={COLORS.GRAY[700]} />
          <Text style={styles.emptyText}>Nenhum exercício adicionado</Text>
          <Text style={styles.emptySubtext}>
            Adicione exercícios ao seu treino para começar
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddExercise}
          >
            <Ionicons name="add-circle" size={20} color={COLORS.TEXT.LIGHT} />
            <Text style={styles.addButtonText}>Adicionar Exercício</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <FlatList
        ref={flatListRef}
        data={exercises}
        renderItem={renderExerciseItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        getItemLayout={getItemLayout}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews={true}
        onScroll={handleScroll}
      />
    );
  }, [isLoading, refreshing, exercises, renderExerciseItem, keyExtractor, onRefresh, handleAddExercise, getItemLayout, handleScroll]);

  return (
    <View style={styles.container}>
      {renderContent()}
      
      {exercises.length > 0 && (
        <View style={styles.bottomBar}>
          {renderSessionButton()}
        </View>
      )}
      
      <Modal
        visible={showDeleteModal}
        title="Excluir exercício"
        onClose={() => setShowDeleteModal(false)}
      >
        <Text style={styles.modalText}>
          Tem certeza que deseja excluir este exercício? Esta ação não pode ser desfeita.
        </Text>
        <View style={styles.modalButtons}>
          <Button 
            title="Cancelar" 
            onPress={() => setShowDeleteModal(false)} 
            type="secondary"
          />
          <Button 
            title="Excluir" 
            onPress={handleDeleteExercise} 
            type="danger"
          />
        </View>
      </Modal>
      
      <Modal
        visible={showCompletionModal}
        title="Treino Concluído!"
        onClose={handleCloseCompletionModal}
      >
        <View style={styles.completionModalContent}>
          <View style={styles.completionIconContainer}>
            <Ionicons name="checkmark-circle" size={60} color={COLORS.FEEDBACK.SUCCESS} />
          </View>
          
          <Text style={styles.completionTitle}>
            Parabéns!
          </Text>
          
          <Text style={styles.completionMessage}>
            Você concluiu seu treino com sucesso.
          </Text>
          
          {showCompletionModal && (
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{calculateWorkoutMetrics().completedExercisesCount}/{calculateWorkoutMetrics().totalExercises}</Text>
                <Text style={styles.metricLabel}>Exercícios</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{calculateWorkoutMetrics().completedSetsCount}/{calculateWorkoutMetrics().totalSets}</Text>
                <Text style={styles.metricLabel}>Séries</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{calculateWorkoutMetrics().completionPercentage}%</Text>
                <Text style={styles.metricLabel}>Conclusão</Text>
              </View>
            </View>
          )}
          
          <Button
            title="Fechar"
            onPress={handleCloseCompletionModal}
            style={styles.completionButton}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.DARK,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  exerciseList: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XL * 3,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.GRAY[400],
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  emptyButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.XL,
    borderRadius: BORDER_RADIUS.MD,
  },
  emptyButtonText: {
    color: COLORS.TEXT.LIGHT,
    fontWeight: '600',
    fontSize: 16,
  },
  headerButton: {
    padding: SPACING.XS,
  },
  modalContent: {
    padding: SPACING.MD,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.TEXT.DEFAULT,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.MD,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.XL,
    borderRadius: BORDER_RADIUS.MD,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.TEXT.LIGHT,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: SPACING.SM,
  },
  listContent: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XL * 3,
  },
  actionButton: {
    marginVertical: SPACING.MD,
    width: '100%',
  },
  endSessionButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  completionModalContent: {
    alignItems: 'center',
    padding: SPACING.MD,
  },
  completionIconContainer: {
    marginVertical: SPACING.MD,
    padding: SPACING.MD,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 50,
  },
  completionTitle: {
    ...TEXT_VARIANT.headingLarge,
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.SM,
  },
  completionMessage: {
    ...TEXT_VARIANT.bodyDefault,
    color: COLORS.TEXT.DEFAULT,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SPACING.LG,
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    ...TEXT_VARIANT.headingMedium,
    color: COLORS.PRIMARY,
  },
  metricLabel: {
    ...TEXT_VARIANT.labelDefault,
    color: COLORS.TEXT.MUTED,
  },
  completionButton: {
    marginTop: SPACING.MD,
    width: '100%',
  },
});

export default ExerciseListScreen; 