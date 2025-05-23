// Polyfill para URL no React Native (deve ser o primeiro import)
import 'react-native-url-polyfill/auto';

// Importações React e React Native
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, LogBox } from 'react-native';

// Importações do projeto
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation';
import { COLORS } from './src/design';
import { DevTools } from './src/components/dev';

// Verificar se estamos em modo de desenvolvimento
const isDev = process.env.NODE_ENV !== 'production';

// Ignorando avisos não críticos que podem aparecer durante o desenvolvimento
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'NativeBase:',
  'Warning: Failed prop type',
  // Ainda ignoramos warnings relacionados à comunicação
  "The provided value 'moz-chunked-arraybuffer' is not a valid 'responseType'",
  "The provided value 'ms-stream' is not a valid 'responseType'",
]);

export default function App() {
  // Verificar se o polyfill de URL está funcionando corretamente
  useEffect(() => {
    try {
      // Testar se o URL está funcionando
      const testUrl = new URL('https://example.com');
      console.log('✅ URL polyfill funcionando corretamente', testUrl.hostname);
    } catch (error) {
      console.error('❌ Erro com o polyfill de URL:', error);
    }
  }, []);

  return (
    <View style={styles.container}>
      <AuthProvider>
        <StatusBar style="light" backgroundColor={COLORS.BACKGROUND.DARK} />
        <RootNavigator />
        {isDev && <DevTools />}
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
