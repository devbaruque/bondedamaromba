import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl
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
      fetchExercises();
    }, [])
  );

  // Buscar exercícios
  const fetchExercises = async () => {
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
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchExercises();
  };

  // Navegação para adicionar um exercício
  const handleAddExercise = () => {
    navigation.navigate('AddExercise', { workoutId: workout.id });
  };

  // Iniciar sessão de treino
  const handleStartSession = async () => {
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
      Alert.alert('Treino Iniciado', 'Seu treino foi iniciado! Marque os exercícios conforme for concluindo.');
      
    } catch (error) {
      console.error('Erro ao iniciar sessão de treino:', error);
      Alert.alert('Erro', 'Não foi possível iniciar o treino. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Finalizar sessão de treino
  const handleEndSession = async () => {
    try {
      if (!activeSession || !activeSession.id) {
        Alert.alert('Erro', 'Não há sessão de treino ativa.');
        return;
      }
      
      setIsLoading(true);
      console.log('Finalizando sessão:', activeSession.id);
      
      // Enviar logs de exercícios para o servidor
      const logPromises = Object.keys(completedExercises).map(exerciseId => {
        if (completedExercises[exerciseId]) {
          const sets = completedSets[exerciseId] || 0;
          console.log(`Registrando exercício ${exerciseId} com ${sets} séries`);
          return logExerciseCompletion(activeSession.id, exerciseId, sets);
        }
        return Promise.resolve();
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
        console.error('Erro ao finalizar sessão de treino:', error);
        Alert.alert('Erro', 'Não foi possível finalizar o treino. Seus exercícios foram registrados, mas você pode tentar finalizar novamente.');
        setIsLoading(false);
        return;
      }
      
      setActiveSession(null);
      setIsSessionActive(false);
      setCompletedExercises({});
      setCompletedSets({});
      
      Alert.alert(
        'Treino Finalizado', 
        'Seu treino foi registrado com sucesso!',
        [
          {
            text: 'Ver Histórico',
            onPress: () => navigation.navigate('Histórico'),
          },
          {
            text: 'OK',
            style: 'cancel',
          }
        ]
      );
      
    } catch (error) {
      console.error('Erro ao finalizar sessão de treino:', error);
      Alert.alert('Erro', 'Não foi possível finalizar o treino. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Navegação para ver detalhes de um exercício
  const handleExercisePress = (exercise) => {
    navigation.navigate('ExerciseDetail', { 
      exercise, 
      isCompleted: !!completedExercises[exercise.id],
      onComplete: (completedSetsCount) => {
        if (isSessionActive) {
          handleToggleComplete(exercise.id, completedSetsCount);
        }
      }
    });
  };

  // Editar exercício
  const handleEditExercise = (exercise) => {
    navigation.navigate('EditExercise', { exercise });
  };

  // Confirmar exclusão de exercício
  const confirmDeleteExercise = (exerciseId) => {
    setSelectedExerciseId(exerciseId);
    setShowDeleteModal(true);
  };

  // Excluir exercício
  const handleDeleteExercise = async () => {
    if (!selectedExerciseId) return;
    
    try {
      setIsLoading(true);
      const { error } = await deleteExercise(selectedExerciseId);
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível excluir o exercício.');
        return;
      }
      
      // Remover o exercício da lista
      setExercises(exercises.filter(ex => ex.id !== selectedExerciseId));
      Alert.alert('Sucesso', 'Exercício excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir exercício:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao excluir o exercício.');
    } finally {
      setShowDeleteModal(false);
      setSelectedExerciseId(null);
      setIsLoading(false);
    }
  };

  // Alternar status de conclusão
  const handleToggleComplete = (exerciseId, setsCompleted = 0) => {
    // Se não há sessão ativa e está tentando marcar como completo, perguntar se quer iniciar
    if (!isSessionActive && !completedExercises[exerciseId]) {
      Alert.alert(
        'Iniciar Treino',
        'Deseja iniciar um treino para registrar seu progresso?',
        [
          {
            text: 'Não',
            style: 'cancel',
          },
          {
            text: 'Sim',
            onPress: async () => {
              await handleStartSession();
              // Depois de iniciar a sessão, marcar o exercício
              setCompletedExercises(prev => ({
                ...prev,
                [exerciseId]: true
              }));
              setCompletedSets(prev => ({
                ...prev,
                [exerciseId]: setsCompleted
              }));
            }
          },
        ]
      );
      return;
    }
    
    // Atualizar estado de conclusão
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
    
    // Atualizar séries completadas
    if (setsCompleted > 0) {
      setCompletedSets(prev => ({
        ...prev,
        [exerciseId]: setsCompleted
      }));
    }
    
    // Se estiver em uma sessão ativa, registrar a alteração no servidor
    if (isSessionActive && activeSession?.id) {
      // Aqui vamos apenas atualizar o estado local
      // Os logs serão enviados ao servidor quando o treino for finalizado
    }
  };

  // Renderizar um item da lista de exercícios
  const renderExerciseItem = ({ item }) => {
    return (
      <ExerciseCard
        exercise={item}
        onPress={() => handleExercisePress(item)}
        isCompleted={!!completedExercises[item.id]}
        onToggleComplete={() => handleToggleComplete(item.id)}
        onEdit={() => handleEditExercise(item)}
        onDelete={() => confirmDeleteExercise(item.id)}
      />
    );
  };

  // Botão de iniciar ou finalizar treino
  const renderSessionButton = () => {
    if (exercises.length === 0) {
      return null;
    }
    
    return isSessionActive ? (
      <Button 
        title="Finalizar Treino" 
        variant="primary" 
        onPress={handleEndSession}
        style={styles.sessionButton}
      />
    ) : (
      <Button 
        title="Iniciar Treino" 
        variant="primary" 
        onPress={handleStartSession}
        style={styles.sessionButton}
      />
    );
  };

  // Renderizar o conteúdo principal
  const renderContent = () => {
    if (isLoading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      );
    }

    if (exercises.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons 
            name="fitness-outline" 
            size={64} 
            color={COLORS.GRAY[700]} 
            style={{ marginBottom: SPACING.MD }}
          />
          <Text style={styles.emptyText}>Nenhum exercício adicionado</Text>
          <Text style={styles.emptySubtext}>
            Adicione exercícios ao seu treino para começar
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={handleAddExercise}
          >
            <Text style={styles.emptyButtonText}>Adicionar Exercício</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseItem}
        contentContainerStyle={styles.exerciseList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]} 
            tintColor={COLORS.PRIMARY}
          />
        }
        ListFooterComponent={renderSessionButton}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      
      {/* Modal de confirmação de exclusão */}
      <Modal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir Exercício"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            Tem certeza que deseja excluir este exercício? Esta ação não pode ser desfeita.
          </Text>
          <View style={styles.modalButtons}>
            <Button 
              title="Cancelar" 
              variant="outline" 
              onPress={() => setShowDeleteModal(false)}
              style={styles.modalButton}
            />
            <Button 
              title="Excluir" 
              variant="danger" 
              onPress={handleDeleteExercise}
              style={styles.modalButton}
            />
          </View>
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
  sessionButton: {
    marginTop: SPACING.LG,
    marginBottom: SPACING.XL,
    marginHorizontal: SPACING.MD,
  },
});

export default ExerciseListScreen; 