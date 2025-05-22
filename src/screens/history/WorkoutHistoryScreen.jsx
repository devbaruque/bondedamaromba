import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl, StatusBar 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { format, parseISO, isValid, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { COLORS, SPACING, TEXT_VARIANT, BORDER_RADIUS } from '../../design';
import { getWorkoutHistory, deleteWorkoutSession } from '../../services';

const WorkoutHistoryScreen = ({ navigation }) => {
  const [historyData, setHistoryData] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  const [showCalendar, setShowCalendar] = useState(true);
  const [statsData, setStatsData] = useState({
    totalWorkouts: 0,
    completedExercises: 0,
    totalDuration: 0
  });

  // Carregar histórico quando a tela for focada
  useFocusEffect(
    useCallback(() => {
      fetchHistoryData();
    }, [])
  );

  // Buscar dados do histórico
  const fetchHistoryData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await getWorkoutHistory();
      
      if (error) {
        console.error('Erro ao buscar histórico:', error);
        Alert.alert('Erro', 'Não foi possível carregar o histórico.');
        return;
      }
      
      setHistoryData(data || []);
      
      if (selectedDate) {
        filterByDate(selectedDate, data);
      } else {
        setFilteredHistory(data || []);
      }
      
      updateMarkedDates(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Atualizar datas marcadas no calendário
  const updateMarkedDates = (data) => {
    const dates = {};
    
    data.forEach(session => {
      if (!session.start_time) return;
      
      const date = parseISO(session.start_time);
      if (!isValid(date)) return;
      
      const dateStr = format(date, 'yyyy-MM-dd');
      
      if (selectedDate && isSameDay(date, parseISO(selectedDate))) {
        dates[dateStr] = {
          selected: true,
          selectedColor: COLORS.PRIMARY,
        };
      } else {
        dates[dateStr] = {
          marked: true,
          dotColor: COLORS.PRIMARY,
        };
      }
      
      // Adicionar uma marca especial para hoje
      if (isToday(date)) {
        dates[dateStr] = {
          ...dates[dateStr],
          marked: true,
          dotColor: COLORS.PRIMARY,
        };
      }
    });
    
    setMarkedDates(dates);
  };

  // Filtrar histórico por data
  const filterByDate = (dateString, data = historyData) => {
    if (!dateString) {
      setFilteredHistory(data);
      return;
    }
    
    const selectedDateObj = parseISO(dateString);
    
    const filtered = data.filter(session => {
      if (!session.start_time) return false;
      
      const sessionDate = parseISO(session.start_time);
      if (!isValid(sessionDate)) return false;
      
      return isSameDay(sessionDate, selectedDateObj);
    });
    
    setFilteredHistory(filtered);
  };

  // Selecionar data no calendário
  const handleDayPress = (day) => {
    const dateStr = day.dateString;
    
    if (selectedDate === dateStr) {
      // Se clicar na data já selecionada, remove o filtro
      setSelectedDate(null);
      setFilteredHistory(historyData);
      updateMarkedDates(historyData);
    } else {
      setSelectedDate(dateStr);
      filterByDate(dateStr);
      
      const newMarkedDates = {...markedDates};
      
      // Resetar seleção anterior
      Object.keys(newMarkedDates).forEach(key => {
        if (newMarkedDates[key].selected) {
          newMarkedDates[key] = {
            marked: true,
            dotColor: COLORS.PRIMARY,
          };
        }
      });
      
      // Marcar a nova data selecionada
      newMarkedDates[dateStr] = {
        selected: true,
        selectedColor: COLORS.PRIMARY,
      };
      
      setMarkedDates(newMarkedDates);
    }
  };

  // Alternar exibição do calendário
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  // Excluir uma sessão de treino
  const handleDeleteSession = (sessionId) => {
    Alert.alert(
      'Excluir sessão',
      'Tem certeza que deseja excluir esta sessão de treino?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              const { success, error } = await deleteWorkoutSession(sessionId);
              
              if (error) {
                console.error('Erro ao excluir sessão:', error);
                Alert.alert('Erro', 'Não foi possível excluir a sessão.');
                return;
              }
              
              if (success) {
                // Atualizar a lista removendo a sessão excluída
                const updatedData = historyData.filter(session => session.id !== sessionId);
                setHistoryData(updatedData);
                
                if (selectedDate) {
                  filterByDate(selectedDate, updatedData);
                } else {
                  setFilteredHistory(updatedData);
                }
                
                updateMarkedDates(updatedData);
                
                Alert.alert('Sucesso', 'Sessão excluída com sucesso.');
              }
            } catch (error) {
              console.error('Erro ao excluir sessão:', error);
              Alert.alert('Erro', 'Não foi possível excluir a sessão.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Ver detalhes de uma sessão
  const handleViewSessionDetails = (session) => {
    navigation.navigate('WorkoutSessionDetails', { sessionId: session.id });
  };

  // Formatar data e hora para exibição
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    
    return format(date, isToday(date) ? "'Hoje às' HH:mm" : "dd 'de' MMMM 'às' HH:mm", {
      locale: ptBR,
    });
  };

  // Formatar duração da sessão
  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'Em andamento';
    
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    
    if (!isValid(start) || !isValid(end)) return '';
    
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  };

  // Calcular estatísticas da sessão
  const calculateSessionStats = (session) => {
    if (!session.exercise_logs) return { total: 0, completed: 0 };
    
    const total = session.exercise_logs.length;
    const completed = session.exercise_logs.filter(log => log.completed).length;
    
    return { total, completed };
  };

  // Calcular estatísticas
  const calculateStats = (history) => {
    if (!history || history.length === 0) {
      setStatsData({
        totalWorkouts: 0,
        completedExercises: 0,
        totalDuration: 0
      });
      return;
    }
    
    let completedExercises = 0;
    let totalDuration = 0;
    
    history.forEach(session => {
      // Contar exercícios concluídos
      if (session.exercise_logs) {
        completedExercises += session.exercise_logs.filter(log => log.completed).length;
      }
      
      // Calcular duração total (apenas para sessões finalizadas)
      if (session.start_time && session.end_time) {
        const start = parseISO(session.start_time);
        const end = parseISO(session.end_time);
        
        if (isValid(start) && isValid(end)) {
          const durationMs = end.getTime() - start.getTime();
          totalDuration += durationMs;
        }
      }
    });
    
    setStatsData({
      totalWorkouts: history.length,
      completedExercises,
      totalDuration
    });
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchHistoryData();
  };

  // Renderizar um item da lista de histórico
  const renderHistoryItem = ({ item }) => {
    const workoutName = item.workout_plans?.name || 'Treino sem nome';
    const startTime = formatDateTime(item.start_time);
    const duration = formatDuration(item.start_time, item.end_time);
    const stats = calculateSessionStats(item);
    const isActive = !item.end_time;
    
    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => handleViewSessionDetails(item)}
      >
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>{workoutName}</Text>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSession(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.GRAY[500]} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.historyDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.GRAY[400]} />
            <Text style={styles.detailText}>{startTime}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.GRAY[400]} />
            <Text style={styles.detailText}>{duration}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="fitness-outline" size={16} color={COLORS.GRAY[400]} />
            <Text style={styles.detailText}>
              {stats.completed}/{stats.total} exercícios
            </Text>
          </View>
        </View>
        
        {isActive && (
          <View style={styles.activeSessionBadge}>
            <Text style={styles.activeSessionText}>Em andamento</Text>
          </View>
        )}
      </TouchableOpacity>
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

    if (!filteredHistory || filteredHistory.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons 
            name="calendar-outline" 
            size={64} 
            color={COLORS.GRAY[700]} 
            style={{ marginBottom: SPACING.MD }}
          />
          <Text style={styles.emptyText}>
            {selectedDate 
              ? 'Nenhum treino nesta data'
              : 'Nenhum treino registrado'
            }
          </Text>
          <Text style={styles.emptySubtext}>
            {selectedDate 
              ? 'Tente selecionar outra data ou volte para a tela de treinos'
              : 'Complete treinos para ver seu histórico'
            }
          </Text>
          
          {selectedDate && (
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={() => {
                setSelectedDate(null);
                setFilteredHistory(historyData);
                updateMarkedDates(historyData);
              }}
            >
              <Text style={styles.clearFilterText}>Limpar filtro</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.historyList}
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
      <StatusBar barStyle="light-content" />
      
      {/* Calendário */}
      <View style={styles.calendarContainer}>
        <TouchableOpacity 
          style={styles.calendarToggle}
          onPress={toggleCalendar}
        >
          <Text style={styles.calendarToggleText}>
            {showCalendar ? 'Esconder calendário' : 'Mostrar calendário'}
          </Text>
          <Ionicons 
            name={showCalendar ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={COLORS.PRIMARY}
          />
        </TouchableOpacity>
        
        {showCalendar && (
          <Calendar 
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              calendarBackground: COLORS.BACKGROUND.LIGHT,
              textSectionTitleColor: COLORS.TEXT.DEFAULT,
              selectedDayBackgroundColor: COLORS.PRIMARY,
              selectedDayTextColor: COLORS.TEXT.LIGHT,
              todayTextColor: COLORS.PRIMARY,
              dayTextColor: COLORS.TEXT.DEFAULT,
              textDisabledColor: COLORS.GRAY[700],
              dotColor: COLORS.PRIMARY,
              selectedDotColor: COLORS.TEXT.LIGHT,
              arrowColor: COLORS.PRIMARY,
              monthTextColor: COLORS.TEXT.LIGHT,
              indicatorColor: COLORS.PRIMARY,
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
            }}
          />
        )}
      </View>
      
      {/* Lista de histórico */}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.DARK,
  },
  calendarContainer: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[800],
    overflow: 'hidden',
  },
  calendarToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SM,
  },
  calendarToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.PRIMARY,
    marginRight: SPACING.XS,
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
  clearFilterButton: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: BORDER_RADIUS.SM,
    marginTop: SPACING.SM,
  },
  clearFilterText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  historyList: {
    padding: SPACING.MD,
    paddingBottom: SPACING.XL * 2,
  },
  historyItem: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    position: 'relative',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    flex: 1,
  },
  deleteButton: {
    padding: SPACING.XS,
  },
  historyDetails: {
    marginTop: SPACING.XS,
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
  activeSessionBadge: {
    position: 'absolute',
    top: SPACING.MD,
    right: SPACING.MD,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingVertical: SPACING.XS / 2,
    paddingHorizontal: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
  },
  activeSessionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.FEEDBACK.SUCCESS,
  },
});

export default WorkoutHistoryScreen; 