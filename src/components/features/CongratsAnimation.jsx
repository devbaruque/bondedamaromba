import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutTimer } from '../../contexts/WorkoutTimerContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../../design';

const { width, height } = Dimensions.get('window');

const CongratsAnimation = () => {
  const { showCongrats, hideCongrats, currentTime, formattedTime } = useWorkoutTimer();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  
  // Configurar animações quando o modal for mostrado
  useEffect(() => {
    if (showCongrats) {
      // Reset animações
      scaleAnim.setValue(0);
      
      // Iniciar animações
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }).start();
    }
  }, [showCongrats]);

  const hours = Math.floor(currentTime / 3600);
  const minutes = Math.floor((currentTime % 3600) / 60);
  
  let timeText = '';
  if (hours > 0) {
    timeText = `${hours} hora${hours > 1 ? 's' : ''} e ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  } else {
    timeText = `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }

  return (
    <Modal
      transparent
      visible={showCongrats}
      animationType="fade"
      onRequestClose={hideCongrats}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={hideCongrats}
      >
        <View style={styles.container}>
          <Animated.View style={[
            styles.checkmarkContainer,
            {
              transform: [
                { scale: scaleAnim },
              ],
            },
          ]}>
            <Ionicons name="checkmark-circle" size={100} color={COLORS.SUCCESS} />
          </Animated.View>
          
          <Text style={styles.title}>Treino Concluído!</Text>
          <Text style={styles.message}>
            Parabéns! Você completou seu treino em {timeText}.
          </Text>
          <Text style={styles.subtitle}>
            Continue com essa dedicação!
          </Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={hideCongrats}
          >
            <Text style={styles.buttonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  checkmarkContainer: {
    marginBottom: SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.TEXT.DEFAULT,
    marginBottom: SPACING.MD,
    textAlign: 'center',
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT.MUTED,
    marginBottom: SPACING.XL,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
  },
  buttonText: {
    color: COLORS.TEXT.LIGHT,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CongratsAnimation; 