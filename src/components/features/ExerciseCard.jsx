import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Animated } from 'react-native';
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
 * @param {boolean} props.isHighlighted - Se o exercício está sendo destacado durante a marcação automática
 */
const ExerciseCard = ({ 
  exercise, 
  onPress, 
  isCompleted = false, 
  onToggleComplete,
  onEdit,
  onDelete,
  isHighlighted = false
}) => {
  const hasImages = exercise.exercise_images && exercise.exercise_images.length > 0;
  
  // Ordenar imagens por order_index
  const sortedImages = hasImages 
    ? [...exercise.exercise_images].sort((a, b) => a.order_index - b.order_index)
    : [];
    
  // Animação de destaque
  const highlightAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isHighlighted) {
      // Animar o destaque pulsando
      Animated.sequence([
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(highlightAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        })
      ]).start();
    } else {
      // Resetar animação
      highlightAnim.setValue(0);
    }
  }, [isHighlighted]);
  
  // Cores para a animação
  const highlightBackground = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.BACKGROUND.DEFAULT, COLORS.PRIMARY_LIGHT]
  });
  
  // Definir estilos do container
  const containerStyle = [
    styles.container,
    isCompleted && styles.completedContainer,
    isHighlighted && { transform: [{ scale: 1.02 }] },
    isHighlighted && { 
      backgroundColor: highlightBackground,
      borderWidth: 2,
      borderColor: COLORS.PRIMARY,
    }
  ];

  // Funções otimizadas com useCallback
  const handleCompletePress = useCallback((e) => {
    e.stopPropagation();
    onToggleComplete(exercise.id);
  }, [exercise.id, onToggleComplete]);

  const handleEditPress = useCallback((e) => {
    e.stopPropagation();
    onEdit(exercise);
  }, [exercise, onEdit]);

  const handleDeletePress = useCallback((e) => {
    e.stopPropagation();
    onDelete(exercise.id);
  }, [exercise.id, onDelete]);

  return (
    <Animated.View style={containerStyle}>
      <TouchableOpacity 
        style={styles.touchable}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={isHighlighted}
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
                onPress={handleCompletePress}
                disabled={isHighlighted}
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
            {onEdit && !isHighlighted && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleEditPress}
              >
                <Ionicons name="pencil" size={16} color={COLORS.TEXT.LIGHT} />
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>
            )}
            
            {onDelete && !isHighlighted && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeletePress}
              >
                <Ionicons name="trash" size={16} color={COLORS.FEEDBACK.ERROR} />
                <Text style={[styles.actionText, styles.deleteText]}>Excluir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
  touchable: {
    flex: 1,
  },
  completedContainer: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.FEEDBACK.SUCCESS,
    backgroundColor: 'rgba(76, 175, 80, 0.1)', // Fundo verde claro para destacar exercícios completados
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

// Exportar com memo para evitar renderizações desnecessárias
export default React.memo(ExerciseCard, (prevProps, nextProps) => {
  // Função de comparação personalizada para o memo
  return (
    prevProps.exercise.id === nextProps.exercise.id &&
    prevProps.isCompleted === nextProps.isCompleted &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    // Se o exercício mudar (através de edição), precisamos re-renderizar
    prevProps.exercise.name === nextProps.exercise.name &&
    prevProps.exercise.sets === nextProps.exercise.sets &&
    prevProps.exercise.repetitions === nextProps.exercise.repetitions &&
    prevProps.exercise.rest_time === nextProps.exercise.rest_time
  );
}); 