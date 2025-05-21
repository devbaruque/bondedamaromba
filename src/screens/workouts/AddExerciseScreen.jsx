import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { COLORS, SPACING, TEXT_VARIANT } from '../../design';
import { Button, Input } from '../../components/ui';
import { createExercise } from '../../services';
import { Ionicons } from '@expo/vector-icons';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Nome é obrigatório'),
  sets: Yup.number().required('Número de séries é obrigatório').min(1, 'Mínimo de 1 série'),
  repetitions: Yup.number().required('Número de repetições é obrigatório').min(1, 'Mínimo de 1 repetição'),
  rest_time: Yup.number().required('Tempo de descanso é obrigatório').min(0, 'Tempo de descanso deve ser positivo'),
});

const AddExerciseScreen = ({ route, navigation }) => {
  const { workoutId } = route.params;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configurando o header ao montar o componente
  React.useEffect(() => {
    navigation.setOptions({
      title: 'Novo Exercício',
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="camera" size={24} color={COLORS.TEXT.LIGHT} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleSubmit = async (values) => {
    try {
      setIsSubmitting(true);

      // Preparar dados para envio
      const exerciseData = {
        workout_plan_id: workoutId,
        name: values.name,
        sets: parseInt(values.sets),
        repetitions: parseInt(values.repetitions),
        rest_time: parseInt(values.rest_time),
        notes: values.notes || null,
      };

      // Enviar para API
      const { data, error } = await createExercise(exerciseData);

      if (error) {
        Alert.alert('Erro', 'Não foi possível adicionar o exercício.');
        return;
      }

      // Voltar para a lista de exercícios
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao adicionar exercício:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao adicionar o exercício.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Formik
        initialValues={{ name: '', sets: '3', repetitions: '12', rest_time: '60', notes: '' }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View>
            <Input
              label="Nome do exercício"
              placeholder="Ex: Supino reto, Agachamento, etc."
              value={values.name}
              onChangeText={handleChange('name')}
              onBlur={handleBlur('name')}
              error={touched.name && errors.name}
            />

            <View style={styles.row}>
              <View style={styles.column}>
                <Input
                  label="Séries"
                  placeholder="Ex: 3"
                  value={values.sets}
                  onChangeText={handleChange('sets')}
                  onBlur={handleBlur('sets')}
                  error={touched.sets && errors.sets}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.column}>
                <Input
                  label="Repetições"
                  placeholder="Ex: 12"
                  value={values.repetitions}
                  onChangeText={handleChange('repetitions')}
                  onBlur={handleBlur('repetitions')}
                  error={touched.repetitions && errors.repetitions}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Input
              label="Tempo de descanso (segundos)"
              placeholder="Ex: 60"
              value={values.rest_time}
              onChangeText={handleChange('rest_time')}
              onBlur={handleBlur('rest_time')}
              error={touched.rest_time && errors.rest_time}
              keyboardType="numeric"
            />

            <Input
              label="Observações (opcional)"
              placeholder="Observações sobre o exercício"
              value={values.notes}
              onChangeText={handleChange('notes')}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Adicionar Exercício"
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              fullWidth
              style={styles.button}
            />
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.DARK,
  },
  content: {
    padding: SPACING.MD,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: '48%',
  },
  button: {
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  headerButton: {
    marginRight: SPACING.MD,
  },
});

export default AddExerciseScreen; 