import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TEXT_VARIANT, BORDER_RADIUS } from '../../design';

/**
 * Timer para controle de descanso entre séries
 * @param {object} props - Propriedades do componente
 * @param {number} props.defaultTime - Tempo inicial em segundos
 * @param {function} props.onComplete - Função chamada ao completar o timer
 */
const RestTimer = ({ defaultTime = 60, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(defaultTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Formatar o tempo em minutos e segundos
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Iniciar o timer
  const startTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  // Pausar o timer
  const pauseTimer = () => {
    setIsPaused(true);
  };

  // Continuar o timer após pausa
  const resumeTimer = () => {
    setIsPaused(false);
  };

  // Resetar o timer
  const resetTimer = () => {
    setTimeLeft(defaultTime);
    setIsRunning(false);
    setIsPaused(false);
  };

  // Adicionar 30 segundos
  const addThirtySeconds = () => {
    setTimeLeft(prev => prev + 30);
  };

  // Atualizar o timer quando isRunning e isPaused mudam
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            
            // Vibrar o dispositivo quando o timer chegar a zero
            Vibration.vibrate([500, 500, 500]);
            
            // Chamar o callback de conclusão
            if (onComplete) {
              onComplete();
            }
            
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, onComplete]);

  // Limpar intervalo quando o componente desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Calcular a porcentagem para o indicador visual
  const percentComplete = (timeLeft / defaultTime) * 100;
  const strokeDasharray = 2 * Math.PI * 45;
  const strokeDashoffset = strokeDasharray * (1 - percentComplete / 100);

  return (
    <View style={styles.container}>
      {/* Display do Timer */}
      <View style={styles.timerDisplay}>
        <View style={styles.timerCircle}>
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
            
            <View style={styles.progressIndicator}>
              <Ionicons 
                name={isRunning && !isPaused ? "timer" : "timer-outline"} 
                size={20} 
                color={timeLeft <= 10 ? COLORS.FEEDBACK.ERROR : COLORS.PRIMARY} 
              />
            </View>
          </View>
        </View>
      </View>
      
      {/* Controles do Timer */}
      <View style={styles.controls}>
        {!isRunning ? (
          <TouchableOpacity style={styles.controlButton} onPress={startTimer}>
            <Ionicons name="play" size={24} color={COLORS.TEXT.LIGHT} />
            <Text style={styles.buttonText}>Iniciar</Text>
          </TouchableOpacity>
        ) : isPaused ? (
          <TouchableOpacity style={styles.controlButton} onPress={resumeTimer}>
            <Ionicons name="play" size={24} color={COLORS.TEXT.LIGHT} />
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.controlButton} onPress={pauseTimer}>
            <Ionicons name="pause" size={24} color={COLORS.TEXT.LIGHT} />
            <Text style={styles.buttonText}>Pausar</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
          <Ionicons name="refresh" size={24} color={COLORS.TEXT.LIGHT} />
          <Text style={styles.buttonText}>Reiniciar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={addThirtySeconds}>
          <Ionicons name="add-circle-outline" size={24} color={COLORS.TEXT.LIGHT} />
          <Text style={styles.buttonText}>+30s</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    width: '100%',
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  timerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.BACKGROUND.DARK,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.PRIMARY,
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    ...TEXT_VARIANT.headingLarge,
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.XS,
  },
  progressIndicator: {
    position: 'absolute',
    bottom: -5,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.SM,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SM,
    marginHorizontal: SPACING.XXS,
  },
  buttonText: {
    ...TEXT_VARIANT.labelSmall,
    color: COLORS.TEXT.LIGHT,
    marginTop: SPACING.XXS,
  }
});

export default RestTimer; 