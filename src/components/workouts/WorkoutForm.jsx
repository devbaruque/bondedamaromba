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
 * @param {object} props.workout - Treino a ser editado (se for edição)
 * @param {function} props.onSubmit - Função chamada ao submeter o formulário
 * @param {function} props.onCancel - Função chamada ao cancelar
 * @param {boolean} props.isSubmitting - Se está processando o envio do form
 */
const WorkoutForm = ({ 
  workout,
  onSubmit, 
  onCancel,
  isSubmitting = false 
}) => {
  const { user } = useAuth();
  const [imageLoading, setImageLoading] = useState(false);
  const isEditing = !!workout;
  
  // Definir valores iniciais com base no treino (se fornecido)
  const initialValues = workout ? {
    id: workout.id,
    name: workout.name || '',
    description: workout.description || '',
    image_url: workout.image_url || '',
  } : {
    name: '',
    description: '',
    image_url: '',
  };
  
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
      console.log('Abrindo seleção de imagens');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('Imagem selecionada:', result.assets[0].uri);
        setImageLoading(true);
        
        // Criamos um objeto File compatível com o formato esperado pelo serviço
        const selectedAsset = result.assets[0];
        const fileName = selectedAsset.uri.split('/').pop();
        
        // Criar um objeto simulando File para o API de upload
        const fileObject = {
          uri: selectedAsset.uri,
          name: fileName,
          type: `image/${fileName.split('.').pop()}`
        };
        
        console.log('Preparando objeto de imagem:', {
          fileName,
          uri: fileObject.uri,
          type: fileObject.type
        });
        
        // Se estamos editando um treino existente, fazemos o upload agora
        if (isEditing && workout.id) {
          try {
            console.log('Fazendo upload de imagem para treino existente:', workout.id);
            
            // Upload da imagem para o Supabase Storage
            const { data, error } = await uploadWorkoutImage(fileObject, workout.id);

            if (error) {
              console.error('Erro ao fazer upload da imagem:', error);
              Alert.alert('Erro', `Não foi possível fazer o upload da imagem: ${error}`);
              setImageLoading(false);
              return;
            }

            if (data && data.url) {
              console.log('Upload concluído, URL:', data.url);
              setFieldValue('image_url', data.url);
              Alert.alert('Sucesso', 'Imagem atualizada com sucesso!');
            } else {
              console.error('Resposta inesperada do serviço de upload:', data);
              Alert.alert('Erro', 'Resposta inesperada do serviço de upload');
            }
          } catch (uploadError) {
            console.error('Erro ao fazer upload de imagem:', uploadError);
            Alert.alert('Erro', 'Não foi possível fazer o upload da imagem. Tente novamente.');
          }
        } else {
          // Se estamos criando um novo treino, armazenamos temporariamente apenas o objeto para upload posterior
          console.log('Armazenando imagem para upload posterior');
          setFieldValue('image_url', selectedAsset.uri);
          setFieldValue('localImage', fileObject);
        }
        
        setImageLoading(false);
      } else {
        console.log('Nenhuma imagem selecionada ou seleção cancelada');
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
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
            disabled={imageLoading || isSubmitting}
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

          {/* Botões */}
          <View style={styles.buttonContainer}>
            <Button
              title="Cancelar"
              onPress={onCancel}
              variant="outline"
              disabled={isSubmitting}
              style={styles.cancelButton}
            />
            <Button
              title={isEditing ? 'Salvar alterações' : 'Criar treino'}
              onPress={handleSubmit}
              disabled={isSubmitting || imageLoading}
              loading={isSubmitting}
              style={styles.submitButton}
            />
          </View>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.MD,
  },
  cancelButton: {
    flex: 1,
    marginRight: SPACING.SM,
  },
  submitButton: {
    flex: 2,
  },
});

export default WorkoutForm; 