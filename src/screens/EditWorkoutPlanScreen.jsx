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
  ScrollView
} from 'react-native';
import { workoutService } from '../services/WorkoutService';

const EditWorkoutPlanScreen = ({ route, navigation }) => {
  const { workoutPlanId } = route.params;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWorkoutPlan();
  }, [workoutPlanId]);

  const loadWorkoutPlan = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      
      console.log(`Carregando plano de treino com ID: ${workoutPlanId}`);
      const workoutPlan = await workoutService.getWorkoutPlanDetails(workoutPlanId);
      
      setName(workoutPlan.name || '');
      setDescription(workoutPlan.description || '');
      
      console.log('Plano de treino carregado com sucesso:', workoutPlan);
    } catch (err) {
      console.error('Erro ao carregar plano de treino:', err);
      setError('Não foi possível carregar o plano de treino. ' + err.message);
      Alert.alert('Erro', 'Não foi possível carregar o plano de treino.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        setError('O nome do treino é obrigatório');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      console.log(`Atualizando plano de treino com ID: ${workoutPlanId}`);
      const updatedWorkoutPlan = await workoutService.updateWorkoutPlan(workoutPlanId, {
        name,
        description,
        updated_at: new Date()
      });
      
      console.log('Plano de treino atualizado com sucesso:', updatedWorkoutPlan);
      Alert.alert('Sucesso', 'Plano de treino atualizado com sucesso!');
      navigation.goBack();
    } catch (err) {
      console.error('Erro ao atualizar plano de treino:', err);
      setError('Não foi possível atualizar o plano de treino. ' + err.message);
      Alert.alert('Erro', 'Não foi possível atualizar o plano de treino.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Confirmação',
      'Tem certeza que deseja excluir este plano de treino? Esta ação não pode ser desfeita e todos os exercícios serão removidos.',
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
              
              console.log(`Excluindo plano de treino com ID: ${workoutPlanId}`);
              await workoutService.deleteWorkoutPlan(workoutPlanId);
              
              console.log('Plano de treino excluído com sucesso');
              Alert.alert('Sucesso', 'Plano de treino excluído com sucesso!');
              navigation.navigate('Home');
            } catch (err) {
              console.error('Erro ao excluir plano de treino:', err);
              Alert.alert('Erro', 'Não foi possível excluir o plano de treino.');
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
        <Text style={styles.loadingText}>Carregando plano de treino...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <Text style={styles.title}>Editar Plano de Treino</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome do Treino</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Treino A - Peito/Tríceps"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva o objetivo deste treino..."
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
            <Text style={styles.buttonText}>Excluir Plano de Treino</Text>
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

export default EditWorkoutPlanScreen; 