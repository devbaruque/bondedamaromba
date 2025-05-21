import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, TEXT_VARIANT } from '../../design';

const Avatar = ({
  source,
  name,
  size = 'md',
  icon = 'person',
  style,
  ...props
}) => {
  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return {
          container: 32,
          fontSize: 14,
          iconSize: 16,
        };
      case 'lg':
        return {
          container: 64,
          fontSize: 24,
          iconSize: 32,
        };
      case 'md':
      default:
        return {
          container: 48,
          fontSize: 18,
          iconSize: 24,
        };
    }
  };

  const sizeStyles = getSizeStyle();

  // Função para obter iniciais a partir do nome
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Renderização baseada no tipo de avatar
  const renderContent = () => {
    // Avatar com imagem
    if (source) {
      return (
        <Image
          source={typeof source === 'string' ? { uri: source } : source}
          style={[
            styles.image,
            { width: sizeStyles.container, height: sizeStyles.container },
          ]}
          resizeMode="cover"
        />
      );
    }
    
    // Avatar com ícone
    if (icon) {
      return (
        <View style={[styles.placeholder, { backgroundColor: COLORS.TERTIARY }]}>
          <Ionicons
            name={icon}
            size={sizeStyles.iconSize}
            color={COLORS.TEXT.LIGHT}
          />
        </View>
      );
    }
    
    // Avatar com iniciais
    return (
      <View style={[styles.placeholder, { backgroundColor: COLORS.SECONDARY }]}>
        <Text style={[styles.initials, { fontSize: sizeStyles.fontSize }]}>
          {getInitials(name)}
        </Text>
      </View>
    );
  };

  const containerStyle = [
    styles.container,
    { width: sizeStyles.container, height: sizeStyles.container },
    style,
  ];

  return (
    <View
      style={containerStyle}
      {...props}
    >
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.FULL,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...TEXT_VARIANT.bodyDefault,
    color: COLORS.TEXT.LIGHT,
    fontWeight: 'bold',
  },
});

export default Avatar; 