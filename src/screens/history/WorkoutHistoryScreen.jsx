import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl, StatusBar 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isValid, isToday, isSameDay, 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval,
  addDays, subDays, isSameMonth, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Surface, Card, Chip, Divider, ProgressBar, 
  SegmentedButtons, IconButton, Button
} from 'react-native-paper';

import { COLORS, SPACING, BORDER_RADIUS } from '../../design';
import { getWorkoutHistory, deleteWorkoutSession, getWorkoutSessionDetails } from '../../services';

// Definição dos grupos musculares e mapeamento de exercícios
const MUSCLE_GROUPS = {
  CHEST: { name: 'Peito', color: '#F44336', exercises: ['supino', 'crucifixo', 'peck deck', 'crossover'] },
  BACK: { name: 'Costas', color: '#2196F3', exercises: ['remada', 'pull down', 'puxada', 'barra', 'pullover'] },
  LEGS: { name: 'Pernas', color: '#4CAF50', exercises: ['leg press', 'agachamento', 'extensora', 'flexora', 'panturrilha', 'stiff'] },
  SHOULDERS: { name: 'Ombros', color: '#9C27B0', exercises: ['desenvolvimento', 'elevação', 'lateral', 'frontal'] },
  ARMS: { name: 'Braços', color: '#FF9800', exercises: ['rosca', 'tríceps', 'bíceps', 'martelo', 'francês', 'testa'] },
  ABS: { name: 'Abdômen', color: '#607D8B', exercises: ['abdominal', 'infra', 'oblíquo', 'prancha'] },
  OTHER: { name: 'Outros', color: '#795548', exercises: [] }
};

const WorkoutHistoryScreen = ({ navigation }) => {
  // Estados principais
  const [historyData, setHistoryData] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [selectedExerciseDetails, setSelectedExerciseDetails] = useState(null);
  const [periodVolume, setPeriodVolume] = useState(0);
  const [muscleGroupsData, setMuscleGroupsData] = useState({});
  
  // Estados para navegação de datas
  const [currentDays, setCurrentDays] = useState([]);
  const [periodLabel, setPeriodLabel] = useState('');

  // Carregar histórico quando a tela for focada
  useFocusEffect(
    useCallback(() => {
      fetchHistoryData();
    }, [])
  );

  // Atualizar dias exibidos quando mudar a data selecionada ou modo de visualização
  useEffect(() => {
    updateDateRange();
  }, [selectedDate, viewMode]);

  // Atualizar o intervalo de datas com base no modo de visualização
  const updateDateRange = () => {
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
  };

  // Buscar dados do histórico
  const fetchHistoryData = async (start, end) => {
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
        setPeriodVolume(0);
        setMuscleGroupsData(
          Object.keys(MUSCLE_GROUPS).reduce((acc, key) => {
            acc[key] = { 
              volume: 0, 
              name: MUSCLE_GROUPS[key].name,
              color: MUSCLE_GROUPS[key].color,
              count: 0,
              percentage: 0
            };
            return acc;
          }, {})
        );
        return;
      }
      
      console.log(`Carregados ${data.length} registros de treino`);
      setHistoryData(data);
      
      // Filtrar para o dia selecionado
      filterByDate(selectedDate, data);
      
      // Calcular métricas
      calculateTotalVolume(data);
      analyzeVolumeByMuscleGroup(data);
      
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
  };

  // Filtrar histórico por data
  const filterByDate = (date, data = historyData) => {
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
  };

  // Calcular o volume total de treino para o período
  const calculateTotalVolume = (data) => {
    if (!data || data.length === 0) {
      console.log('Nenhum dado para calcular volume');
      setPeriodVolume(0);
      return;
    }
    
    console.log(`Calculando volume total para ${data.length} sessões`);
    let totalVolume = 0;
    let processedExercises = 0;
    let skippedExercises = 0;
    
    data.forEach(session => {
      if (!session.exercise_logs || session.exercise_logs.length === 0) {
        console.log(`Sessão ${session.id} sem logs de exercícios`);
        return;
      }
      
      session.exercise_logs.forEach(log => {
        // Verificar se temos os dados necessários
        if (!log.exercises) {
          skippedExercises++;
          return;
        }
        
        if (!log.completed) {
          // Não contar exercícios não concluídos
          return;
        }
        
        // Volume = séries completadas x repetições
        const sets = log.completed_sets || 0;
        const reps = log.exercises.repetitions || 0;
        const exerciseVolume = sets * reps;
        
        if (exerciseVolume > 0) {
          totalVolume += exerciseVolume;
          processedExercises++;
        }
      });
    });
    
    console.log(`Volume total calculado: ${totalVolume} (${processedExercises} exercícios processados, ${skippedExercises} ignorados)`);
    setPeriodVolume(totalVolume);
  };

  // Analisar volume por grupo muscular
  const analyzeVolumeByMuscleGroup = (data) => {
    if (!data || data.length === 0) {
      console.log('Nenhum dado para analisar volume por grupo muscular');
      
      // Inicializar todos os grupos com zero
      const emptyGroups = Object.keys(MUSCLE_GROUPS).reduce((acc, key) => {
        acc[key] = { 
          volume: 0, 
          name: MUSCLE_GROUPS[key].name,
          color: MUSCLE_GROUPS[key].color,
          count: 0,
          percentage: 0
        };
        return acc;
      }, {});
      
      setMuscleGroupsData(emptyGroups);
      return;
    }
    
    console.log(`Analisando volume por grupo muscular para ${data.length} sessões`);
    const muscleGroups = {};
    
    // Inicializar todos os grupos com zero
    Object.keys(MUSCLE_GROUPS).forEach(key => {
      muscleGroups[key] = { 
        volume: 0, 
        name: MUSCLE_GROUPS[key].name,
        color: MUSCLE_GROUPS[key].color,
        count: 0
      };
    });
    
    let totalProcessedExercises = 0;
    let totalSkippedExercises = 0;
    
    data.forEach(session => {
      if (!session.exercise_logs || session.exercise_logs.length === 0) {
        return;
      }
      
      session.exercise_logs.forEach(log => {
        if (!log.exercises || !log.completed) {
          totalSkippedExercises++;
          return;
        }
        
        const exerciseName = log.exercises.name.toLowerCase();
        const sets = log.completed_sets || 0;
        const reps = log.exercises.repetitions || 0;
        const exerciseVolume = sets * reps;
        
        if (exerciseVolume <= 0) {
          return;
        }
        
        totalProcessedExercises++;
        
        // Determinar grupo muscular
        let muscleGroup = 'OTHER';
        
        Object.keys(MUSCLE_GROUPS).forEach(key => {
          if (MUSCLE_GROUPS[key].exercises.some(term => 
            exerciseName.includes(term))) {
            muscleGroup = key;
          }
        });
        
        // Somar ao volume do grupo muscular
        muscleGroups[muscleGroup].volume += exerciseVolume;
        muscleGroups[muscleGroup].count += 1;
      });
    });
    
    // Calcular o total para determinar porcentagens
    let totalVolume = 0;
    Object.keys(muscleGroups).forEach(key => {
      totalVolume += muscleGroups[key].volume;
    });
    
    // Adicionar percentagens
    Object.keys(muscleGroups).forEach(key => {
      muscleGroups[key].percentage = totalVolume > 0 
        ? (muscleGroups[key].volume / totalVolume) * 100 
        : 0;
    });
    
    // Listar os top 3 grupos musculares
    const topGroups = Object.keys(muscleGroups)
      .filter(key => muscleGroups[key].volume > 0)
      .sort((a, b) => muscleGroups[b].volume - muscleGroups[a].volume)
      .slice(0, 3);
      
    if (topGroups.length > 0) {
      console.log('Top grupos musculares:');
      topGroups.forEach(key => {
        console.log(`- ${muscleGroups[key].name}: ${muscleGroups[key].volume} (${Math.round(muscleGroups[key].percentage)}%)`);
      });
    } else {
      console.log('Nenhum grupo muscular com volume');
    }
    
    console.log(`Análise concluída: ${totalProcessedExercises} exercícios processados, ${totalSkippedExercises} ignorados`);
    setMuscleGroupsData(muscleGroups);
  };

  // Navegar para o período anterior
  const handlePrevious = () => {
    if (viewMode === 'week') {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  };

  // Navegar para o próximo período
  const handleNext = () => {
    if (viewMode === 'week') {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  };

  // Selecionar um dia específico
  const handleSelectDay = (day) => {
    setSelectedDate(day);
    filterByDate(day);
  };

  // Ver detalhes de uma sessão de treino
  const handleViewSessionDetails = async (sessionId) => {
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
  };

  // Excluir uma sessão de treino
  const handleDeleteSession = (sessionId) => {
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
                
                // Recalcular métricas
                calculateTotalVolume(updatedHistory);
                analyzeVolumeByMuscleGroup(updatedHistory);
                
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
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    updateDateRange();
  };

  // Calcular o volume de treino para uma sessão específica
  const calculateSessionVolume = (session) => {
    if (!session) {
      console.warn('calculateSessionVolume - Sessão indefinida');
      return 0;
    }
    
    if (!session.exercise_logs || !Array.isArray(session.exercise_logs) || session.exercise_logs.length === 0) {
      console.log('calculateSessionVolume - Sem logs de exercícios para a sessão:', session.id);
      return 0;
    }
    
    let volume = 0;
    let processedExercises = 0;
    let skippedExercises = 0;
    
    session.exercise_logs.forEach(log => {
      if (!log || !log.exercises) {
        skippedExercises++;
      return;
    }
    
      if (!log.completed) {
        // Exercício não concluído
        return;
      }
      
      const sets = log.completed_sets || 0;
      const reps = log.exercises.repetitions || 0;
      
      if (sets > 0 && reps > 0) {
        const exerciseVolume = sets * reps;
        volume += exerciseVolume;
        processedExercises++;
      }
    });
    
    if (processedExercises === 0 && skippedExercises > 0) {
      console.warn(`calculateSessionVolume - Sessão ${session.id}: ${skippedExercises} exercícios ignorados por falta de dados`);
    }
    
    return volume;
  };

  // Contar quantas vezes um treino foi feito no período
  const getWorkoutFrequency = (workoutPlanId) => {
    let count = 0;
    
    historyData.forEach(session => {
      if (session.workout_plan_id === workoutPlanId) {
        count++;
      }
    });
    
    return count;
  };

  // Renderizar um item do seletor de dias no modo semanal
  const renderDaySelector = (day, index) => {
    const isSelected = isSameDay(day, selectedDate);
    const isTodays = isToday(day);
    
    // Verificar se tem treino neste dia
    const hasWorkout = historyData.some(session => {
      if (!session.start_time) return false;
      const sessionDate = parseISO(session.start_time);
      return isSameDay(sessionDate, day);
    });
    
    // Formato do dia
    let dayText;
    if (viewMode === 'week') {
      // Para semanal: "Seg, 22"
      dayText = format(day, 'EEE, dd', { locale: ptBR });
    } else {
      // Para mensal: "Semana 1"
      const weekNumber = Math.ceil(parseInt(format(day, 'd')) / 7);
      dayText = `Semana ${weekNumber}`;
    }
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.daySelector,
          isSelected && styles.selectedDaySelector,
          isTodays && styles.todaySelector,
          hasWorkout && styles.workoutDaySelector
        ]}
        onPress={() => handleSelectDay(day)}
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
  };

  // Renderizar um item da lista de treinos do dia
  const renderWorkoutItem = ({ item }) => {
    if (!item || !item.id) {
      console.error('renderWorkoutItem - Item inválido:', item);
      return null;
    }
    
    console.log('renderWorkoutItem - Renderizando item:', {
      id: item.id,
      workout_plan_id: item.workout_plan_id,
      workout_name: item.workout_plans?.name || 'Treino sem nome'
    });
    
    const workoutName = item.workout_plans?.name || 'Treino sem nome';
    const frequency = getWorkoutFrequency(item.workout_plan_id);
    const volume = calculateSessionVolume(item);
    const startTime = item.start_time ? format(parseISO(item.start_time), 'HH:mm') : '';
    
      return (
      <Card 
        style={styles.workoutCard} 
        onPress={() => {
          console.log('renderWorkoutItem - Card clicado, ID:', item.id);
          handleViewSessionDetails(item.id);
        }}
      >
        <Card.Content>
          <View style={styles.workoutHeader}>
            <View>
              <Text style={styles.workoutName}>{workoutName}</Text>
              <Text style={styles.workoutTime}>{startTime}</Text>
            </View>
            <Chip mode="outlined" style={styles.frequencyChip}>
              {frequency}x {viewMode === 'week' ? 'semana' : 'mês'}
            </Chip>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.volumeContainer}>
            <Text style={styles.volumeLabel}>Volume total:</Text>
            <Text style={styles.volumeValue}>{volume}</Text>
          </View>
          
          <View style={styles.workoutActions}>
            <Button 
              mode="text" 
              compact 
              onPress={() => {
                console.log('renderWorkoutItem - Botão Detalhes clicado, ID:', item.id);
                // Solução alternativa: tentar com carregamento direto em caso de falha
                handleViewSessionDetails(item.id).catch(() => {
                  console.log('renderWorkoutItem - Tentando navegação direta como fallback');
                  navigation.navigate('WorkoutSessionDetails', { 
                    sessionId: item.id
                  });
                });
              }}
            >
              Detalhes
            </Button>
            <Button 
              mode="text" 
              compact 
              textColor={COLORS.FEEDBACK.ERROR}
              onPress={() => handleDeleteSession(item.id)}
            >
              Excluir
            </Button>
        </View>
        </Card.Content>
      </Card>
      );
  };

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
        data={currentDays}
        renderItem={({ item, index }) => renderDaySelector(item, index)}
        keyExtractor={(_, index) => `day-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysList}
      />
      
      {/* Resumo de métricas */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text style={styles.metricsTitle}>
            Volume Total {viewMode === 'week' ? 'Semanal' : 'Mensal'}
          </Text>
          <Text style={styles.metricsValue}>{periodVolume}</Text>
          
          {/* Visualização de volume por grupo muscular */}
          <View style={styles.muscleGroupsContainer}>
            {Object.keys(muscleGroupsData)
              .filter(key => muscleGroupsData[key].volume > 0)
              .sort((a, b) => muscleGroupsData[b].volume - muscleGroupsData[a].volume)
              .slice(0, 3)  // Top 3 grupos musculares
              .map((key) => (
                <View key={key} style={styles.muscleGroupItem}>
                  <View style={styles.muscleGroupHeader}>
                    <View style={styles.muscleGroupNameRow}>
                      <View 
                        style={[styles.muscleGroupDot, { backgroundColor: muscleGroupsData[key].color }]} 
                      />
                      <Text style={styles.muscleGroupName}>{muscleGroupsData[key].name}</Text>
                    </View>
                    <Text style={styles.muscleGroupVolume}>{muscleGroupsData[key].volume}</Text>
                  </View>
                  <ProgressBar 
                    progress={muscleGroupsData[key].percentage / 100} 
                    color={muscleGroupsData[key].color}
                    style={styles.muscleGroupProgress}
                  />
                </View>
              ))
            }
          </View>
        </Card.Content>
      </Card>
      
      {/* Lista de treinos do dia */}
      {isLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : filteredHistory.length > 0 ? (
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
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
  metricsCard: {
    margin: SPACING.MD,
    backgroundColor: COLORS.BACKGROUND.LIGHT,
  },
  metricsTitle: {
    fontSize: 14,
    color: COLORS.GRAY[400],
  },
  metricsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.TEXT.LIGHT,
    marginVertical: SPACING.SM,
  },
  muscleGroupsContainer: {
    marginTop: SPACING.SM,
  },
  muscleGroupItem: {
    marginBottom: SPACING.SM,
  },
  muscleGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  muscleGroupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleGroupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.XS,
  },
  muscleGroupName: {
    fontSize: 14,
    color: COLORS.TEXT.LIGHT,
  },
  muscleGroupVolume: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
  },
  muscleGroupProgress: {
    height: 6,
    borderRadius: 3,
  },
  workoutsList: {
    padding: SPACING.MD,
    paddingTop: 0,
  },
  workoutCard: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    marginBottom: SPACING.MD,
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
  frequencyChip: {
    backgroundColor: 'transparent',
    borderColor: COLORS.PRIMARY,
  },
  divider: {
    marginVertical: SPACING.SM,
    backgroundColor: COLORS.GRAY[800],
  },
  volumeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  volumeLabel: {
    fontSize: 14,
    color: COLORS.GRAY[400],
  },
  volumeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.PRIMARY,
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