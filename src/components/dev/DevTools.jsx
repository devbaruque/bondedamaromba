import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TEXT_VARIANT } from '../../design';
import { testAuthFlow } from '../../utils/authTester';
import { testLogin, checkSession, testLogout, requestPasswordReset, checkEmailConfirmationStatus } from '../../utils/testAuth';

/**
 * Componente de ferramentas de desenvolvimento
 * IMPORTANTE: Remova este componente em produção
 */
const DevTools = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('dev.baruque@gmail.com');
  const [password, setPassword] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setTestResult('Testando login...');
    
    try {
      const loginResult = await testLogin(email, password);
      if (loginResult.error) {
        setTestResult(`❌ ERRO: ${loginResult.error}`);
      } else {
        setTestResult(`✅ LOGIN BEM-SUCEDIDO!\nID: ${loginResult.data.user.id}\nEmail: ${loginResult.data.user.email}`);
        
        // Verifica a sessão
        const sessionResult = await checkSession();
        if (!sessionResult.error) {
          setTestResult(prev => `${prev}\n\n✅ SESSÃO VÁLIDA`);
        }
      }
    } catch (error) {
      setTestResult(`❌ ERRO INESPERADO: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setTestResult('Testando logout...');
    
    try {
      const result = await testLogout();
      if (result.error) {
        setTestResult(`❌ ERRO: ${result.error}`);
      } else {
        setTestResult('✅ LOGOUT REALIZADO COM SUCESSO');
      }
    } catch (error) {
      setTestResult(`❌ ERRO INESPERADO: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckSession = async () => {
    setIsLoading(true);
    setTestResult('Verificando sessão...');
    
    try {
      const result = await checkSession();
      if (result.error) {
        setTestResult(`❌ ERRO: ${result.error}`);
      } else {
        setTestResult(`✅ SESSÃO VÁLIDA\nUsuário: ${result.data.data.session.user.email}`);
      }
    } catch (error) {
      setTestResult(`❌ ERRO INESPERADO: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    setTestResult(`Enviando email de redefinição para: ${email}`);
    
    try {
      const result = await requestPasswordReset(email);
      if (result.error) {
        setTestResult(`❌ ERRO: ${result.error}`);
      } else {
        setTestResult(`✅ EMAIL DE REDEFINIÇÃO ENVIADO\nVerifique a caixa de entrada de: ${email}`);
      }
    } catch (error) {
      setTestResult(`❌ ERRO INESPERADO: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckEmailStatus = async () => {
    setIsLoading(true);
    setTestResult(`Verificando status de confirmação para: ${email}`);
    
    try {
      const result = await checkEmailConfirmationStatus(email);
      
      if (result.error) {
        setTestResult(`❌ ERRO: ${result.error}`);
      } else if (result.confirmed) {
        setTestResult(`✅ EMAIL CONFIRMADO: ${email}`);
      } else {
        setTestResult(`⚠️ EMAIL NÃO CONFIRMADO: ${email}\nVerifique sua caixa de entrada e confirme sua conta.`);
      }
    } catch (error) {
      setTestResult(`❌ ERRO INESPERADO: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return (
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
      >
        <Ionicons name="code-working" size={24} color={COLORS.TEXT.LIGHT} />
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Dev Tools</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.TEXT.LIGHT} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Teste de Autenticação</Text>
            
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={COLORS.TEXT.MUTED}
            />
            
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Senha"
              placeholderTextColor={COLORS.TEXT.MUTED}
              secureTextEntry
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.dangerButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogout}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.infoButton, isLoading && styles.buttonDisabled]}
                onPress={handleCheckSession}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Verificar</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.fullButton, styles.warningButton, isLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Redefinir Senha</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.fullButton, styles.successButton, isLoading && styles.buttonDisabled]}
              onPress={handleCheckEmailStatus}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Verificar Confirmação de Email</Text>
            </TouchableOpacity>
            
            {testResult && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Resultado:</Text>
                <Text style={styles.resultText}>{testResult}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.PRIMARY,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    padding: SPACING.MD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  title: {
    ...TEXT_VARIANT.headingMedium,
    color: COLORS.TEXT.LIGHT,
  },
  closeButton: {
    padding: SPACING.XS,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    ...TEXT_VARIANT.bodyLargeBold,
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.MD,
  },
  input: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: 8,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    color: COLORS.TEXT.DEFAULT,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: SPACING.SM,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dangerButton: {
    backgroundColor: COLORS.FEEDBACK.ERROR,
  },
  infoButton: {
    backgroundColor: COLORS.FEEDBACK.INFO,
  },
  buttonText: {
    ...TEXT_VARIANT.bodyDefaultBold,
    color: COLORS.TEXT.LIGHT,
  },
  resultContainer: {
    backgroundColor: COLORS.BACKGROUND.LIGHT,
    borderRadius: 8,
    padding: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  resultTitle: {
    ...TEXT_VARIANT.bodyDefaultBold,
    color: COLORS.TEXT.DEFAULT,
    marginBottom: SPACING.SM,
  },
  resultText: {
    ...TEXT_VARIANT.bodyDefault,
    color: COLORS.TEXT.DEFAULT,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fullButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: SPACING.SM,
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  warningButton: {
    backgroundColor: COLORS.FEEDBACK.WARNING,
  },
  successButton: {
    backgroundColor: COLORS.FEEDBACK.SUCCESS,
  },
});

export default DevTools; 