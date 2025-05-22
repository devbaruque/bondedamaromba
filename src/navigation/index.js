import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, Modal, Text, StyleSheet } from 'react-native';

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
import { COLORS, SPACING, BORDER_RADIUS } from '../design';

// Criando os navegadores
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Componente para o modal de confirmação de logout
const LogoutConfirmationModal = ({ visible, onConfirm, onCancel }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Deseja mesmo desconectar?</Text>
          
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.modalButtonText}>Não</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalConfirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.modalButtonText}>Sim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Componente personalizado para a barra de navegação
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    const { success, error } = await signOut();
    
    if (error) {
      console.error('Erro ao fazer logout:', error);
      // Aqui poderia mostrar um alerta de erro
    }
  };

  return (
    <View style={styles.tabBarContainer}>
      {/* Modal de confirmação de logout */}
      <LogoutConfirmationModal
        visible={logoutModalVisible}
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />
      
      {/* Botões de navegação */}
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName;
          if (route.name === 'Treinos') {
            iconName = isFocused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Histórico') {
            iconName = isFocused ? 'calendar' : 'calendar-outline';
          }

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabButton}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? COLORS.PRIMARY : COLORS.GRAY[500]}
              />
              <Text style={[
                styles.tabLabel,
                { color: isFocused ? COLORS.PRIMARY : COLORS.GRAY[500] }
              ]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        
        {/* Botão de logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color={COLORS.FEEDBACK.ERROR}
          />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <CustomTabBar {...props} />}
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

// Estilos
const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderTopColor: COLORS.GRAY[800],
    borderTopWidth: 1,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  logoutButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.FEEDBACK.ERROR,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    marginHorizontal: SPACING.XS,
  },
  modalCancelButton: {
    backgroundColor: COLORS.GRAY[700],
  },
  modalConfirmButton: {
    backgroundColor: COLORS.FEEDBACK.ERROR,
  },
  modalButtonText: {
    color: COLORS.TEXT.LIGHT,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default RootNavigator; 