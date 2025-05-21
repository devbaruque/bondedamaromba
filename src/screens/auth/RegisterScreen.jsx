import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
  Image
} from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';

import { Button, Input } from '../../components/ui';
import { COLORS, SPACING, TEXT_VARIANT } from '../../design';
import { useAuth } from '../../contexts/AuthContext';

const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .required('Nome é obrigatório'),
  email: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: Yup.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Senhas não conferem')
    .required('Confirmação de senha é obrigatória'),
});

const RegisterScreen = ({ navigation }) => {
  const { signUp } = useAuth();
  const [registerError, setRegisterError] = useState(null);

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setRegisterError(null);
        const { error } = await signUp(
          values.email, 
          values.password, 
          { fullName: values.fullName }
        );
        
        if (error) {
          setRegisterError(typeof error === 'string' ? error : 'Erro ao criar conta. Tente novamente.');
        } else {
          // Exibe mensagem de sucesso antes de redirecionar
          Alert.alert(
            'Sucesso',
            'Conta criada com sucesso! Agora você pode fazer login.',
            [
              { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]
          );
        }
      } catch (err) {
        console.error('Erro durante cadastro:', err);
        setRegisterError('Ocorreu um erro ao tentar criar sua conta.');
      }
    },
  });

  const { 
    handleChange, 
    handleSubmit, 
    handleBlur, 
    values, 
    errors, 
    touched, 
    isSubmitting 
  } = formik;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/bondedamaromba.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.formContainer}>
              {registerError && (
                <Text style={styles.errorMessage}>{registerError}</Text>
              )}
              
              <Input
                label="Nome completo"
                placeholder="Seu nome completo"
                value={values.fullName}
                onChangeText={handleChange('fullName')}
                onBlur={handleBlur('fullName')}
                error={touched.fullName && errors.fullName}
                autoCapitalize="words"
              />

              <Input
                label="Email"
                placeholder="Seu email"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email && errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Senha"
                placeholder="Crie uma senha"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={touched.password && errors.password}
                secureTextEntry
                testID="password-input"
              />

              <Input
                label="Confirmar senha"
                placeholder="Confirme sua senha"
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={touched.confirmPassword && errors.confirmPassword}
                secureTextEntry
                testID="confirm-password-input"
              />

              <Button
                title="Cadastrar"
                onPress={handleSubmit}
                loading={isSubmitting}
                fullWidth
                style={styles.registerButton}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Já tem uma conta?
                </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Login')}
                  disabled={isSubmitting}
                >
                  <Text style={styles.loginLink}>Entrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND.DARK,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: SPACING.LG,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: SPACING.MD,
  },
  appName: {
    ...TEXT_VARIANT.headingLarge,
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.MD,
  },
  formContainer: {
    width: '100%',
  },
  registerButton: {
    marginTop: SPACING.MD,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.XL,
  },
  loginText: {
    ...TEXT_VARIANT.bodyDefault,
    color: COLORS.TEXT.DEFAULT,
    marginRight: SPACING.XS,
  },
  loginLink: {
    ...TEXT_VARIANT.bodyDefault,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  errorMessage: {
    ...TEXT_VARIANT.bodyDefault,
    color: COLORS.FEEDBACK.ERROR,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
});

export default RegisterScreen; 