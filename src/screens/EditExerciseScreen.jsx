import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { workoutService } from '../services/WorkoutService';

const EditExerciseScreen = ({ route, navigation }) => {
  const { exerciseId } = route.params;
  const [name, setName] = useState('');
  const [sets, setSets] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [restTime, setRestTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workoutPlanId, setWorkoutPlanId] = useState(null);

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  const loadExercise = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      
      console.log(`Carregando exercício com ID: ${exerciseId}`);
      const exercise = await workoutService.exerciseRepo.findById(exerciseId);
      
      if (!exercise) {
        throw new Error('Exercício não encontrado');
      }
      
      setName(exercise.name || '');
      setSets(exercise.sets ? exercise.sets.toString() : '');
      setRepetitions(exercise.repetitions ? exercise.repetitions.toString() : '');
      setRestTime(exercise.rest_time ? exercise.rest_time.toString() : '');
      setNotes(exercise.notes || '');
      setWorkoutPlanId(exercise.workout_plan_id);
      
      console.log('Exercício carregado com sucesso:', exercise);
    } catch (err) {
      console.error('Erro ao carregar exercício:', err);
      setError('Não foi possível carregar o exercício. ' + err.message);
      Alert.alert('Erro', 'Não foi possível carregar o exercício.');
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('O nome do exercício é obrigatório');
      return false;
    }
    
    if (!sets || isNaN(parseInt(sets)) || parseInt(sets) <= 0) {
      setError('Número de séries deve ser maior que zero');
      return false;
    }
    
    if (!repetitions || isNaN(parseInt(repetitions)) || parseInt(repetitions) <= 0) {
      setError('Número de repetições deve ser maior que zero');
      return false;
    }
    
    if (restTime && (isNaN(parseInt(restTime)) || parseInt(restTime) < 0)) {
      setError('Tempo de descanso deve ser um número positivo');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    try {
      if (!validateForm()) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const exerciseData = {
        name,
        sets: parseInt(sets),
        repetitions: parseInt(repetitions),
        rest_time: restTime ? parseInt(restTime) : null,
        notes,
        updated_at: new Date()
      };
      
      console.log(`Atualizando exercício com ID: ${exerciseId}`, exerciseData);
      const updatedExercise = await workoutService.updateExercise(exerciseId, exerciseData);
      
      console.log('Exercício atualizado com sucesso:', updatedExercise);
      Alert.alert('Sucesso', 'Exercício atualizado com sucesso!');
      navigation.goBack();
    } catch (err) {
      console.error('Erro ao atualizar exercício:', err);
      setError('Não foi possível atualizar o exercício. ' + err.message);
      Alert.alert('Erro', 'Não foi possível atualizar o exercício.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Confirmação',
      'Tem certeza que deseja excluir este exercício? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              console.log(`Excluindo exercício com ID: ${exerciseId}`);
              await workoutService.deleteExercise(exerciseId);
              
              console.log('Exercício excluído com sucesso');
              Alert.alert('Sucesso', 'Exercício excluído com sucesso!');
              navigation.goBack();
            } catch (err) {
              console.error('Erro ao excluir exercício:', err);
              Alert.alert('Erro', 'Não foi possível excluir o exercício.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A2A40" />
        <Text style={styles.loadingText}>Carregando exercício...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <View style={styles.content}>
            <Text style={styles.title}>Editar Exercício</Text>
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nome do Exercício</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Supino Reto"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Séries</Text>
                <TextInput
                  style={styles.input}
                  value={sets}
                  onChangeText={setSets}
                  placeholder="Ex: 4"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Repetições</Text>
                <TextInput
                  style={styles.input}
                  value={repetitions}
                  onChangeText={setRepetitions}
                  placeholder="Ex: 12"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tempo de Descanso (segundos)</Text>
              <TextInput
                style={styles.input}
                value={restTime}
                onChangeText={setRestTime}
                placeholder="Ex: 60"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Observações (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Dicas de execução, variações, etc."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Salvar Alterações</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.deleteButton, loading && styles.disabledButton]}
              onPress={handleDelete}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Excluir Exercício</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1A2A40',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1A2A40',
  },
  errorContainer: {
    backgroundColor: '#FFEEEE',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#CC0000',
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 120,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#1A2A40',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#999',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default EditExerciseScreen; 