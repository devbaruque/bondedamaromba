import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TEXT_VARIANT, BORDER_RADIUS } from '../../design';

/**
 * Card de exercício para exibição na lista de exercícios
 * @param {object} props - Propriedades do componente
 * @param {object} props.exercise - Dados do exercício
 * @param {function} props.onPress - Função chamada ao clicar no card
 * @param {boolean} props.isCompleted - Se o exercício foi concluído
 * @param {function} props.onToggleComplete - Função para alternar estado de conclusão
 * @param {function} props.onEdit - Função chamada ao clicar em editar
 * @param {function} props.onDelete - Função chamada ao clicar em excluir
 */
const ExerciseCard = ({ 
  exercise, 
  onPress, 
  isCompleted = false, 
  onToggleComplete,
  onEdit,
  onDelete 
}) => {
  const hasImages = exercise.exercise_images && exercise.exercise_images.length > 0;
  
  // Ordenar imagens por order_index
  const sortedImages = hasImages 
    ? [...exercise.exercise_images].sort((a, b) => a.order_index - b.order_index)
    : [];

  return (
    <TouchableOpacity 
      style={[styles.container, isCompleted && styles.completedContainer]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Imagens do exercício (se houver) */}
      {hasImages && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.imagesContainer}
          contentContainerStyle={styles.imagesContent}
        >
          {sortedImages.map((image) => (
            <Image
              key={image.id}
              source={{ uri: image.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}
      
      {/* Detalhes do exercício */}
      <View style={styles.detailsContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title} numberOfLines={1}>{exercise.name}</Text>
          
          {/* Botão de completar exercício */}
          {onToggleComplete && (
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={(e) => {
                e.stopPropagation();
                onToggleComplete(exercise.id);
              }}
            >
              <Ionicons 
                name={isCompleted ? "checkmark-circle" : "checkmark-circle-outline"} 
                size={24} 
                color={isCompleted ? COLORS.FEEDBACK.SUCCESS : COLORS.TEXT.LIGHT} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Informações sobre séries, repetições, etc */}
        <View style={styles.statsContainer}>
          <View style={styles.statsItem}>
            <Ionicons name="repeat" size={16} color={COLORS.TEXT.MUTED} />
            <Text style={styles.statsText}>{exercise.sets}x{exercise.repetitions}</Text>
          </View>
          
          <View style={styles.statsItem}>
            <Ionicons name="timer-outline" size={16} color={COLORS.TEXT.MUTED} />
            <Text style={styles.statsText}>{exercise.rest_time}s</Text>
          </View>
        </View>
        
        {/* Notas do exercício (se houver) */}
        {exercise.notes && (
          <Text style={styles.notes} numberOfLines={2}>{exercise.notes}</Text>
        )}
        
        {/* Botões de ação */}
        <View style={styles.actionsContainer}>
          {onEdit && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onEdit(exercise);
              }}
            >
              <Ionicons name="pencil" size={16} color={COLORS.TEXT.LIGHT} />
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
          )}
          
          {onDelete && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation();
                onDelete(exercise.id);
              }}
            >
              <Ionicons name="trash" size={16} color={COLORS.FEEDBACK.ERROR} />
              <Text style={[styles.actionText, styles.deleteText]}>Excluir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.MD,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completedContainer: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.FEEDBACK.SUCCESS,
  },
  imagesContainer: {
    maxHeight: 120,
  },
  imagesContent: {
    padding: SPACING.XS,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.SM,
    marginRight: SPACING.XS,
  },
  detailsContainer: {
    padding: SPACING.MD,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  title: {
    ...TEXT_VARIANT.headingSmall,
    color: COLORS.TEXT.LIGHT,
    flex: 1,
  },
  completeButton: {
    padding: SPACING.XS,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.SM,
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  statsText: {
    ...TEXT_VARIANT.bodySmall,
    color: COLORS.TEXT.MUTED,
    marginLeft: SPACING.XS,
  },
  notes: {
    ...TEXT_VARIANT.bodySmall,
    color: COLORS.TEXT.MUTED,
    marginBottom: SPACING.SM,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.XS,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.XS,
    marginLeft: SPACING.SM,
  },
  actionText: {
    ...TEXT_VARIANT.labelSmall,
    color: COLORS.TEXT.LIGHT,
    marginLeft: SPACING.XXS,
  },
  deleteButton: {
    borderRadius: BORDER_RADIUS.SM,
  },
  deleteText: {
    color: COLORS.FEEDBACK.ERROR,
  }
});

export default ExerciseCard; 