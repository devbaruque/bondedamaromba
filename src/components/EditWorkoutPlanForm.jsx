import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { updateWorkoutPlan } from '../services/api/workoutPlans';

const EditWorkoutPlanForm = ({ route, navigation }) => {
  const { workoutPlan } = route.params;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (workoutPlan) {
      console.log('Carregando dados do treino para edição:', workoutPlan);
      setName(workoutPlan.name || '');
      setDescription(workoutPlan.description || '');
    }
  }, [workoutPlan]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!name.trim()) {
        setError('O nome do treino é obrigatório');
        return;
      }
      
      if (!workoutPlan || !workoutPlan.id) {
        setError('ID do treino não encontrado');
        console.error('ID do treino não disponível para edição');
        return;
      }
      
      // Log para debug
      console.log('Enviando atualização para o treino:', {
        id: workoutPlan.id,
        dados: { name, description }
      });
      
      const updatedWorkout = await updateWorkoutPlan(workoutPlan.id, {
        name,
        description,
        updated_at: new Date()
      });
      
      console.log('Treino atualizado com sucesso:', updatedWorkout);
      Alert.alert('Sucesso', 'Treino atualizado com sucesso!');
      navigation.goBack();
    } catch (err) {
      console.error('Erro ao salvar alterações do treino:', err);
      setError(err.message || 'Erro ao atualizar treino');
      
      // Exibir mensagem mais amigável ao usuário
      let userMessage = 'Não foi possível atualizar o treino. Tente novamente.';
      
      if (err.message.includes('sessão')) {
        userMessage = 'Sua sessão expirou. Faça login novamente.';
      } else if (err.message.includes('permissão')) {
        userMessage = 'Você não tem permissão para editar este treino.';
      }
      
      Alert.alert('Erro', userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Editar Treino</Text>
      
      {error && (
        <View style={{ backgroundColor: '#ffeeee', padding: 10, borderRadius: 5, marginBottom: 15 }}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      )}
      
      <Text>Nome do Treino</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={{ 
          borderWidth: 1, 
          borderColor: '#ccc', 
          padding: 10, 
          borderRadius: 5,
          marginBottom: 15 
        }}
        placeholder="Ex: Treino A - Peito/Tríceps"
      />
      
      <Text>Descrição (opcional)</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={{ 
          borderWidth: 1, 
          borderColor: '#ccc', 
          padding: 10, 
          borderRadius: 5,
          marginBottom: 20,
          height: 100,
          textAlignVertical: 'top'
        }}
        placeholder="Descrição do treino..."
        multiline
      />
      
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={{ 
          backgroundColor: loading ? '#aaa' : '#1A2A40', 
          padding: 15, 
          borderRadius: 5,
          alignItems: 'center' 
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salvar Alterações</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ 
          marginTop: 10,
          padding: 15, 
          borderRadius: 5,
          alignItems: 'center' 
        }}
      >
        <Text>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditWorkoutPlanForm; 