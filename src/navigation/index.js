import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';

// Importação das telas
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import WorkoutSelectionScreen from '../screens/workouts/WorkoutSelectionScreen';
import ExerciseListScreen from '../screens/workouts/ExerciseListScreen';
import AddExerciseScreen from '../screens/workouts/AddExerciseScreen';
import EditExerciseScreen from '../screens/workouts/EditExerciseScreen';
import ExerciseDetailScreen from '../screens/workouts/ExerciseDetailScreen';
import WorkoutHistoryScreen from '../screens/history/WorkoutHistoryScreen';
import WorkoutSessionDetailsScreen from '../screens/history/WorkoutSessionDetailsScreen';
import LoadingScreen from '../screens/LoadingScreen';

// Cores do tema
import { COLORS } from '../design';

// Criando os navegadores
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navegador para rotas de autenticação
const AuthNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.BACKGROUND.DARK } 
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Navegador para treinos
const WorkoutsNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="WorkoutSelection"
      screenOptions={{ 
        headerStyle: {
          backgroundColor: COLORS.BACKGROUND.DEFAULT,
        },
        headerTintColor: COLORS.TEXT.LIGHT,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: { backgroundColor: COLORS.BACKGROUND.DARK }
      }}
    >
      <Stack.Screen 
        name="WorkoutSelection" 
        component={WorkoutSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ExerciseList" 
        component={ExerciseListScreen}
        options={{ title: "Exercícios" }}
      />
      <Stack.Screen 
        name="AddExercise" 
        component={AddExerciseScreen}
        options={{ title: "Novo Exercício" }}
      />
      <Stack.Screen 
        name="EditExercise" 
        component={EditExerciseScreen}
        options={{ title: "Editar Exercício" }}
      />
      <Stack.Screen 
        name="ExerciseDetail" 
        component={ExerciseDetailScreen}
        options={{ title: "Detalhes do Exercício" }}
      />
    </Stack.Navigator>
  );
};

// Navegador para histórico
const HistoryNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="WorkoutHistory"
      screenOptions={{ 
        headerStyle: {
          backgroundColor: COLORS.BACKGROUND.DEFAULT,
        },
        headerTintColor: COLORS.TEXT.LIGHT,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: { backgroundColor: COLORS.BACKGROUND.DARK }
      }}
    >
      <Stack.Screen 
        name="WorkoutHistory" 
        component={WorkoutHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="WorkoutSessionDetails" 
        component={WorkoutSessionDetailsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Navegador principal com abas
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.BACKGROUND.DEFAULT,
          borderTopColor: COLORS.GRAY[800],
          paddingTop: 5,
          paddingBottom: 10,
          height: 60,
        },
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.GRAY[500],
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Treinos') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Histórico') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        }
      })}
    >
      <Tab.Screen name="Treinos" component={WorkoutsNavigator} />
      <Tab.Screen name="Histórico" component={HistoryNavigator} />
    </Tab.Navigator>
  );
};

// Navegador raiz que determina qual navegador mostrar baseado no estado de autenticação
export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator; 