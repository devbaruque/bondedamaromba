import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl, StatusBar,
  InteractionManager 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isValid, isToday, isSameDay, 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
  addDays, subDays, isSameMonth, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Card, 
  SegmentedButtons, IconButton, Button
} from 'react-native-paper';

import { COLORS, SPACING, BORDER_RADIUS } from '../../design';
import { getWorkoutHistory, deleteWorkoutSession, getWorkoutSessionDetails } from '../../services';

// Constante para a altura estimada de cada item
const WORKOUT_ITEM_HEIGHT = 120;
const DAY_SELECTOR_HEIGHT = 60;

// Componente para item de treino memoizado
const WorkoutItem = React.memo(({ item, onPress, onDelete }) => {
  // Dados básicos do treino
  const workoutName = item.workout_plans?.name || 'Treino sem nome';
  const startTime = item.start_time ? format(parseISO(item.start_time), 'HH:mm') : '';
  
  // Calcular a duração do treino
  let duration = 'Duração não disponível';
  if (item.start_time && item.end_time) {
    const start = parseISO(item.start_time);
    const end = parseISO(item.end_time);
    const durationMinutes = Math.round((end - start) / (1000 * 60));
    duration = `${durationMinutes} minutos`;
  }
  
  return (
    <Card 
      style={styles.workoutCard} 
      onPress={onPress}
    >
      <Card.Content>
        <View style={styles.workoutHeader}>
          <View>
            <Text style={styles.workoutName}>{workoutName}</Text>
            <Text style={styles.workoutTime}>{startTime}</Text>
          </View>
          <Text style={styles.durationText}>{duration}</Text>
        </View>
        
        <View style={styles.workoutActions}>
          <Button 
            mode="text" 
            compact 
            onPress={onPress}
          >
            Detalhes
          </Button>
          <Button 
            mode="text" 
            compact 
            textColor={COLORS.FEEDBACK.ERROR}
            onPress={() => onDelete(item.id)}
          >
            Excluir
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
});

// Componente para o seletor de dias memoizado
const DaySelector = React.memo(({ day, isSelected, isTodays, hasWorkout, onSelect }) => {
  // Formato do dia (ex: "Seg, 22")
  const dayText = format(day, 'EEE, dd', { locale: ptBR });
  
  return (
    <TouchableOpacity
      style={[
        styles.daySelector,
        isSelected && styles.selectedDaySelector,
        isTodays && styles.todaySelector,
        hasWorkout && styles.workoutDaySelector
      ]}
      onPress={() => onSelect(day)}
    >
      <Text style={[
        styles.daySelectorText,
        isSelected && styles.selectedDayText
      ]}>
        {dayText}
      </Text>
      
      {hasWorkout && (
        <View style={[
          styles.workoutIndicator,
          isSelected && styles.selectedWorkoutIndicator
        ]} />
      )}
    </TouchableOpacity>
  );
});

const WorkoutHistoryScreen = ({ navigation }) => {
  // Estados principais
  const [historyData, setHistoryData] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [selectedExerciseDetails, setSelectedExerciseDetails] = useState(null);
  
  // Estados para navegação de datas
  const [currentDays, setCurrentDays] = useState([]);
  const [periodLabel, setPeriodLabel] = useState('');

  // Referências para FlatLists
  const daysListRef = useRef(null);
  const workoutsListRef = useRef(null);

  // Carregar histórico quando a tela for focada
  useFocusEffect(
    useCallback(() => {
      InteractionManager.runAfterInteractions(() => {
        updateDateRange();
      });
    }, [])
  );

  // Atualizar dias exibidos quando mudar a data selecionada ou modo de visualização
  useEffect(() => {
    updateDateRange();
  }, [selectedDate, viewMode]);

  // Atualizar o intervalo de datas com base no modo de visualização
  const updateDateRange = useCallback(() => {
    let start, end, days;
    
    if (viewMode === 'week') {
      start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      days = eachDayOfInterval({ start, end });
      
      // Formato: "22-28 Mai"
      const startFormatted = format(start, 'dd', { locale: ptBR });
      const endFormatted = format(end, 'dd MMM', { locale: ptBR });
      setPeriodLabel(`${startFormatted}-${endFormatted}`);
    } else {
      start = startOfMonth(selectedDate);
      end = endOfMonth(selectedDate);
      days = [];
      
      // Para visualização mensal, mostrar só as semanas
      let currentWeekStart = start;
      while (currentWeekStart <= end) {
        days.push(currentWeekStart);
        currentWeekStart = addDays(currentWeekStart, 7);
      }
      
      // Formato: "Maio 2023"
      setPeriodLabel(format(selectedDate, 'MMMM yyyy', { locale: ptBR }));
    }
    
    setCurrentDays(days);
    fetchHistoryData(start, end);
  }, [selectedDate, viewMode]);

  // Buscar dados do histórico
  const fetchHistoryData = useCallback(async (start, end) => {
    try {
      setIsLoading(true);
      
      // Definir intervalo de datas baseado na visualização, se não fornecido
      if (!start || !end) {
        if (viewMode === 'week') {
          start = startOfWeek(selectedDate, { weekStartsOn: 1 });
          end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        } else {
          start = startOfMonth(selectedDate);
          end = endOfMonth(selectedDate);
        }
      }
      
      console.log('Buscando histórico de treinos no período:', 
        format(start, 'dd/MM/yyyy') + ' a ' + format(end, 'dd/MM/yyyy'));
      
      const { data, error } = await getWorkoutHistory(start, end);
      
      if (error) {
        console.error('Erro ao buscar histórico:', error);
        Alert.alert(
          'Erro ao carregar histórico', 
          'Não foi possível carregar o histórico de treinos. Tente novamente.'
        );
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('Nenhum treino encontrado no período selecionado');
        setHistoryData([]);
        setFilteredHistory([]);
        return;
      }
      
      console.log(`Carregados ${data.length} registros de treino`);
      setHistoryData(data);
      
      // Filtrar para o dia selecionado
      filterByDate(selectedDate, data);
      
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      Alert.alert(
        'Erro inesperado', 
        'Ocorreu um erro ao carregar o histórico. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, viewMode]);

  // Filtrar histórico por data
  const filterByDate = useCallback((date, data = historyData) => {
    if (!data || data.length === 0) {
      setFilteredHistory([]);
      return;
    }
    
    console.log(`Filtrando treinos para o dia ${format(date, 'dd/MM/yyyy')}`);
    
    const filtered = data.filter(session => {
      if (!session.start_time) {
        console.warn('Sessão sem data de início:', session.id);
        return false;
      }
      
      const sessionDate = parseISO(session.start_time);
      if (!isValid(sessionDate)) {
        console.warn('Sessão com data inválida:', session.id, session.start_time);
        return false;
      }
      
      return isSameDay(sessionDate, date);
    });
    
    console.log(`Encontrados ${filtered.length} treinos para o dia selecionado`);
    setFilteredHistory(filtered);
  }, [historyData]);

  // Navegar para o período anterior
  const handlePrevious = useCallback(() => {
    if (viewMode === 'week') {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  }, [selectedDate, viewMode]);

  // Navegar para o próximo período
  const handleNext = useCallback(() => {
    if (viewMode === 'week') {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  }, [selectedDate, viewMode]);

  // Selecionar um dia específico
  const handleSelectDay = useCallback((day) => {
    setSelectedDate(day);
    filterByDate(day);
  }, [filterByDate]);

  // Ver detalhes de uma sessão de treino
  const handleViewSessionDetails = useCallback(async (sessionId) => {
    if (!sessionId) {
      console.error('handleViewSessionDetails - ID da sessão não fornecido');
      Alert.alert('Erro', 'Não foi possível abrir os detalhes da sessão.');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('handleViewSessionDetails - Verificando detalhes da sessão antes de navegar:', sessionId);
      
      // Verificar se conseguimos obter os detalhes da sessão antes de navegar
      const { data, error } = await getWorkoutSessionDetails(sessionId);
      
      setIsLoading(false);
      
      if (error) {
        console.error('handleViewSessionDetails - Erro ao verificar detalhes:', error);
        Alert.alert(
          'Erro', 
          'Não foi possível carregar os detalhes desta sessão. Por favor, tente novamente.'
        );
        return;
      }
      
      if (!data) {
        console.error('handleViewSessionDetails - Sessão não encontrada:', sessionId);
        Alert.alert(
          'Sessão não encontrada', 
          'Não foi possível encontrar os detalhes desta sessão. Ela pode ter sido excluída.'
        );
        return;
      }
      
      // Se chegou até aqui, temos os dados da sessão
      console.log('handleViewSessionDetails - Sessão verificada com sucesso, navegando para detalhes:', {
        id: data.id,
        workout_name: data.workout_plans?.name,
        exercise_count: data.exercise_logs?.length || 0
      });
      
      // Navegando para a tela de detalhes com os dados da sessão
      navigation.navigate('WorkoutSessionDetails', { 
        sessionId: sessionId,
        sessionData: data // Passando os dados já carregados para evitar nova consulta
      });
      
    } catch (err) {
      setIsLoading(false);
      console.error('handleViewSessionDetails - Erro não tratado:', err);
      Alert.alert(
        'Erro inesperado', 
        'Ocorreu um erro ao tentar visualizar os detalhes desta sessão.'
      );
    }
  }, [navigation]);

  // Excluir uma sessão de treino
  const handleDeleteSession = useCallback((sessionId) => {
    if (!sessionId) {
      console.error('Tentativa de excluir sessão sem ID');
      return;
    }
    
    console.log('Solicitando confirmação para excluir sessão:', sessionId);
    
    Alert.alert(
      'Excluir sessão',
      'Tem certeza que deseja excluir esta sessão de treino? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              console.log('Iniciando exclusão da sessão:', sessionId);
              
              const { success, error } = await deleteWorkoutSession(sessionId);
              
              if (error) {
                console.error('Erro ao excluir sessão:', error);
                Alert.alert(
                  'Erro', 
                  'Não foi possível excluir a sessão. Por favor, tente novamente.'
                );
                return;
              }
              
              if (success) {
                console.log('Sessão excluída com sucesso:', sessionId);
                
                // Remover a sessão excluída da lista atual
                const updatedHistory = historyData.filter(session => session.id !== sessionId);
                setHistoryData(updatedHistory);
                
                // Atualizar a lista filtrada
                const updatedFiltered = filteredHistory.filter(session => session.id !== sessionId);
                setFilteredHistory(updatedFiltered);
                
                // Mostrar feedback de sucesso
                Alert.alert('Sucesso', 'Sessão excluída com sucesso.');
              } else {
                console.warn('Falha ao excluir sessão:', sessionId);
                Alert.alert(
                  'Atenção', 
                  'A operação foi concluída, mas houve um problema. Por favor, verifique se a sessão foi removida.'
                );
                
                // Atualizar dados de qualquer forma para refletir o estado atual
                updateDateRange();
              }
            } catch (error) {
              console.error('Erro não tratado ao excluir sessão:', error);
              Alert.alert(
                'Erro inesperado', 
                'Ocorreu um erro ao excluir a sessão. Por favor, tente novamente mais tarde.'
              );
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  }, [historyData, filteredHistory, updateDateRange]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    updateDateRange();
  }, [updateDateRange]);

  // Configuração para otimizar a FlatList de dias
  const getDaySelectorLayout = useCallback((data, index) => ({
    length: DAY_SELECTOR_HEIGHT,
    offset: DAY_SELECTOR_HEIGHT * index,
    index
  }), []);

  // Configuração para otimizar a FlatList de treinos
  const getWorkoutItemLayout = useCallback((data, index) => ({
    length: WORKOUT_ITEM_HEIGHT,
    offset: WORKOUT_ITEM_HEIGHT * index,
    index
  }), []);

  // Memoizar o check de treinos nos dias para evitar cálculos repetidos
  const daysWithWorkouts = useMemo(() => {
    const result = new Set();
    historyData.forEach(session => {
      if (session.start_time) {
        const sessionDate = parseISO(session.start_time);
        if (isValid(sessionDate)) {
          result.add(format(sessionDate, 'yyyy-MM-dd'));
        }
      }
    });
    return result;
  }, [historyData]);

  // Renderizar um item do seletor de dias no modo semanal
  const renderDaySelector = useCallback(({ item }) => {
    const isSelected = isSameDay(item, selectedDate);
    const isTodays = isToday(item);
    
    // Verificar se tem treino neste dia usando o Set memoizado
    const formattedDay = format(item, 'yyyy-MM-dd');
    const hasWorkout = daysWithWorkouts.has(formattedDay);
    
    return (
      <DaySelector
        day={item}
        isSelected={isSelected}
        isTodays={isTodays}
        hasWorkout={hasWorkout}
        onSelect={handleSelectDay}
      />
    );
  }, [selectedDate, daysWithWorkouts, handleSelectDay]);

  // Renderizar um item da lista de treinos do dia
  const renderWorkoutItem = useCallback(({ item }) => {
    return (
      <WorkoutItem
        item={item}
        onPress={() => handleViewSessionDetails(item.id)}
        onDelete={handleDeleteSession}
      />
    );
  }, [handleViewSessionDetails, handleDeleteSession]);

  // Key extractors memoizados
  const dayKeyExtractor = useCallback((_, index) => `day-${index}`, []);
  const workoutKeyExtractor = useCallback(item => item.id, []);

  // Função memoizada para lidar com o onScroll da FlatList
  const handleScroll = useMemo(() => {
    let lastScrollTime = 0;
    return ({ nativeEvent }) => {
      const now = Date.now();
      if (now - lastScrollTime < 16) { // Limitar a ~60fps
        return;
      }
      lastScrollTime = now;
    };
  }, []);

  // Função para encontrar o índice do dia atual na lista de dias
  const findTodayIndex = useMemo(() => {
    if (currentDays.length === 0) return 0;
    return currentDays.findIndex(day => isToday(day)) || 0;
  }, [currentDays]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Histórico de Treinos</Text>
        
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mês' }
          ]}
          style={styles.viewToggle}
        />
      </View>
      
      {/* Navegador de período */}
      <View style={styles.periodNavigator}>
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={handlePrevious}
        />
        <Text style={styles.periodLabel}>{periodLabel}</Text>
        <IconButton
          icon="chevron-right"
          size={24}
          onPress={handleNext}
        />
      </View>
      
      {/* Seletor de dias */}
      <FlatList
        ref={daysListRef}
        data={currentDays}
        renderItem={renderDaySelector}
        keyExtractor={dayKeyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysList}
        getItemLayout={getDaySelectorLayout}
        initialScrollIndex={findTodayIndex}
        initialNumToRender={7}
        maxToRenderPerBatch={7}
        windowSize={7}
        removeClippedSubviews={true}
        onScrollToIndexFailed={() => {
          // Fallback para quando não conseguir rolar para o índice
          setTimeout(() => {
            if (daysListRef.current && currentDays.length > 0) {
              daysListRef.current.scrollToOffset({ 
                offset: 0, 
                animated: true 
              });
            }
          }, 100);
        }}
      />
      
      {/* Lista de treinos do dia */}
      {isLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : filteredHistory.length > 0 ? (
        <FlatList
          ref={workoutsListRef}
          data={filteredHistory}
          keyExtractor={workoutKeyExtractor}
          renderItem={renderWorkoutItem}
          contentContainerStyle={styles.workoutsList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[COLORS.PRIMARY]} 
              tintColor={COLORS.PRIMARY}
            />
          }
          getItemLayout={getWorkoutItemLayout}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews={true}
          onScroll={handleScroll}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="barbell-outline" 
            size={64} 
            color={COLORS.GRAY[600]} 
          />
          <Text style={styles.emptyText}>
            Nenhum treino registrado para {format(selectedDate, 'dd/MM/yyyy')}
          </Text>
          <Text style={styles.emptySubtext}>
            Registre um novo treino na aba "Treinos"
          </Text>
        </View>
      )}
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.MD,
  },
  viewToggle: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
  },
  periodNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[800],
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    textTransform: 'capitalize',
  },
  daysList: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[800],
  },
  daySelector: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    marginRight: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    height: DAY_SELECTOR_HEIGHT,
  },
  selectedDaySelector: {
    backgroundColor: COLORS.PRIMARY,
  },
  todaySelector: {
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  workoutDaySelector: {
    // Estilo para dias com treino
  },
  daySelectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    textTransform: 'capitalize',
  },
  selectedDayText: {
    color: COLORS.TEXT.LIGHT,
  },
  workoutIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.PRIMARY,
    marginTop: SPACING.XS,
  },
  selectedWorkoutIndicator: {
    backgroundColor: COLORS.TEXT.LIGHT,
  },
  workoutsList: {
    padding: SPACING.MD,
    paddingTop: 0,
  },
  workoutCard: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    marginBottom: SPACING.MD,
    height: WORKOUT_ITEM_HEIGHT,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
  },
  workoutTime: {
    fontSize: 12,
    color: COLORS.GRAY[400],
    marginTop: 2,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginTop: 2,
  },
  workoutActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.SM,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.GRAY[400],
    textAlign: 'center',
  },
});

export default WorkoutHistoryScreen; 