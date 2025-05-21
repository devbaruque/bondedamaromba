import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, 
  TouchableOpacity, StatusBar, ActivityIndicator, Alert 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SPACING, TEXT_VARIANT } from '../../design';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkoutPlans, getExercisesByWorkoutPlan, createWorkoutPlan, updateWorkoutPlan, uploadWorkoutImage } from '../../services';
import { Avatar, Modal } from '../../components/ui';
import WorkoutCard from '../../components/workouts/WorkoutCard';
import WorkoutForm from '../../components/workouts/WorkoutForm';

const WorkoutSelectionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workoutCounts, setWorkoutCounts] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para buscar os treinos do usuário
  const fetchWorkouts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getWorkoutPlans();
      
      if (error) {
        console.error('Erro ao buscar treinos:', error);
        Alert.alert('Erro', 'Não foi possível carregar seus treinos.');
        return;
      }
      
      setWorkouts(data || []);
      
      // Fetch exercise counts for each workout
      const countPromises = data.map(async (workout) => {
        const { data: exercises } = await getExercisesByWorkoutPlan(workout.id);
        return { id: workout.id, count: exercises ? exercises.length : 0 };
      });
      
      const results = await Promise.all(countPromises);
      const countsMap = {};
      results.forEach(result => {
        countsMap[result.id] = result.count;
      });
      
      setWorkoutCounts(countsMap);
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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.workoutList}
      >
        {workouts.map(workout => (
          <WorkoutCard 
            key={workout.id} 
            workout={workout} 
            onPress={() => handleWorkoutPress(workout)}
            exerciseCount={workoutCounts[workout.id] || 0}
          />
        ))}
      </ScrollView>
    );
  };

  // Lidar com a criação de um novo treino
  const handleCreateWorkout = async (values) => {
    try {
      setIsSubmitting(true);
      
      // Preparar dados
      const workoutData = {
        name: values.name,
        description: values.description || null,
        user_id: user.id,
      };
      
      // Criar o treino
      const { data: createdWorkout, error } = await createWorkoutPlan(workoutData);
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível criar o treino.');
        return;
      }
      
      // Se houver uma imagem local, fazer o upload após criar o treino
      if (values.localImage && createdWorkout.id) {
        const { data: imageData, error: imageError } = await uploadWorkoutImage(
          values.localImage, 
          createdWorkout.id
        );
        
        if (!imageError && imageData) {
          // Atualizar o treino com a URL da imagem
          await updateWorkoutPlan(createdWorkout.id, { 
            image_url: imageData.url 
          });
        }
      }
      
      // Fechar o modal e atualizar a lista
      setShowAddModal(false);
      fetchWorkouts();
      
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      Alert.alert('Erro', 'Não foi possível criar o treino.');
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

      {/* Seção de treinos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meus Treinos</Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={24} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.content} 
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[COLORS.PRIMARY]} 
              tintColor={COLORS.PRIMARY}
            />
          }
        >
          {renderWorkoutsList()}
        </ScrollView>
      </View>

      {/* Modal para adicionar treino */}
      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Novo Treino"
        variant="center"
      >
        <WorkoutForm 
          onSubmit={handleCreateWorkout} 
          isLoading={isSubmitting}
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
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.XL,
    paddingBottom: SPACING.MD,
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
  },
  appTitle: {
    ...TEXT_VARIANT.headingSmall,
    color: COLORS.TEXT.LIGHT,
  },
  welcomeText: {
    ...TEXT_VARIANT.bodyDefault,
    color: COLORS.TEXT.DEFAULT,
    marginTop: SPACING.XS,
  },
  section: {
    flex: 1,
    paddingVertical: SPACING.MD,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  sectionTitle: {
    ...TEXT_VARIANT.labelLarge,
    color: COLORS.TEXT.LIGHT,
  },
  content: {
    flexGrow: 1,
  },
  workoutList: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.MD,
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
});

export default WorkoutSelectionScreen; 