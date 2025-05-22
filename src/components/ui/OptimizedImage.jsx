import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Image as RNImage, 
  StyleSheet, 
  ActivityIndicator, 
  Platform,
  Text
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../design';

// Cache para URLs de imagens que já foram salvas localmente
const imageCache = new Map();

/**
 * Componente otimizado para carregamento e caching de imagens
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.source - URL da imagem ou objeto source do React Native
 * @param {Object} props.style - Estilos para a imagem
 * @param {string} props.resizeMode - Modo de redimensionamento (cover, contain, etc)
 * @param {boolean} props.enableBlur - Ativar efeito de blur durante carregamento
 * @param {number} props.blurIntensity - Intensidade do blur (1-100)
 * @param {Function} props.onLoad - Callback quando a imagem carregar
 * @param {Function} props.onError - Callback em caso de erro
 */
const OptimizedImage = ({
  source,
  style,
  resizeMode = 'cover',
  enableBlur = true,
  blurIntensity = 50,
  onLoad,
  onError,
  ...otherProps
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cachedSource, setCachedSource] = useState(null);
  const [loadError, setLoadError] = useState(false);

  // Determinar a URL real da imagem
  const imageUrl = useMemo(() => {
    if (!source) return null;
    return typeof source === 'string' ? source : source.uri;
  }, [source]);

  // Gerar um nome de arquivo para cache baseado na URL
  const getCacheFilename = useCallback((url) => {
    if (!url) return null;
    // Criar um hash simples para o nome do arquivo
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = (hash << 5) - hash + url.charCodeAt(i);
      hash |= 0; // Converter para inteiro de 32 bits
    }
    return `${Math.abs(hash)}.jpg`;
  }, []);

  // Função para baixar e cachear a imagem
  const cacheImage = useCallback(async (url) => {
    if (!url) return null;
    
    try {
      // Verificar se já temos esta imagem em cache
      if (imageCache.has(url)) {
        return imageCache.get(url);
      }
      
      // Gerar nome de arquivo para cache
      const filename = getCacheFilename(url);
      const cachePath = `${FileSystem.cacheDirectory}images/`;
      const cacheFilePath = `${cachePath}${filename}`;
      
      // Verificar se o diretório de cache existe
      const dirInfo = await FileSystem.getInfoAsync(cachePath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cachePath, { intermediates: true });
      }
      
      // Verificar se o arquivo já existe no cache
      const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
      
      if (fileInfo.exists) {
        // Arquivo já existe no cache
        console.log('Imagem encontrada em cache:', cacheFilePath);
        imageCache.set(url, cacheFilePath);
        return cacheFilePath;
      }
      
      // Baixar a imagem para o cache
      console.log('Baixando imagem para cache:', url);
      const downloadResult = await FileSystem.downloadAsync(url, cacheFilePath);
      
      if (downloadResult.status === 200) {
        console.log('Imagem cacheada com sucesso:', cacheFilePath);
        imageCache.set(url, cacheFilePath);
        return cacheFilePath;
      } else {
        console.error('Erro ao baixar imagem:', downloadResult);
        return null;
      }
    } catch (error) {
      console.error('Erro ao cachear imagem:', error);
      return null;
    }
  }, [getCacheFilename]);

  // Efeito para carregar e cachear a imagem
  React.useEffect(() => {
    let isMounted = true;
    
    const loadAndCacheImage = async () => {
      if (!imageUrl) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setLoadError(false);
      
      try {
        // Desativar cache para Android e iOS na web
        if (Platform.OS === 'web' || imageUrl.startsWith('data:')) {
          setCachedSource({ uri: imageUrl });
          if (isMounted) setIsLoading(false);
          return;
        }
        
        // Carregar a imagem do cache ou baixar
        const cachedPath = await cacheImage(imageUrl);
        
        if (cachedPath && isMounted) {
          setCachedSource({ uri: cachedPath });
        } else if (isMounted) {
          // Fallback para URL original se cache falhar
          setCachedSource({ uri: imageUrl });
        }
      } catch (error) {
        console.error('Erro ao carregar imagem:', error);
        if (isMounted) {
          setLoadError(true);
          // Fallback para URL original em caso de erro
          setCachedSource({ uri: imageUrl });
          if (onError) onError(error);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    loadAndCacheImage();
    
    return () => {
      isMounted = false;
    };
  }, [imageUrl, cacheImage, onError]);

  // Gerenciar eventos de carregamento
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);
  
  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    if (onLoad) onLoad();
  }, [onLoad]);
  
  const handleError = useCallback((error) => {
    setIsLoading(false);
    setLoadError(true);
    if (onError) onError(error);
  }, [onError]);

  // Renderização condicional de placeholder ou imagem
  return (
    <View style={[styles.container, style]}>
      {cachedSource && (
        <RNImage
          source={cachedSource}
          style={styles.image}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          {...otherProps}
        />
      )}
      
      {isLoading && (
        <View style={[styles.loadingContainer, StyleSheet.absoluteFill]}>
          {enableBlur && Platform.OS !== 'web' ? (
            <BlurView
              intensity={blurIntensity}
              style={StyleSheet.absoluteFill}
              tint="dark"
            />
          ) : (
            <View style={styles.placeholder} />
          )}
          <ActivityIndicator 
            size="small" 
            color={COLORS.PRIMARY} 
          />
        </View>
      )}
      
      {loadError && !isLoading && (
        <View style={[styles.errorContainer, StyleSheet.absoluteFill]}>
          <Ionicons 
            name="image-outline" 
            size={50} 
            color={COLORS.GRAY[400]} 
          />
          <Text style={styles.errorText}>Erro ao carregar imagem</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: COLORS.GRAY[900],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.GRAY[900],
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY[900],
  },
  errorText: {
    color: COLORS.GRAY[400],
    marginTop: 8,
    fontSize: 14,
  }
});

export default React.memo(OptimizedImage); 