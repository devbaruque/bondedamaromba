import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';

// Importação das telas
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import WorkoutSelectionScreen from '../screens/workouts/WorkoutSelectionScreen';
import ExerciseListScreen from '../screens/workouts/ExerciseListScreen';
import AddExerciseScreen from '../screens/workouts/AddExerciseScreen';
import EditExerciseScreen from '../screens/workouts/EditExerciseScreen';
import ExerciseDetailScreen from '../screens/workouts/ExerciseDetailScreen';
import LoadingScreen from '../screens/LoadingScreen';

// Cores do tema
import { COLORS } from '../design';

// Criando os navegadores
const Stack = createNativeStackNavigator();

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

// Navegador para rotas autenticadas
const AppNavigator = () => {
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

// Navegador raiz que determina qual navegador mostrar baseado no estado de autenticação
export const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator; 