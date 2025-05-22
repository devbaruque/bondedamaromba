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
import * as AuthService from '../../services/auth/authService';

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
        console.log('===== TELA DE LOGIN: INICIANDO ENVIO DO FORMULÁRIO =====');
        console.log('Email fornecido:', values.email);
        console.log('Senha preenchida:', values.password ? 'Sim' : 'Não');
        
        // Validação adicional no front-end
        if (!values.email || !values.email.includes('@')) {
          console.error('Validação falhou: Email inválido');
          setLoginError('Email inválido. Por favor, verifique o formato.');
          return;
        }
        
        if (!values.password || values.password.length < 6) {
          console.error('Validação falhou: Senha muito curta');
          setLoginError('A senha deve ter pelo menos 6 caracteres.');
          return;
        }
        
        // Limpar erro anterior
        setLoginError(null);
        
        console.log('Chamando função de login do contexto...');
        const { error, success } = await signIn(values.email, values.password);
        
        if (error) {
          console.error('===== TELA DE LOGIN: ERRO RETORNADO =====');
          console.error('Erro:', error);
          
          // Formatar a mensagem de erro para exibição
          let errorMessage = typeof error === 'string' ? error : 'Erro ao fazer login. Verifique suas credenciais.';
          
          // Tornar a mensagem mais amigável baseada em padrões comuns
          if (errorMessage.includes('Invalid login credentials') || 
              errorMessage.includes('inválidos') || 
              errorMessage.includes('não encontrado')) {
            errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
          } else if (errorMessage.includes('não foi confirmado') || 
                     errorMessage.includes('not confirmed')) {
            errorMessage = 'Seu email ainda não foi confirmado. Verifique sua caixa de entrada e pasta de spam para encontrar o email de confirmação.';
            
            // Mostrar alerta com instruções detalhadas
            Alert.alert(
              'Confirmação pendente',
              'Você precisa confirmar seu email antes de fazer login. Verifique sua caixa de entrada e pasta de spam para encontrar o email de confirmação.',
              [
                { 
                  text: 'Entendi', 
                  style: 'default' 
                },
                {
                  text: 'Reenviar email',
                  onPress: async () => {
                    try {
                      // Reenviar email de confirmação
                      const { success, error } = await AuthService.resendConfirmationEmail(values.email);
                      
                      if (success) {
                        Alert.alert(
                          'Email reenviado',
                          'Um novo email de confirmação foi enviado para o seu endereço. Por favor, verifique sua caixa de entrada e pasta de spam.'
                        );
                      } else {
                        Alert.alert(
                          'Erro ao reenviar',
                          error || 'Não foi possível reenviar o email de confirmação. Tente novamente mais tarde.'
                        );
                      }
                    } catch (err) {
                      console.error('Erro ao reenviar email:', err);
                      Alert.alert(
                        'Erro',
                        'Ocorreu um erro ao tentar reenviar o email. Tente novamente mais tarde.'
                      );
                    }
                  },
                  style: 'default'
                }
              ]
            );
          } else if (errorMessage.includes('network') || 
                    errorMessage.includes('conexão') ||
                    errorMessage.includes('connection')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          } else if (errorMessage.includes('timeout') || 
                    errorMessage.includes('tempo esgotado')) {
            errorMessage = 'O servidor demorou para responder. Tente novamente mais tarde.';
          }
          
          setLoginError(errorMessage);
          
          // Exibir alerta para erro crítico (exceto para email não confirmado que já tem seu próprio alerta)
          if (!errorMessage.includes('não foi confirmado') &&
              (errorMessage.includes('servidor') || 
              errorMessage.includes('configuração') ||
              errorMessage.includes('inesperado'))) {
            Alert.alert(
              'Erro no login',
              errorMessage,
              [{ text: 'OK' }]
            );
          }
        } else if (success) {
          console.log('===== TELA DE LOGIN: LOGIN BEM-SUCEDIDO =====');
        } else {
          console.error('===== TELA DE LOGIN: RESPOSTA INDEFINIDA =====');
          setLoginError('Resposta indefinida do servidor. Tente novamente.');
        }
      } catch (err) {
        console.error('===== TELA DE LOGIN: EXCEÇÃO DURANTE LOGIN =====');
        console.error('Tipo do erro:', err?.name);
        console.error('Mensagem:', err?.message);
        console.error('Stack trace:', err?.stack);
        setLoginError('Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.');
        
        Alert.alert(
          'Erro inesperado',
          'Ocorreu um erro durante o processo de login. Por favor, tente novamente.',
          [{ text: 'OK' }]
        );
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