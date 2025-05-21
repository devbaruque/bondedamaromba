import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TEXT_VARIANT, BORDER_RADIUS } from '../../design';
import defaultImageBase64 from '../../assets/default-workout';

/**
 * Componente de cartão para exibir um plano de treino
 * @param {object} props - Propriedades do componente
 * @param {object} props.workout - Dados do treino
 * @param {function} props.onPress - Função chamada ao clicar no card
 * @param {function} props.onEdit - Função chamada ao clicar em editar
 * @param {function} props.onDelete - Função chamada ao clicar em excluir
 * @param {number} props.exerciseCount - Quantidade de exercícios no treino
 */
const WorkoutCard = ({ workout, onPress, onEdit, onDelete, exerciseCount = 0 }) => {
  // Usar imagem padrão se o treino não tiver uma
  const imageSource = workout.image_url ? { uri: workout.image_url } : { uri: defaultImageBase64 };

  // Prevenir propagação de eventos
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit && onEdit();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete && onDelete();
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ImageBackground
        source={imageSource}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          {/* Menu de opções */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Ionicons name="pencil" size={18} color={COLORS.TEXT.LIGHT} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color={COLORS.TEXT.LIGHT} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.title}>{workout.name}</Text>
            
            {workout.description && (
              <Text style={styles.description} numberOfLines={2}>
                {workout.description}
              </Text>
            )}
            
            <View style={styles.details}>
              <View style={styles.detailItem}>
                <Ionicons name="barbell-outline" size={20} color={COLORS.TEXT.LIGHT} />
                <Text style={styles.detailText}>{exerciseCount} exercícios</Text>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 160,
    borderRadius: BORDER_RADIUS.LG,
    overflow: 'hidden',
  },
  background: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backgroundImage: {
    borderRadius: BORDER_RADIUS.LG,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    padding: SPACING.MD,
  },
  title: {
    ...TEXT_VARIANT.headingSmall,
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.XS,
  },
  description: {
    ...TEXT_VARIANT.bodySmall,
    color: COLORS.TEXT.DEFAULT,
    opacity: 0.8,
    marginBottom: SPACING.SM,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.XS,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  detailText: {
    ...TEXT_VARIANT.bodySmall,
    color: COLORS.TEXT.LIGHT,
    marginLeft: SPACING.XS,
  },
  actions: {
    position: 'absolute',
    top: SPACING.SM,
    right: SPACING.SM,
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.XS,
  },
});

export default WorkoutCard; 