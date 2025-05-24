import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, 
  TouchableOpacity, StatusBar, ActivityIndicator, Alert, FlatList 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, TEXT_VARIANT } from '../../design';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkoutPlans, getExercisesByWorkoutPlan, createWorkoutPlan, updateWorkoutPlan, uploadWorkoutImage, deleteWorkoutPlan } from '../../services';
import { Avatar, Modal, Button } from '../../components/ui';
import WorkoutCard from '../../components/workouts/WorkoutCard';
import WorkoutForm from '../../components/workouts/WorkoutForm';

const WorkoutSelectionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workoutCounts, setWorkoutCounts] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para buscar os treinos do usuário
  const fetchWorkouts = async () => {
    try {
      setIsLoading(true);
      
      // Buscar treinos do servidor
      const { data, error } = await getWorkoutPlans();
      
      if (error) {
        console.error('Erro ao buscar treinos do servidor:', error);
        Alert.alert('Erro', 'Não foi possível carregar seus treinos.');
        setIsLoading(false);
        setRefreshing(false);
        return;
      }
      
      if (data && data.length > 0) {
        setWorkouts(data);
        
        // Fetch exercise counts for each workout
        const countPromises = data.map(async (workout) => {
          try {
            const { data: exercises, error } = await getExercisesByWorkoutPlan(workout.id);
            if (error) {
              console.error(`Erro ao buscar exercícios do treino ${workout.id}:`, error);
              return { id: workout.id, count: 0 };
            }
            return { id: workout.id, count: exercises ? exercises.length : 0 };
          } catch (error) {
            console.error(`Erro ao buscar exercícios do treino ${workout.id}:`, error);
            return { id: workout.id, count: 0 };
          }
        });
        
        const results = await Promise.all(countPromises);
        const countsMap = {};
        results.forEach(result => {
          countsMap[result.id] = result.count;
        });
        
        setWorkoutCounts(countsMap);
      } else {
        setWorkouts([]);
        setWorkoutCounts({});
      }
    } catch (error) {
      console.error('Erro ao buscar treinos:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus treinos.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Carregar treinos ao entrar na tela
  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkouts();
  };

  // Navegar para a tela de detalhes do treino
  const handleWorkoutPress = (workout) => {
    navigation.navigate('ExerciseList', { workout });
  };

  // Função para abrir o modal de edição
  const handleEditWorkout = (workout) => {
    setCurrentWorkout(workout);
    setShowEditModal(true);
  };

  // Função para confirmar exclusão de treino
  const confirmDeleteWorkout = (workout) => {
    Alert.alert(
      'Excluir Treino',
      `Tem certeza que deseja excluir "${workout.name}"? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => handleDeleteWorkout(workout.id)
        },
      ]
    );
  };

  // Função para excluir treino
  const handleDeleteWorkout = async (workoutId) => {
    try {
      setIsLoading(true);
      const { error } = await deleteWorkoutPlan(workoutId);
      
      if (error) {
        throw new Error(error);
      }
      
      // Atualizar a lista após excluir
      fetchWorkouts();
      
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
      Alert.alert('Erro', 'Não foi possível excluir o treino.');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar a lista de treinos
  const renderWorkoutsList = () => {
    if (isLoading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      );
    }

    if (workouts.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons 
            name="barbell-outline" 
            size={64} 
            color={COLORS.GRAY[700]} 
            style={{ marginBottom: SPACING.MD }}
          />
          <Text style={styles.emptyText}>Você ainda não tem treinos</Text>
          <Text style={styles.emptySubtext}>
            Crie seu primeiro treino para começar a gerenciar seus exercícios
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.emptyButtonText}>Criar Treino</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.workoutList}
        renderItem={({ item }) => (
          <WorkoutCard 
            workout={item} 
            onPress={() => handleWorkoutPress(item)}
            onEdit={() => handleEditWorkout(item)}
            onDelete={() => confirmDeleteWorkout(item)}
            exerciseCount={workoutCounts[item.id] || 0}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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

  // Lidar com a criação de um novo treino
  const handleCreateWorkout = async (values) => {
    try {
      setIsSubmitting(true);
      
      if (!user || !user.id) {
        console.error('Usuário não autenticado ou sem ID');
        Alert.alert('Erro', 'Você precisa estar logado para criar um treino.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Iniciando criação de treino:', {
        nome: values.name,
        descricao: values.description,
        temImagem: !!values.localImage,
        userId: user.id
      });
      
      // Preparar dados com ID do usuário explícito
      const workoutData = {
        name: values.name,
        description: values.description || null,
        user_id: user.id
      };
      
      // Criar o treino
      const { data: createdWorkout, error } = await createWorkoutPlan(workoutData);
      
      if (error) {
        console.error('Erro ao criar treino:', error);
        Alert.alert('Erro', `Não foi possível criar o treino: ${error}`);
        return;
      }
      
      if (!createdWorkout || !createdWorkout.id) {
        console.error('Treino criado sem ID retornado');
        Alert.alert('Erro', 'O servidor não retornou o ID do treino criado.');
        return;
      }
      
      console.log('Treino criado com sucesso:', createdWorkout.id);
      
      // Se houver uma imagem local, fazer o upload após criar o treino
      if (values.localImage && createdWorkout.id) {
        console.log('Iniciando upload de imagem para o novo treino');
        
        try {
          const { data: imageData, error: imageError } = await uploadWorkoutImage(
            values.localImage, 
            createdWorkout.id
          );
          
          if (imageError) {
            console.error('Erro ao fazer upload de imagem:', imageError);
            Alert.alert(
              'Atenção',
              'O treino foi criado, mas houve um problema ao fazer upload da imagem. Você pode tentar adicionar a imagem mais tarde.',
              [{ text: 'OK' }]
            );
          } else if (imageData && imageData.url) {
            console.log('Imagem enviada com sucesso, atualizando treino');
            
            // Atualizar o treino com a URL da imagem
            const { error: updateError } = await updateWorkoutPlan(createdWorkout.id, { 
              image_url: imageData.url 
            });
            
            if (updateError) {
              console.error('Erro ao atualizar treino com URL da imagem:', updateError);
            }
          }
        } catch (uploadError) {
          console.error('Exceção ao fazer upload da imagem:', uploadError);
          Alert.alert(
            'Atenção',
            'O treino foi criado, mas houve um erro ao processar a imagem.',
            [{ text: 'OK' }]
          );
        }
      }
      
      // Fechar o modal e atualizar a lista
      setShowAddModal(false);
      Alert.alert('Sucesso', 'Treino criado com sucesso!');
      fetchWorkouts();
      
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      Alert.alert('Erro', 'Não foi possível criar o treino. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lidar com a atualização de um treino existente
  const handleUpdateWorkout = async (values) => {
    try {
      setIsSubmitting(true);
      
      if (!currentWorkout || !currentWorkout.id) {
        Alert.alert('Erro', 'Treino inválido para atualização.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Atualizando treino:', {
        id: currentWorkout.id,
        nome: values.name,
        descricao: values.description,
        temNovaImagem: !!values.localImage
      });
      
      // Preparar dados para atualização
      const workoutData = {
        name: values.name,
        description: values.description || null
      };
      
      // Atualizar o treino
      const { error } = await updateWorkoutPlan(currentWorkout.id, workoutData);
      
      if (error) {
        console.error('Erro ao atualizar treino:', error);
        Alert.alert('Erro', `Não foi possível atualizar o treino: ${error}`);
        return;
      }
      
      // Se houver uma imagem local nova, fazer o upload e atualizar
      if (values.localImage) {
        console.log('Fazendo upload da nova imagem');
        
        try {
          const { data: imageData, error: imageError } = await uploadWorkoutImage(
            values.localImage, 
            currentWorkout.id
          );
          
          if (imageError) {
            console.error('Erro ao fazer upload de imagem:', imageError);
            Alert.alert(
              'Atenção',
              'O treino foi atualizado, mas houve um problema ao fazer upload da nova imagem.',
              [{ text: 'OK' }]
            );
          } else if (imageData && imageData.url) {
            console.log('Imagem atualizada com sucesso:', imageData.url.substring(0, 50) + '...');
            
            // Atualizar o treino com a URL da imagem
            const { error: updateError } = await updateWorkoutPlan(currentWorkout.id, { 
              image_url: imageData.url 
            });
            
            if (updateError) {
              console.error('Erro ao atualizar treino com nova URL de imagem:', updateError);
              Alert.alert('Atenção', 'Houve um problema ao salvar a nova imagem.');
            }
          }
        } catch (uploadError) {
          console.error('Erro ao fazer upload da nova imagem:', uploadError);
          Alert.alert(
            'Atenção',
            'O treino foi atualizado, mas houve um erro ao processar a nova imagem.',
            [{ text: 'OK' }]
          );
        }
      }
      
      // Fechar o modal e atualizar a lista
      setShowEditModal(false);
      setCurrentWorkout(null);
      Alert.alert('Sucesso', 'Treino atualizado com sucesso!');
      fetchWorkouts();
      
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o treino. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>Bonde da Maromba</Text>
          <Text style={styles.welcomeText}>
            Olá, {user?.user_metadata?.full_name || 'Atleta'}
          </Text>
        </View>
        
        <Avatar 
          source={user?.user_metadata?.avatar_url} 
          name={user?.user_metadata?.full_name} 
          size="md" 
        />
      </View>
      
      {/* Título da seção */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Meus Treinos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.TEXT.LIGHT} />
        </TouchableOpacity>
      </View>
      
      {/* Lista de treinos com refresh */}
      <View style={{ flex: 1 }}>
        {renderWorkoutsList()}
      </View>
      
      {/* Modal para adicionar novo treino */}
      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Novo Treino"
      >
        <WorkoutForm
          onSubmit={handleCreateWorkout}
          isSubmitting={isSubmitting}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
      
      {/* Modal para editar treino existente */}
      <Modal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setCurrentWorkout(null);
        }}
        title="Editar Treino"
      >
        <WorkoutForm
          workout={currentWorkout}
          onSubmit={handleUpdateWorkout}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setShowEditModal(false);
            setCurrentWorkout(null);
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.DARK,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.XL + 30,
    paddingBottom: SPACING.MD,
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[800],
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT.LIGHT,
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.GRAY[300],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
  },
  addButton: {
    padding: SPACING.XS,
  },
  workoutList: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XL * 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
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
    borderRadius: 8,
  },
  emptyButtonText: {
    color: COLORS.TEXT.LIGHT,
    fontWeight: '600',
    fontSize: 16,
  },
  separator: {
    height: SPACING.MD,
  },
});

export default WorkoutSelectionScreen; 