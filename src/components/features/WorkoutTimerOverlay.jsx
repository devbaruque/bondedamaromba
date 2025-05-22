import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutTimer } from '../../contexts/WorkoutTimerContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../../design';

const { width } = Dimensions.get('window');

const WorkoutTimerOverlay = () => {
  const { isActive, workoutName, formattedTime } = useWorkoutTimer();

  if (!isActive) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.timer}>
        <View style={styles.timerContent}>
          <Ionicons name="time" size={18} color={COLORS.PRIMARY} style={styles.icon} />
          <Text style={styles.timerText}>{formattedTime}</Text>
        </View>
        <Text style={styles.workoutName} numberOfLines={1} ellipsizeMode="tail">
          {workoutName}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 50,
    zIndex: 9999,
    elevation: 9999,
    pointerEvents: 'box-none',
  },
  timer: {
    backgroundColor: 'rgba(26, 42, 64, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    maxWidth: width * 0.85,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 5,
  },
  timerText: {
    color: COLORS.TEXT.LIGHT,
    fontWeight: '700',
    fontSize: 18,
    marginRight: 8,
  },
  workoutName: {
    color: COLORS.TEXT.MUTED,
    fontSize: 14,
    maxWidth: width * 0.4,
  },
});

export default WorkoutTimerOverlay; 