import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { Button, Input } from '../ui';
import { uploadWorkoutImage } from '../../services/workout/workoutService';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, TEXT_VARIANT } from '../../design';
import { Ionicons } from '@expo/vector-icons';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Nome é obrigatório'),
  description: Yup.string(),
});

/**
 * Componente de formulário para adicionar/editar planos de treino
 * @param {object} props - Propriedades do componente
 * @param {object} props.initialValues - Valores iniciais do formulário
 * @param {function} props.onSubmit - Função chamada ao submeter o formulário
 * @param {boolean} props.isEditing - Se está editando um treino existente
 * @param {boolean} props.isLoading - Se está carregando
 */
const WorkoutForm = ({ 
  initialValues = { name: '', description: '', image_url: '' },
  onSubmit, 
  isEditing = false,
  isLoading = false 
}) => {
  const { user } = useAuth();
  const [imageLoading, setImageLoading] = useState(false);
  
  // Solicitar permissões para acessar a galeria
  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Por favor, conceda permissão para acessar sua biblioteca de imagens.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Escolher uma imagem da galeria
  const pickImage = async (setFieldValue) => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageLoading(true);
        
        // Se estamos editando um treino existente, precisamos do ID para salvar a imagem
        if (isEditing && initialValues.id) {
          // Upload da imagem para o Supabase Storage
          const { data, error } = await uploadWorkoutImage(
            { uri: result.assets[0].uri, name: result.assets[0].uri.split('/').pop() },
            initialValues.id
          );

          if (error) {
            Alert.alert('Erro', 'Não foi possível fazer o upload da imagem.');
            setImageLoading(false);
            return;
          }

          setFieldValue('image_url', data.url);
        } else {
          // Se estamos criando um novo treino, armazenamos temporariamente apenas a URI local
          // O upload real será feito após criar o treino
          setFieldValue('image_url', result.assets[0].uri);
          setFieldValue('localImage', result.assets[0]);
        }
        
        setImageLoading(false);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
      setImageLoading(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
        <View style={styles.container}>
          {/* Campo para imagem */}
          <TouchableOpacity 
            style={styles.imageContainer}
            onPress={() => pickImage(setFieldValue)}
            disabled={imageLoading || isLoading}
          >
            {imageLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              </View>
            ) : values.image_url ? (
              <Image 
                source={{ uri: values.image_url }} 
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image" size={40} color={COLORS.GRAY[600]} />
                <Text style={styles.placeholderText}>
                  {isEditing ? 'Alterar imagem' : 'Adicionar imagem de capa'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Campo de nome */}
          <Input
            label="Nome do treino"
            placeholder="Ex: Treino A, Peito e Tríceps, etc."
            value={values.name}
            onChangeText={handleChange('name')}
            onBlur={handleBlur('name')}
            error={touched.name && errors.name}
          />

          {/* Campo de descrição */}
          <Input
            label="Descrição (opcional)"
            placeholder="Descreva seu treino"
            value={values.description}
            onChangeText={handleChange('description')}
            onBlur={handleBlur('description')}
            multiline
            numberOfLines={3}
          />

          {/* Botão de salvar */}
          <Button
            title={isEditing ? 'Salvar alterações' : 'Criar treino'}
            onPress={handleSubmit}
            disabled={isLoading || imageLoading}
            loading={isLoading}
            fullWidth
            style={styles.button}
          />
        </View>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.MD,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    marginBottom: SPACING.MD,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.GRAY[900],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.GRAY[700],
    borderRadius: 8,
  },
  placeholderText: {
    ...TEXT_VARIANT.labelDefault,
    color: COLORS.GRAY[600],
    marginTop: SPACING.SM,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginTop: SPACING.MD,
  },
});

export default WorkoutForm; 