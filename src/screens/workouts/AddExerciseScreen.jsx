import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, TEXT_VARIANT, BORDER_RADIUS } from '../../design';
import { Button, Input } from '../../components/ui';
import { createExercise, uploadExerciseImage } from '../../services';
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
  const [tempImages, setTempImages] = useState([]);
  const [imageLoading, setImageLoading] = useState(false);

  // Configurando o header ao montar o componente
  useEffect(() => {
    navigation.setOptions({
      title: 'Novo Exercício',
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleAddTempImage}
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

  // Adicionar imagem temporária
  const handleAddTempImage = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      setImageLoading(true);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const fileName = selectedAsset.uri.split('/').pop();
        
        // Criar objeto de arquivo temporário
        const fileObject = {
          uri: selectedAsset.uri,
          name: fileName,
          type: `image/${fileName.split('.').pop()}`
        };
        
        // Adicionar à lista temporária
        setTempImages(current => [...current, fileObject]);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao selecionar a imagem.');
    } finally {
      setImageLoading(false);
    }
  };

  // Remover imagem temporária
  const handleRemoveTempImage = (index) => {
    setTempImages(current => current.filter((_, i) => i !== index));
  };

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

      console.log('Enviando dados do exercício:', exerciseData);

      // Criar o exercício
      const response = await createExercise(exerciseData);
      const { data: createdExercise, error: exerciseError } = response || {};

      console.log('Resposta da criação do exercício:', { response, createdExercise, exerciseError });

      // Se houver um erro explícito, mostramos o erro
      if (exerciseError) {
        console.error('Erro explícito ao criar exercício:', exerciseError);
        Alert.alert('Erro', 'Não foi possível adicionar o exercício: ' + exerciseError);
        return;
      }

      // Se não há dados, algo deu errado
      if (!createdExercise) {
        console.error('Exercício não foi criado (nenhum dado retornado)');
        Alert.alert('Erro', 'Não foi possível adicionar o exercício (nenhum dado retornado).');
        return;
      }

      console.log('Exercício criado com sucesso:', createdExercise);

      // Se houver imagens temporárias, fazer upload após criar o exercício
      let uploadSuccessful = true;
      if (tempImages.length > 0 && createdExercise.id) {
        // Informar o usuário que o exercício foi criado e estamos fazendo upload das imagens
        Alert.alert('Sucesso', 'Exercício criado! Fazendo upload das imagens...');
        
        // Upload de cada imagem
        for (const imageFile of tempImages) {
          try {
            console.log('Enviando imagem para o exercício:', {
              exerciseId: createdExercise.id,
              fileName: imageFile.name
            });
            
            const { data: uploadData, error: uploadError } = await uploadExerciseImage(imageFile, createdExercise.id);
            
            if (uploadError) {
              console.error('Erro ao fazer upload de imagem:', uploadError);
              uploadSuccessful = false;
            } else {
              console.log('Upload de imagem concluído:', uploadData);
            }
          } catch (uploadError) {
            console.error('Exceção ao fazer upload de imagem:', uploadError);
            uploadSuccessful = false;
          }
        }
        
        // Mensagem final sobre o upload das imagens, se necessário
        if (!uploadSuccessful) {
          Alert.alert(
            'Atenção',
            'O exercício foi criado, mas houve problemas com o upload de algumas imagens.'
          );
        }
      } else {
        // Se não há imagens para upload, apenas avisamos que o exercício foi criado
        Alert.alert('Sucesso', 'Exercício adicionado com sucesso!');
      }

      // Voltar para a lista de exercícios
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao adicionar exercício:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao adicionar o exercício: ' + (error.message || error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Imagens temporárias */}
      {tempImages.length > 0 && (
        <View style={styles.imagesContainer}>
          <Text style={styles.imagesTitle}>Imagens selecionadas</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesScroll}
          >
            {tempImages.map((img, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: img.uri }} style={styles.imageItem} />
                <TouchableOpacity 
                  style={styles.deleteImageButton}
                  onPress={() => handleRemoveTempImage(index)}
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
  imagesContainer: {
    marginBottom: SPACING.MD,
  },
  imagesTitle: {
    ...TEXT_VARIANT.labelDefault,
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.SM,
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
});

export default AddExerciseScreen; 