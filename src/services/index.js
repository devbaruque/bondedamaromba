// Autenticação
export * from './auth/authService';

// Gerenciamento de treinos
export * from './workout/workoutService';

// Gerenciamento de exercícios
export * from './exercise/exerciseService';

// Histórico de treinos
export * from './history/historyService';

// Cliente do Supabase
export { default as supabase } from './supabase'; 