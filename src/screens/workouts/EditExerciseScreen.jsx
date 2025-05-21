import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, TEXT_VARIANT, BORDER_RADIUS } from '../../design';
import { Button, Input, Modal } from '../../components/ui';
import { updateExercise, uploadExerciseImage, deleteExerciseImage } from '../../services';
import { Ionicons } from '@expo/vector-icons';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Nome é obrigatório'),
  sets: Yup.number().required('Número de séries é obrigatório').min(1, 'Mínimo de 1 série'),
  repetitions: Yup.number().required('Número de repetições é obrigatório').min(1, 'Mínimo de 1 repetição'),
  rest_time: Yup.number().required('Tempo de descanso é obrigatório').min(0, 'Tempo de descanso deve ser positivo'),
});

const EditExerciseScreen = ({ route, navigation }) => {
  const { exercise } = route.params;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [images, setImages] = useState(exercise.exercise_images || []);
  const [showImageDeleteModal, setShowImageDeleteModal] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);

  // Configurando o header ao montar o componente
  useEffect(() => {
    navigation.setOptions({
      title: 'Editar Exercício',
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => handleAddImage()}
          disabled={imageLoading}
        >
          <Ionicons name="camera" size={24} color={COLORS.TEXT.LIGHT} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, imageLoading]);

  // Solicitar permissões para acessar a galeria/câmera
  const requestMediaPermissions = async () => {
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

  // Adicionar uma nova imagem
  const handleAddImage = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageLoading(true);
        
        // Preparar objeto de arquivo
        const selectedAsset = result.assets[0];
        const fileName = selectedAsset.uri.split('/').pop();
        
        const fileObject = {
          uri: selectedAsset.uri,
          name: fileName,
          type: `image/${fileName.split('.').pop()}`
        };
        
        // Fazer upload da imagem
        const { data, error } = await uploadExerciseImage(fileObject, exercise.id);
        
        if (error) {
          Alert.alert('Erro', 'Não foi possível fazer o upload da imagem.');
        } else if (data) {
          // Adicionar nova imagem à lista
          setImages(current => [...current, {
            id: data.id,
            image_url: data.url,
            order_index: data.order_index
          }]);
          
          Alert.alert('Sucesso', 'Imagem adicionada com sucesso!');
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar/enviar imagem:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar a imagem.');
    } finally {
      setImageLoading(false);
    }
  };

  // Confirmar exclusão de imagem
  const confirmDeleteImage = (imageId) => {
    setSelectedImageId(imageId);
    setShowImageDeleteModal(true);
  };

  // Excluir imagem
  const handleDeleteImage = async () => {
    if (!selectedImageId) return;
    
    try {
      setImageLoading(true);
      
      const { error } = await deleteExerciseImage(selectedImageId);
      
      if (error) {
        Alert.alert('Erro', 'Não foi possível excluir a imagem.');
      } else {
        // Remover imagem da lista
        setImages(current => current.filter(img => img.id !== selectedImageId));
        Alert.alert('Sucesso', 'Imagem excluída com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao excluir a imagem.');
    } finally {
      setImageLoading(false);
      setShowImageDeleteModal(false);
      setSelectedImageId(null);
    }
  };

  // Submeter formulário de edição
  const handleSubmit = async (values) => {
    try {
      setIsSubmitting(true);

      // Preparar dados para envio
      const exerciseData = {
        name: values.name,
        sets: parseInt(values.sets),
        repetitions: parseInt(values.repetitions),
        rest_time: parseInt(values.rest_time),
        notes: values.notes || null,
      };

      // Atualizar exercício
      const { data, error } = await updateExercise(exercise.id, exerciseData);

      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar o exercício.');
        return;
      }

      // Voltar para a tela de detalhes
      navigation.goBack();
      Alert.alert('Sucesso', 'Exercício atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar exercício:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o exercício.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Carrossel de imagens */}
      {images.length > 0 && (
        <View style={styles.imagesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesScroll}
          >
            {images.map((img) => (
              <View key={img.id} style={styles.imageWrapper}>
                <Image source={{ uri: img.image_url }} style={styles.imageItem} />
                <TouchableOpacity 
                  style={styles.deleteImageButton}
                  onPress={() => confirmDeleteImage(img.id)}
                >
                  <Ionicons name="close-circle" size={26} color={COLORS.FEEDBACK.ERROR} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Indicador de carregamento de imagem */}
      {imageLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Processando imagem...</Text>
        </View>
      )}

      {/* Formulário de edição */}
      <Formik
        initialValues={{ 
          name: exercise.name || '', 
          sets: String(exercise.sets || 3), 
          repetitions: String(exercise.repetitions || 12), 
          rest_time: String(exercise.rest_time || 60), 
          notes: exercise.notes || '' 
        }}
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
              title="Salvar Alterações"
              onPress={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              fullWidth
              style={styles.button}
            />
          </View>
        )}
      </Formik>

      {/* Modal de confirmação de exclusão de imagem */}
      <Modal
        visible={showImageDeleteModal}
        onClose={() => setShowImageDeleteModal(false)}
        title="Excluir Imagem"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita.
          </Text>
          
          <View style={styles.modalButtons}>
            <Button
              title="Cancelar"
              onPress={() => setShowImageDeleteModal(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Excluir"
              onPress={handleDeleteImage}
              variant="danger"
              style={styles.modalButton}
              loading={imageLoading}
              disabled={imageLoading}
            />
          </View>
        </View>
      </Modal>
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
  imagesContainer: {
    marginBottom: SPACING.MD,
  },
  imagesScroll: {
    paddingHorizontal: SPACING.XS,
  },
  imageWrapper: {
    position: 'relative',
    marginHorizontal: SPACING.XS,
  },
  imageItem: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.MD,
  },
  deleteImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.BACKGROUND.DARK,
    borderRadius: 15,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.SM,
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderRadius: BORDER_RADIUS.SM,
    marginBottom: SPACING.MD,
  },
  loadingText: {
    ...TEXT_VARIANT.bodySmall,
    color: COLORS.TEXT.LIGHT,
    marginLeft: SPACING.SM,
  },
  modalContent: {
    padding: SPACING.SM,
  },
  modalText: {
    ...TEXT_VARIANT.bodyDefault,
    color: COLORS.TEXT.DEFAULT,
    marginBottom: SPACING.MD,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
});

export default EditExerciseScreen; 