import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TEXT_VARIANT, BORDER_RADIUS } from '../../design';
import { getExerciseById, deleteExercise } from '../../services';
import { Button, Modal } from '../../components/ui';
import RestTimer from '../../components/features/RestTimer';

const ExerciseDetailScreen = ({ navigation, route }) => {
  const { exercise: initialExercise, isCompleted = false, onComplete } = route.params;
  
  const [exercise, setExercise] = useState(initialExercise);
  const [isLoading, setIsLoading] = useState(true);
  const [completedSets, setCompletedSets] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  useEffect(() => {
    fetchExerciseDetails();
    
    // Configurar opções da tela
    navigation.setOptions({
      title: exercise.name,
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleEdit}
          >
            <Ionicons name="pencil" size={22} color={COLORS.TEXT.LIGHT} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Ionicons name="trash-outline" size={22} color={COLORS.TEXT.LIGHT} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [exercise.id, navigation]);
  
  // Buscar detalhes completos do exercício
  const fetchExerciseDetails = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getExerciseById(exercise.id);
      
      if (error) {
        console.error('Erro ao buscar detalhes do exercício:', error);
      } else if (data) {
        setExercise(data);
        // Inicializar o array de séries completadas com base no parâmetro isCompleted
        setCompletedSets(new Array(data.sets).fill(isCompleted));
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do exercício:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navegar para tela de edição
  const handleEdit = () => {
    navigation.navigate('EditExercise', { exercise });
  };
  
  // Excluir exercício
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const { error } = await deleteExercise(exercise.id);
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível excluir o exercício.');
        return;
      }
      
      // Voltar para a tela anterior
      navigation.goBack();
      Alert.alert('Sucesso', 'Exercício excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir exercício:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao excluir o exercício.');
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };
  
  // Alternar estado de conclusão de uma série
  const toggleSetCompletion = (index) => {
    const newCompletedSets = [...completedSets];
    newCompletedSets[index] = !newCompletedSets[index];
    setCompletedSets(newCompletedSets);
    
    // Contar séries completadas para reportar ao histórico
    const completedCount = newCompletedSets.filter(set => set).length;
    
    // Verificar se há um callback para reportar o progresso
    if (onComplete && typeof onComplete === 'function') {
      onComplete(completedCount);
    }
  };
  
  // Callback para quando o timer termina
  const handleTimerComplete = useCallback(() => {
    Alert.alert('Descanso Finalizado', 'Hora de fazer a próxima série!');
  }, []);

  // Verificar se todas as séries estão completas
  const allSetsCompleted = completedSets.every(set => set);

  // Marcar todas as séries como concluídas
  const markAllSetsCompleted = () => {
    const newCompletedSets = new Array(exercise.sets).fill(true);
    setCompletedSets(newCompletedSets);
    
    // Reportar todas as séries completadas ao histórico
    if (onComplete && typeof onComplete === 'function') {
      onComplete(exercise.sets);
    }
  };

  // Salvar progresso e voltar
  const handleSaveProgress = () => {
    const completedCount = completedSets.filter(set => set).length;
    
    // Se há séries completadas, considerar o exercício como realizado
    if (completedCount > 0) {
      if (onComplete && typeof onComplete === 'function') {
        onComplete(completedCount);
      }
      
      Alert.alert('Progresso Salvo', `${completedCount} séries registradas`);
    }
    
    navigation.goBack();
  };

  // Navegar entre imagens
  const handleNextImage = () => {
    if (exercise.exercise_images && exercise.exercise_images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === exercise.exercise_images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrevImage = () => {
    if (exercise.exercise_images && exercise.exercise_images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? exercise.exercise_images.length - 1 : prev - 1
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  // Ordenar imagens por order_index
  const sortedImages = exercise.exercise_images && exercise.exercise_images.length > 0
    ? [...exercise.exercise_images].sort((a, b) => a.order_index - b.order_index)
    : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Imagens do exercício */}
        <View style={styles.imageContainer}>
          {sortedImages.length > 0 ? (
            <>
              <Image 
                source={{ uri: sortedImages[currentImageIndex].image_url }}
                style={styles.image}
                resizeMode="cover"
              />
              
              {sortedImages.length > 1 && (
                <View style={styles.imageNavigation}>
                  <TouchableOpacity 
                    style={styles.imageNavButton} 
                    onPress={handlePrevImage}
                  >
                    <Ionicons name="chevron-back" size={24} color={COLORS.TEXT.LIGHT} />
                  </TouchableOpacity>
                  
                  <Text style={styles.imageCounter}>
                    {currentImageIndex + 1}/{sortedImages.length}
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.imageNavButton} 
                    onPress={handleNextImage}
                  >
                    <Ionicons name="chevron-forward" size={24} color={COLORS.TEXT.LIGHT} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="barbell-outline" size={64} color={COLORS.GRAY[700]} />
            </View>
          )}
        </View>
        
        {/* Detalhes do exercício */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailTitle}>Detalhes do exercício</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="repeat" size={22} color={COLORS.PRIMARY} />
              <Text style={styles.detailLabel}>Séries:</Text>
              <Text style={styles.detailValue}>{exercise.sets}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="refresh" size={22} color={COLORS.PRIMARY} />
              <Text style={styles.detailLabel}>Repetições:</Text>
              <Text style={styles.detailValue}>{exercise.repetitions}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="timer-outline" size={22} color={COLORS.PRIMARY} />
              <Text style={styles.detailLabel}>Descanso:</Text>
              <Text style={styles.detailValue}>{exercise.rest_time}s</Text>
            </View>
          </View>
          
          {exercise.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesTitle}>Observações:</Text>
              <Text style={styles.notesText}>{exercise.notes}</Text>
            </View>
          )}
        </View>
        
        {/* Progresso das séries */}
        <View style={styles.setsContainer}>
          <Text style={styles.sectionTitle}>Progresso</Text>
          
          {completedSets.map((completed, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.setItem,
                completed && styles.completedSetItem
              ]}
              onPress={() => toggleSetCompletion(index)}
            >
              <Text style={styles.setText}>{`Série ${index + 1}`}</Text>
              <Ionicons 
                name={completed ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={completed ? COLORS.FEEDBACK.SUCCESS : COLORS.GRAY[500]} 
              />
            </TouchableOpacity>
          ))}
          
          {!allSetsCompleted && (
            <Button 
              title="Marcar todas como concluídas" 
              onPress={markAllSetsCompleted}
              variant="outline"
              style={styles.markAllButton}
            />
          )}
        </View>
        
        {/* Timer de Descanso */}
        <View style={styles.timerContainer}>
          <Text style={styles.sectionTitle}>Timer de Descanso</Text>
          <RestTimer 
            defaultTime={exercise.rest_time} 
            onComplete={handleTimerComplete} 
          />
        </View>
        
        {/* Botão de salvar progresso */}
        <Button 
          title="Salvar e Voltar" 
          onPress={handleSaveProgress}
          variant="primary"
          style={styles.saveButton}
        />
      </ScrollView>

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
              onPress={handleDelete}
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
  },
  content: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XL * 2,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: SPACING.MD,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
    backgroundColor: COLORS.GRAY[800],
    marginBottom: SPACING.MD,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: SPACING.SM,
  },
  imageNavButton: {
    padding: SPACING.XS,
  },
  imageCounter: {
    color: COLORS.TEXT.LIGHT,
    fontSize: 14,
  },
  detailsContainer: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.MD,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailItem: {
    alignItems: 'center',
    marginBottom: SPACING.MD,
    minWidth: '30%',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.TEXT.MUTED,
    marginTop: SPACING.XS,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
  },
  notesContainer: {
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[700],
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.XS,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.TEXT.DEFAULT,
  },
  setsContainer: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.MD,
  },
  setItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderRadius: BORDER_RADIUS.SM,
    marginBottom: SPACING.SM,
  },
  completedSetItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  setText: {
    fontSize: 14,
    color: COLORS.TEXT.DEFAULT,
  },
  markAllButton: {
    marginTop: SPACING.SM,
  },
  timerContainer: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  modalContent: {
    padding: SPACING.MD,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.TEXT.DEFAULT,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
  saveButton: {
    marginTop: SPACING.MD,
    marginBottom: SPACING.XL,
  },
});

export default ExerciseDetailScreen; 