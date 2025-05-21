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
  email: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: Yup.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
});

const LoginScreen = ({ navigation }) => {
  const { signIn } = useAuth();
  const [loginError, setLoginError] = useState(null);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoginError(null);
        const { error } = await signIn(values.email, values.password);
        
        if (error) {
          setLoginError(typeof error === 'string' ? error : 'Erro ao fazer login. Verifique suas credenciais.');
        }
      } catch (err) {
        console.error('Erro durante login:', err);
        setLoginError('Ocorreu um erro ao tentar fazer login.');
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
              <Text style={styles.appTitle}>Bonde da Maromba</Text>
            </View>

            <View style={styles.formContainer}>
              {loginError && (
                <Text style={styles.errorMessage}>{loginError}</Text>
              )}
              
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
                placeholder="Sua senha"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={touched.password && errors.password}
                secureTextEntry
                testID="password-input"
              />

              <Button
                title="Entrar"
                onPress={handleSubmit}
                loading={isSubmitting}
                fullWidth
                style={styles.loginButton}
              />

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>
                  Não tem uma conta?
                </Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Register')}
                  disabled={isSubmitting}
                >
                  <Text style={styles.registerLink}>Cadastre-se</Text>
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
  loginButton: {
    marginTop: SPACING.MD,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.XL,
  },
  registerText: {
    ...TEXT_VARIANT.bodyDefault,
    color: COLORS.TEXT.DEFAULT,
    marginRight: SPACING.XS,
  },
  registerLink: {
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
  appTitle: {
    ...TEXT_VARIANT.headingLarge,
    color: COLORS.TEXT.LIGHT,
    marginTop: SPACING.MD,
  },
});

export default LoginScreen; 