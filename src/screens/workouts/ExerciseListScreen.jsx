import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl, Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TEXT_VARIANT, BORDER_RADIUS } from '../../design';
import { getExercisesByWorkoutPlan } from '../../services';
import { Card, Modal } from '../../components/ui';

const ExerciseListScreen = ({ navigation, route }) => {
  const { workout } = route.params;
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
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

  // Carregar exercícios ao montar o componente
  useEffect(() => {
    fetchExercises();
  }, [workout.id]);

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
    navigation.navigate('ExerciseDetail', { exercise });
  };

  // Renderizar um item da lista de exercícios
  const renderExerciseItem = ({ item }) => {
    // Determinar se há imagens para este exercício
    const hasImages = item.exercise_images && item.exercise_images.length > 0;
    
    return (
      <Card 
        style={styles.exerciseCard}
        onPress={() => handleExercisePress(item)}
      >
        <View style={styles.exerciseContent}>
          {/* Ícone ou primeira imagem */}
          <View style={styles.exerciseImageContainer}>
            {hasImages ? (
              <Image 
                source={{ uri: item.exercise_images[0].image_url }} 
                style={styles.exerciseImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.exerciseIcon}>
                <Ionicons name="barbell-outline" size={32} color={COLORS.PRIMARY} />
              </View>
            )}
          </View>
          
          {/* Informações do exercício */}
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            
            <View style={styles.exerciseDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Séries:</Text>
                <Text style={styles.detailValue}>{item.sets}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Repetições:</Text>
                <Text style={styles.detailValue}>{item.repetitions}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Descanso:</Text>
                <Text style={styles.detailValue}>{item.rest_time}s</Text>
              </View>
            </View>
          </View>
          
          {/* Ícone de seta */}
          <Ionicons name="chevron-forward" size={24} color={COLORS.GRAY[600]} />
        </View>
      </Card>
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

  return (
    <View style={styles.container}>
      {renderContent()}
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
  exerciseCard: {
    marginBottom: 0,
    padding: 0,
  },
  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
  },
  exerciseImageContainer: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
    backgroundColor: COLORS.GRAY[800],
    marginRight: SPACING.MD,
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  exerciseIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...TEXT_VARIANT.labelLarge,
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.XS,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    marginRight: SPACING.MD,
    marginBottom: SPACING.XS,
  },
  detailLabel: {
    ...TEXT_VARIANT.bodySmall,
    color: COLORS.GRAY[500],
    marginRight: SPACING.XS,
  },
  detailValue: {
    ...TEXT_VARIANT.bodySmall,
    color: COLORS.TEXT.DEFAULT,
    fontWeight: '500',
  },
  separator: {
    height: SPACING.SM,
  },
});

export default ExerciseListScreen; 