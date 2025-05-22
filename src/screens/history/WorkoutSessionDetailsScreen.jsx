import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  ActivityIndicator, Alert, TouchableOpacity,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, intervalToDuration, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { COLORS, SPACING, TEXT_VARIANT, BORDER_RADIUS } from '../../design';
import { getWorkoutSessionDetails } from '../../services';
import supabase from '../../services/supabase';

const WorkoutSessionDetailsScreen = ({ navigation, route }) => {
  // Garantir que route.params exista para evitar erros
  const params = route?.params || {};
  const { sessionId, sessionData: initialSessionData } = params;
  const [sessionData, setSessionData] = useState(initialSessionData || null);
  const [isLoading, setIsLoading] = useState(!initialSessionData);

  // Buscar detalhes da sessão
  useEffect(() => {
    console.log('WorkoutSessionDetailsScreen - useEffect - Parâmetros recebidos:', {
      sessionId,
      hasInitialData: !!initialSessionData,
      route: route ? 'existe' : 'undefined',
      params: params ? 'existe' : 'undefined'
    });
    
    // Verificação de segurança para parâmetros
    if (!params || (!sessionId && !initialSessionData)) {
      console.error('WorkoutSessionDetailsScreen - Parâmetros inválidos ou ausentes');
      Alert.alert(
        'Erro', 
        'Não foi possível carregar os detalhes da sessão devido a parâmetros inválidos.', 
        [{ text: 'Voltar', onPress: () => navigation.goBack() }]
      );
      return;
    }
    
    if (initialSessionData) {
      console.log('WorkoutSessionDetailsScreen - Usando dados pré-carregados');
      setSessionData(initialSessionData);
      setIsLoading(false);
    } else {
      fetchSessionDetails();
    }
  }, [sessionId, initialSessionData]);

  const fetchSessionDetails = async (retryCount = 0) => {
    try {
      console.log(`WorkoutSessionDetailsScreen - Iniciando busca de detalhes, sessionId: ${sessionId}, tentativa: ${retryCount + 1}`);
      if (!sessionId) {
        console.error('WorkoutSessionDetailsScreen - sessionId não fornecido');
        Alert.alert('Erro', 'ID da sessão não fornecido');
        navigation.goBack();
        return;
      }

      setIsLoading(true);
      
      console.log('WorkoutSessionDetailsScreen - Chamando API getWorkoutSessionDetails');
      const { data, error } = await getWorkoutSessionDetails(sessionId);
      
      if (error) {
        console.error('WorkoutSessionDetailsScreen - Erro ao buscar detalhes da sessão:', error);
        
        // Tentar novamente em caso de erro de rede
        if (retryCount < 2 && (error.message?.includes('network') || error.message?.includes('timeout'))) {
          console.log(`WorkoutSessionDetailsScreen - Erro de rede, tentando novamente (${retryCount + 1}/3)`);
          setIsLoading(false);
          setTimeout(() => {
            fetchSessionDetails(retryCount + 1);
          }, 1000 * (retryCount + 1)); // Aumenta o tempo entre tentativas
          return;
        }
        
        Alert.alert('Erro', 'Não foi possível carregar os detalhes desta sessão.');
        navigation.goBack();
        return;
      }
      
      if (!data) {
        console.error('WorkoutSessionDetailsScreen - Nenhum dado retornado para a sessão:', sessionId);
        
        // Verificar se está relacionado a problemas de autenticação
        try {
          const authSession = await supabase.auth.getSession();
          if (!authSession?.data?.session) {
            console.error('WorkoutSessionDetailsScreen - Usuário não autenticado');
            Alert.alert('Sessão expirada', 'Sua sessão expirou. Por favor, faça login novamente.');
            // Aqui você poderia navegar para a tela de login
            navigation.goBack();
            return;
          }
        } catch (authError) {
          console.error('WorkoutSessionDetailsScreen - Erro ao verificar autenticação:', authError);
        }
        
        Alert.alert('Erro', 'Não foi possível encontrar os dados desta sessão.');
        navigation.goBack();
        return;
      }
      
      console.log('WorkoutSessionDetailsScreen - Dados recebidos com sucesso:', {
        id: data.id,
        workout_plan_name: data.workout_plans?.name,
        has_exercise_logs: !!data.exercise_logs?.length,
        exercise_logs_count: data.exercise_logs?.length || 0
      });
      
      setSessionData(data);
    } catch (error) {
      console.error('WorkoutSessionDetailsScreen - Erro não tratado:', error);
      
      // Tentar novamente em caso de exceção genérica, apenas uma vez
      if (retryCount === 0) {
        console.log('WorkoutSessionDetailsScreen - Tentando novamente após erro não tratado');
        setIsLoading(false);
        setTimeout(() => {
          fetchSessionDetails(retryCount + 1);
        }, 1000);
        return;
      }
      
      Alert.alert('Erro', 'Não foi possível carregar os detalhes desta sessão.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // Formatação de data e hora
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    
    return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
  };

  // Calcular duração
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'Em andamento';
    
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    
    if (!isValid(start) || !isValid(end)) return 'Duração inválida';
    
    const duration = intervalToDuration({ start, end });
    
    if (duration.hours > 0) {
      return `${duration.hours}h ${duration.minutes}m`;
    }
    return `${duration.minutes}m`;
  };

  // Calcular taxa de conclusão
  const calculateCompletionRate = (logs) => {
    if (!logs || logs.length === 0) return 0;
    
    const completed = logs.filter(log => log.completed).length;
    return Math.round((completed / logs.length) * 100);
  };

  // Renderização do conteúdo
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      );
    }

    if (!sessionData) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons 
            name="alert-circle-outline" 
            size={64} 
            color={COLORS.GRAY[700]} 
            style={{ marginBottom: SPACING.MD }}
          />
          <Text style={styles.emptyText}>Sessão não encontrada</Text>
          <Text style={styles.emptySubtext}>
            Não foi possível encontrar detalhes para esta sessão
          </Text>
        </View>
      );
    }

    const workoutName = sessionData.workout_plans?.name || 'Treino sem nome';
    const workoutDescription = sessionData.workout_plans?.description || '';
    const startTime = formatDateTime(sessionData.start_time);
    const endTime = sessionData.end_time ? formatDateTime(sessionData.end_time) : null;
    const duration = calculateDuration(sessionData.start_time, sessionData.end_time);
    const completionRate = calculateCompletionRate(sessionData.exercise_logs);
    
    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabeçalho com informações da sessão */}
        <View style={styles.sessionHeader}>
          <View style={styles.sessionHeaderContent}>
            <Text style={styles.sessionTitle}>{workoutName}</Text>
            {workoutDescription ? (
              <Text style={styles.sessionDescription}>{workoutDescription}</Text>
            ) : null}
            
            <View style={styles.sessionDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.TEXT.MUTED} />
                <Text style={styles.detailText}>{startTime}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.TEXT.MUTED} />
                <Text style={styles.detailText}>{duration}</Text>
              </View>
              
              {endTime ? (
                <View style={styles.detailItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.TEXT.MUTED} />
                  <Text style={styles.detailText}>Concluído</Text>
                </View>
              ) : (
                <View style={styles.detailItem}>
                  <Ionicons name="hourglass-outline" size={16} color={COLORS.TEXT.MUTED} />
                  <Text style={styles.detailText}>Em andamento</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Gráfico circular de conclusão */}
          <View style={styles.completionContainer}>
            <View style={styles.completionRing}>
              <Text style={styles.completionText}>{`${completionRate}%`}</Text>
            </View>
            <Text style={styles.completionLabel}>Concluído</Text>
          </View>
        </View>
        
        {/* Lista de exercícios */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Exercícios</Text>
          
          {sessionData.exercise_logs && sessionData.exercise_logs.length > 0 ? (
            sessionData.exercise_logs.map((log) => {
              const exercise = log.exercises;
              if (!exercise) return null;
              
              return (
                <View key={log.id} style={styles.exerciseItem}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      log.completed ? styles.completedBadge : styles.pendingBadge
                    ]}>
                      <Text style={styles.statusText}>
                        {log.completed ? 'Concluído' : 'Pendente'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.exerciseDetails}>
                    <View style={styles.exerciseDetailItem}>
                      <Text style={styles.exerciseDetailLabel}>Séries:</Text>
                      <Text style={styles.exerciseDetailValue}>
                        {log.completed_sets}/{exercise.sets}
                      </Text>
                    </View>
                    
                    <View style={styles.exerciseDetailItem}>
                      <Text style={styles.exerciseDetailLabel}>Repetições:</Text>
                      <Text style={styles.exerciseDetailValue}>{exercise.repetitions}</Text>
                    </View>
                    
                    <View style={styles.exerciseDetailItem}>
                      <Text style={styles.exerciseDetailLabel}>Descanso:</Text>
                      <Text style={styles.exerciseDetailValue}>{exercise.rest_time}s</Text>
                    </View>
                  </View>
                  
                  {exercise.notes ? (
                    <View style={styles.exerciseNotes}>
                      <Text style={styles.exerciseNotesLabel}>Observações:</Text>
                      <Text style={styles.exerciseNotesText}>{exercise.notes}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyExercisesContainer}>
              <Text style={styles.emptyExercisesText}>
                Nenhum exercício registrado nesta sessão
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header com botão de voltar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT.LIGHT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Sessão</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {renderContent()}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    paddingTop: SPACING.XL + 30, // Ajuste para status bar
    paddingBottom: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[800],
  },
  backButton: {
    padding: SPACING.XS,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
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
  },
  scrollContent: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XL * 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  sessionHeaderContent: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.XS,
  },
  sessionDescription: {
    fontSize: 14,
    color: COLORS.TEXT.MUTED,
    marginBottom: SPACING.SM,
  },
  sessionDetails: {
    marginTop: SPACING.SM,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.TEXT.MUTED,
    marginLeft: SPACING.XS,
  },
  completionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  completionRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.TEXT.LIGHT,
  },
  completionLabel: {
    fontSize: 12,
    color: COLORS.TEXT.MUTED,
    marginTop: SPACING.XS,
  },
  sectionContainer: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.MD,
  },
  exerciseItem: {
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS / 2,
    borderRadius: BORDER_RADIUS.SM,
    marginLeft: SPACING.SM,
  },
  completedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.SM,
  },
  exerciseDetailItem: {
    flexDirection: 'row',
    marginRight: SPACING.MD,
    marginBottom: SPACING.XS,
  },
  exerciseDetailLabel: {
    fontSize: 14,
    color: COLORS.TEXT.MUTED,
    marginRight: SPACING.XS,
  },
  exerciseDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT.DEFAULT,
  },
  exerciseNotes: {
    marginTop: SPACING.XS,
    paddingTop: SPACING.XS,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[800],
  },
  exerciseNotesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT.MUTED,
    marginBottom: SPACING.XS,
  },
  exerciseNotesText: {
    fontSize: 14,
    color: COLORS.TEXT.DEFAULT,
  },
  emptyExercisesContainer: {
    padding: SPACING.MD,
    alignItems: 'center',
  },
  emptyExercisesText: {
    fontSize: 14,
    color: COLORS.TEXT.MUTED,
    textAlign: 'center',
  },
});

export default WorkoutSessionDetailsScreen; 