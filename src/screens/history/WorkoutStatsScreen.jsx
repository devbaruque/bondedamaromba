import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, startOfMonth, endOfMonth, differenceInDays, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { COLORS, SPACING, TEXT_VARIANT, BORDER_RADIUS } from '../../design';
import { getWorkoutHistory } from '../../services';

const WorkoutStatsScreen = ({ navigation }) => {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedExercises: 0,
    mostFrequentWorkout: null,
    averageSessionDuration: 0,
    sessionsPerWeek: 0,
    streakDays: 0
  });

  // Carregar histórico quando a tela for focada
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchHistoryData();
    });

    return unsubscribe;
  }, [navigation, currentMonth]);

  // Buscar dados do histórico
  const fetchHistoryData = async () => {
    try {
      setIsLoading(true);
      
      const startDate = startOfMonth(currentMonth);
      const endDate = endOfMonth(currentMonth);
      
      const { data, error } = await getWorkoutHistory(startDate, endDate);
      
      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return;
      }
      
      setHistoryData(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navegar para o mês anterior
  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  // Navegar para o próximo mês
  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Calcular estatísticas com base no histórico
  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      setStats({
        totalSessions: 0,
        completedExercises: 0,
        mostFrequentWorkout: null,
        averageSessionDuration: 0,
        sessionsPerWeek: 0,
        streakDays: 0
      });
      return;
    }

    // Total de sessões
    const totalSessions = data.length;
    
    // Exercícios completos
    let completedExercises = 0;
    data.forEach(session => {
      if (session.exercise_logs) {
        completedExercises += session.exercise_logs.filter(log => log.completed).length;
      }
    });
    
    // Treino mais frequente
    const workoutCounts = {};
    data.forEach(session => {
      const workoutId = session.workout_plan_id;
      workoutCounts[workoutId] = (workoutCounts[workoutId] || 0) + 1;
    });
    
    let mostFrequentWorkoutId = null;
    let maxCount = 0;
    
    Object.entries(workoutCounts).forEach(([id, count]) => {
      if (count > maxCount) {
        mostFrequentWorkoutId = id;
        maxCount = count;
      }
    });
    
    const mostFrequentWorkout = data.find(session => 
      session.workout_plan_id === mostFrequentWorkoutId && session.workout_plans
    )?.workout_plans;
    
    // Duração média das sessões
    let totalDuration = 0;
    let sessionsWithDuration = 0;
    
    data.forEach(session => {
      if (session.start_time && session.end_time) {
        const start = parseISO(session.start_time);
        const end = parseISO(session.end_time);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
        
        const durationMs = end.getTime() - start.getTime();
        totalDuration += durationMs;
        sessionsWithDuration++;
      }
    });
    
    const averageSessionDuration = sessionsWithDuration > 0 
      ? Math.round(totalDuration / sessionsWithDuration / (1000 * 60)) // Convertendo para minutos
      : 0;
    
    // Sessões por semana
    const daysInMonth = differenceInDays(
      endOfMonth(currentMonth),
      startOfMonth(currentMonth)
    ) + 1;
    
    const weeksInMonth = daysInMonth / 7;
    const sessionsPerWeek = weeksInMonth > 0 ? (totalSessions / weeksInMonth).toFixed(1) : 0;
    
    // Calcular sequência (streak)
    // Aqui estamos simplificando e apenas considerando dias consecutivos no mês atual
    const sessionDates = data
      .map(session => {
        if (!session.start_time) return null;
        const date = parseISO(session.start_time);
        return isNaN(date.getTime()) ? null : format(date, 'yyyy-MM-dd');
      })
      .filter(Boolean)
      .sort();
    
    let streak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < sessionDates.length; i++) {
      const prevDate = parseISO(sessionDates[i-1]);
      const currDate = parseISO(sessionDates[i]);
      
      if (differenceInDays(currDate, prevDate) === 1) {
        currentStreak++;
      } else if (differenceInDays(currDate, prevDate) !== 0) {
        // Se não for o mesmo dia nem o dia seguinte, reinicia a contagem
        currentStreak = 1;
      }
      
      if (currentStreak > streak) {
        streak = currentStreak;
      }
    }
    
    setStats({
      totalSessions,
      completedExercises,
      mostFrequentWorkout,
      averageSessionDuration,
      sessionsPerWeek,
      streakDays: streak
    });
  };

  // Renderizar conteúdo principal
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      );
    }

    if (!historyData || historyData.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons 
            name="fitness-outline" 
            size={64} 
            color={COLORS.GRAY[700]} 
            style={{ marginBottom: SPACING.MD }}
          />
          <Text style={styles.emptyText}>Nenhum treino registrado</Text>
          <Text style={styles.emptySubtext}>
            Complete treinos para ver suas estatísticas
          </Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cartão de resumo */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo do Mês</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Treinos</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completedExercises}</Text>
              <Text style={styles.statLabel}>Exercícios</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.streakDays}</Text>
              <Text style={styles.statLabel}>Sequência</Text>
            </View>
          </View>
        </View>
        
        {/* Cartão de detalhes */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Detalhes</Text>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time-outline" size={24} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Duração média</Text>
              <Text style={styles.detailValue}>
                {stats.averageSessionDuration} minutos por treino
              </Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Frequência</Text>
              <Text style={styles.detailValue}>
                {stats.sessionsPerWeek} treinos por semana
              </Text>
            </View>
          </View>
          
          {stats.mostFrequentWorkout && (
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="star-outline" size={24} color={COLORS.PRIMARY} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Treino favorito</Text>
                <Text style={styles.detailValue}>
                  {stats.mostFrequentWorkout.name}
                </Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Dicas */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Dicas para melhorar</Text>
          
          {stats.totalSessions === 0 && (
            <View style={styles.tipItem}>
              <Ionicons name="bulb-outline" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.tipText}>
                Comece realizando pelo menos 3 treinos por semana para ver resultados.
              </Text>
            </View>
          )}
          
          {stats.sessionsPerWeek < 3 && stats.totalSessions > 0 && (
            <View style={styles.tipItem}>
              <Ionicons name="bulb-outline" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.tipText}>
                Tente aumentar a frequência para 3-4 treinos por semana.
              </Text>
            </View>
          )}
          
          {stats.streakDays < 3 && stats.totalSessions > 0 && (
            <View style={styles.tipItem}>
              <Ionicons name="bulb-outline" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.tipText}>
                Busque consistência! Treinos em dias consecutivos geram melhores resultados.
              </Text>
            </View>
          )}
          
          {stats.averageSessionDuration < 30 && stats.totalSessions > 0 && (
            <View style={styles.tipItem}>
              <Ionicons name="bulb-outline" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.tipText}>
                Tente aumentar a duração dos seus treinos para pelo menos 30 minutos.
              </Text>
            </View>
          )}
          
          {stats.totalSessions > 0 && stats.sessionsPerWeek >= 3 && stats.streakDays >= 3 && stats.averageSessionDuration >= 30 && (
            <View style={styles.tipItem}>
              <Ionicons name="thumbs-up-outline" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.tipText}>
                Parabéns! Você está mantendo uma boa rotina de treinos!
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
      
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Estatísticas</Text>
        
        {/* Seletor de mês */}
        <View style={styles.monthSelector}>
          <TouchableOpacity 
            onPress={handlePreviousMonth}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.TEXT.LIGHT} />
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </Text>
          
          <TouchableOpacity 
            onPress={handleNextMonth}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-forward" size={24} color={COLORS.TEXT.LIGHT} />
          </TouchableOpacity>
        </View>
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
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    paddingTop: SPACING.XL + 30, // Ajuste para status bar
    paddingBottom: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[800],
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.SM,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButton: {
    padding: SPACING.XS,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    textTransform: 'capitalize',
    marginHorizontal: SPACING.MD,
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
  scrollContent: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XL * 2,
  },
  summaryCard: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.MD,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.TEXT.MUTED,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.GRAY[700],
  },
  detailsCard: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.MD,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[800],
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.TEXT.MUTED,
    marginBottom: SPACING.XS / 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT.LIGHT,
  },
  tipsCard: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.MD,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.SM,
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderRadius: BORDER_RADIUS.MD,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT.DEFAULT,
    marginLeft: SPACING.SM,
  },
});

export default WorkoutStatsScreen; 