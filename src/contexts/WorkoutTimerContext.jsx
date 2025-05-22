import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { differenceInSeconds } from 'date-fns';

// Criando o contexto
export const WorkoutTimerContext = createContext();

// Hook personalizado para usar o contexto
export const useWorkoutTimer = () => useContext(WorkoutTimerContext);

// Provedor do contexto
export const WorkoutTimerProvider = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [workoutName, setWorkoutName] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const timerRef = useRef(null);

  // Iniciar o timer
  const startTimer = (id, name) => {
    console.log('WorkoutTimerContext: Iniciando timer', { id, name });
    const now = new Date();
    setStartTime(now);
    setCurrentTime(0);
    setSessionId(id);
    setWorkoutName(name);
    setIsActive(true);
    
    // Limpar qualquer timer existente
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Armazenar a hora de início localmente para não depender do estado
    const startTimeLocal = now;
    
    // Iniciar o contador imediatamente com a data atual
    timerRef.current = setInterval(() => {
      const nowTime = new Date();
      const diff = differenceInSeconds(nowTime, startTimeLocal);
      console.log('WorkoutTimerContext: Atualizando timer', { diff });
      setCurrentTime(diff);
    }, 1000);
  };

  // Parar o timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
  };

  // Finalizar o treino
  const finishWorkout = () => {
    stopTimer();
    setShowCongrats(true);
    // Esconder animação após 5 segundos
    setTimeout(() => {
      setShowCongrats(false);
      setSessionId(null);
      setWorkoutName('');
      setStartTime(null);
      setCurrentTime(0);
    }, 5000);
  };

  // Esconder animação de parabéns
  const hideCongrats = () => {
    setShowCongrats(false);
  };

  // Limpar o timer ao desmontar o componente
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Formatar o tempo para exibição
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedTime = formatTime(currentTime);

  return (
    <WorkoutTimerContext.Provider
      value={{
        isActive,
        sessionId,
        workoutName,
        currentTime,
        formattedTime,
        startTimer,
        stopTimer,
        finishWorkout,
        showCongrats,
        hideCongrats
      }}
    >
      {children}
    </WorkoutTimerContext.Provider>
  );
};

export default WorkoutTimerProvider; 