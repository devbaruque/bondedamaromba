import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, Alert, ActivityIndicator, Vibration 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TEXT_VARIANT, BORDER_RADIUS } from '../../design';
import { getExerciseById, updateExercise, deleteExercise } from '../../services';
import { Button, Modal } from '../../components/ui';

const ExerciseDetailScreen = ({ navigation, route }) => {
  const { exercise: initialExercise } = route.params;
  
  const [exercise, setExercise] = useState(initialExercise);
  const [isLoading, setIsLoading] = useState(true);
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(exercise.rest_time || 60);
  const [completedSets, setCompletedSets] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const timerRef = useRef(null);
  
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
    
    // Limpar timer quando sair da tela
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
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
        // Inicializar o array de séries completadas
        setCompletedSets(new Array(data.sets).fill(false));
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
    } catch (error) {
      console.error('Erro ao excluir exercício:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao excluir o exercício.');
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };
  
  // Iniciar/pausar timer de descanso
  const toggleTimer = () => {
    if (timerActive) {
      // Pausar timer
      clearInterval(timerRef.current);
      setTimerActive(false);
    } else {
      // Iniciar timer
      setTimerActive(true);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer acabou
            clearInterval(timerRef.current);
            setTimerActive(false);
            // Vibrar para sinalizar que o tempo acabou
            Vibration.vibrate([500, 200, 500]);
            return exercise.rest_time || 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };
  
  // Resetar timer
  const resetTimer = () => {
    if (timerActive) {
      clearInterval(timerRef.current);
      setTimerActive(false);
    }
    setTimeRemaining(exercise.rest_time || 60);
  };
  
  // Alternar estado de conclusão de uma série
  const toggleSetCompletion = (index) => {
    const newCompletedSets = [...completedSets];
    newCompletedSets[index] = !newCompletedSets[index];
    setCompletedSets(newCompletedSets);
  };
  
  // Converter segundos para formato MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Verificar se todas as séries estão completas
  const allSetsCompleted = completedSets.every(set => set);

  // Marcar todas as séries como concluídas
  const markAllSetsCompleted = () => {
    setCompletedSets(new Array(exercise.sets).fill(true));
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Imagens do exercício */}
        <View style={styles.imageContainer}>
          {exercise.exercise_images && exercise.exercise_images.length > 0 ? (
            <Image 
              source={{ uri: exercise.exercise_images[0].image_url }}
              style={styles.image}
              resizeMode="cover"
            />
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
        
        {/* Timer de descanso */}
        <View style={styles.timerContainer}>
          <Text style={styles.sectionTitle}>Timer de Descanso</Text>
          
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
          
          <View style={styles.timerControls}>
            <TouchableOpacity 
              style={styles.timerButton}
              onPress={toggleTimer}
            >
              <Ionicons 
                name={timerActive ? "pause" : "play"} 
                size={28} 
                color={COLORS.TEXT.LIGHT} 
              />
              <Text style={styles.buttonText}>
                {timerActive ? "Pausar" : "Iniciar"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.timerButton}
              onPress={resetTimer}
            >
              <Ionicons name="refresh" size={28} color={COLORS.TEXT.LIGHT} />
              <Text style={styles.buttonText}>Reiniciar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Modal de confirmação para excluir */}
      <Modal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Excluir Exercício"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            Tem certeza que deseja excluir o exercício "{exercise.name}"?
          </Text>
          <Text style={styles.modalSubtext}>
            Esta ação não pode ser desfeita.
          </Text>
          
          <View style={styles.modalButtons}>
            <Button
              title="Cancelar"
              onPress={() => setShowDeleteModal(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Excluir"
              onPress={handleDelete}
              variant="danger"
              style={styles.modalButton}
              loading={isLoading}
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
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: SPACING.SM,
    padding: SPACING.XS,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
    marginBottom: SPACING.MD,
    backgroundColor: COLORS.GRAY[900],
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
    backgroundColor: COLORS.GRAY[900],
  },
  detailsContainer: {
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  detailTitle: {
    fontSize: 18,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.GRAY[400],
    marginLeft: SPACING.XS,
    marginRight: SPACING.XS,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
  },
  notesContainer: {
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[800],
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.XS,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.GRAY[300],
  },
  setsContainer: {
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 18,
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
    borderWidth: 1,
    borderColor: COLORS.GRAY[700],
    borderRadius: BORDER_RADIUS.SM,
    marginBottom: SPACING.SM,
  },
  completedSetItem: {
    borderColor: COLORS.FEEDBACK.SUCCESS,
    backgroundColor: `${COLORS.FEEDBACK.SUCCESS}20`,
  },
  setText: {
    fontSize: 16,
    color: COLORS.TEXT.LIGHT,
  },
  markAllButton: {
    marginTop: SPACING.SM,
  },
  timerContainer: {
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.XL,
  },
  timerDisplay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY[900],
    borderRadius: BORDER_RADIUS.MD,
    paddingVertical: SPACING.LG,
    marginBottom: SPACING.MD,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.TEXT.LIGHT,
    fontVariant: ['tabular-nums'],
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timerButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.MD,
    width: '45%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.MD,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT.LIGHT,
    marginTop: SPACING.XS,
  },
  modalContent: {
    padding: SPACING.MD,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  modalSubtext: {
    fontSize: 14,
    color: COLORS.GRAY[400],
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
  }
});

export default ExerciseDetailScreen; 