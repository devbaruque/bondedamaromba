import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { updateExercise } from '../services/api/exercises';

const EditExerciseForm = ({ route, navigation }) => {
  const { exercise } = route.params;
  const [name, setName] = useState('');
  const [sets, setSets] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [restTime, setRestTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (exercise) {
      console.log('Carregando dados do exercício para edição:', exercise);
      setName(exercise.name || '');
      setSets(exercise.sets ? exercise.sets.toString() : '');
      setRepetitions(exercise.repetitions ? exercise.repetitions.toString() : '');
      setRestTime(exercise.rest_time ? exercise.rest_time.toString() : '');
      setNotes(exercise.notes || '');
    }
  }, [exercise]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!name.trim()) {
        setError('O nome do exercício é obrigatório');
        return;
      }
      
      if (!sets || isNaN(parseInt(sets))) {
        setError('O número de séries é obrigatório');
        return;
      }
      
      if (!repetitions || isNaN(parseInt(repetitions))) {
        setError('O número de repetições é obrigatório');
        return;
      }
      
      if (!exercise || !exercise.id) {
        setError('ID do exercício não encontrado');
        console.error('ID do exercício não disponível para edição');
        return;
      }
      
      // Log para debug
      console.log('Enviando atualização para o exercício:', {
        id: exercise.id,
        dados: { 
          name, 
          sets: parseInt(sets), 
          repetitions: parseInt(repetitions),
          rest_time: restTime ? parseInt(restTime) : null,
          notes 
        }
      });
      
      const updatedExercise = await updateExercise(exercise.id, {
        name,
        sets: parseInt(sets),
        repetitions: parseInt(repetitions),
        rest_time: restTime ? parseInt(restTime) : null,
        notes,
        updated_at: new Date()
      });
      
      console.log('Exercício atualizado com sucesso:', updatedExercise);
      Alert.alert('Sucesso', 'Exercício atualizado com sucesso!');
      navigation.goBack();
    } catch (err) {
      console.error('Erro ao salvar alterações do exercício:', err);
      setError(err.message || 'Erro ao atualizar exercício');
      
      // Exibir mensagem mais amigável ao usuário
      let userMessage = 'Não foi possível atualizar o exercício. Tente novamente.';
      
      if (err.message.includes('sessão')) {
        userMessage = 'Sua sessão expirou. Faça login novamente.';
      } else if (err.message.includes('permissão')) {
        userMessage = 'Você não tem permissão para editar este exercício.';
      }
      
      Alert.alert('Erro', userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, marginBottom: 20 }}>Editar Exercício</Text>
        
        {error && (
          <View style={{ backgroundColor: '#ffeeee', padding: 10, borderRadius: 5, marginBottom: 15 }}>
            <Text style={{ color: 'red' }}>{error}</Text>
          </View>
        )}
        
        <Text>Nome do Exercício</Text>
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
          placeholder="Ex: Supino Reto"
        />
        
        <Text>Séries</Text>
        <TextInput
          value={sets}
          onChangeText={setSets}
          keyboardType="number-pad"
          style={{ 
            borderWidth: 1, 
            borderColor: '#ccc', 
            padding: 10, 
            borderRadius: 5,
            marginBottom: 15 
          }}
          placeholder="Ex: 4"
        />
        
        <Text>Repetições</Text>
        <TextInput
          value={repetitions}
          onChangeText={setRepetitions}
          keyboardType="number-pad"
          style={{ 
            borderWidth: 1, 
            borderColor: '#ccc', 
            padding: 10, 
            borderRadius: 5,
            marginBottom: 15 
          }}
          placeholder="Ex: 12"
        />
        
        <Text>Tempo de Descanso (segundos)</Text>
        <TextInput
          value={restTime}
          onChangeText={setRestTime}
          keyboardType="number-pad"
          style={{ 
            borderWidth: 1, 
            borderColor: '#ccc', 
            padding: 10, 
            borderRadius: 5,
            marginBottom: 15 
          }}
          placeholder="Ex: 60"
        />
        
        <Text>Observações (opcional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={{ 
            borderWidth: 1, 
            borderColor: '#ccc', 
            padding: 10, 
            borderRadius: 5,
            marginBottom: 20,
            height: 100,
            textAlignVertical: 'top'
          }}
          placeholder="Observações sobre o exercício..."
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
    </ScrollView>
  );
};

export default EditExerciseForm; 