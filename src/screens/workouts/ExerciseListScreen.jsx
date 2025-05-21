import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TEXT_VARIANT } from '../../design';
import { getExercisesByWorkoutPlan, deleteExercise } from '../../services';
import { Modal } from '../../components/ui';
import ExerciseCard from '../../components/features/ExerciseCard';

const ExerciseListScreen = ({ navigation, route }) => {
  const { workout } = route.params;
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [completedExercises, setCompletedExercises] = useState({});
  
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

  // Recarregar exercícios quando a tela entrar em foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchExercises();
    });

    return unsubscribe;
  }, [navigation]);

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

  // Navegação para ver detalhes de um exercício
  const handleExercisePress = (exercise) => {
    navigation.navigate('ExerciseDetail', { exercise, isCompleted: !!completedExercises[exercise.id] });
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
  const handleToggleComplete = (exerciseId) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  };

  // Renderizar um item da lista de exercícios
  const renderExerciseItem = ({ item }) => {
    return (
      <ExerciseCard
        exercise={item}
        onPress={() => handleExercisePress(item)}
        isCompleted={!!completedExercises[item.id]}
        onToggleComplete={handleToggleComplete}
        onEdit={() => handleEditExercise(item)}
        onDelete={() => confirmDeleteExercise(item.id)}
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
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.deleteButton]}
              onPress={handleDeleteExercise}
            >
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>
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
  headerButton: {
    marginRight: SPACING.MD,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  emptyText: {
    ...TEXT_VARIANT.headingSmall,
    color: COLORS.TEXT.LIGHT,
    textAlign: 'center',
  },
  emptySubtext: {
    ...TEXT_VARIANT.bodyDefault,
    color: COLORS.GRAY[500],
    textAlign: 'center',
    marginTop: SPACING.SM,
    marginBottom: SPACING.LG,
  },
  emptyButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.XL,
    borderRadius: 8,
    alignSelf: 'center',
  },
  emptyButtonText: {
    ...TEXT_VARIANT.labelDefault,
    color: COLORS.TEXT.LIGHT,
  },
  exerciseList: {
    padding: SPACING.MD,
  },
  modalContent: {
    padding: SPACING.MD,
  },
  modalText: {
    ...TEXT_VARIANT.bodyDefault,
    color: COLORS.TEXT.DEFAULT,
    marginBottom: SPACING.LG,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: SPACING.XS,
  },
  cancelButton: {
    backgroundColor: COLORS.GRAY[700],
  },
  cancelButtonText: {
    ...TEXT_VARIANT.labelDefault,
    color: COLORS.TEXT.LIGHT,
  },
  deleteButton: {
    backgroundColor: COLORS.FEEDBACK.ERROR,
  },
  deleteButtonText: {
    ...TEXT_VARIANT.labelDefault,
    color: COLORS.TEXT.LIGHT,
  },
});

export default ExerciseListScreen; 