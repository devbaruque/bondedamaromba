import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOW } from '../../design';

const Card = ({
  children,
  variant = 'default',
  onPress,
  style,
  contentStyle,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: COLORS.BACKGROUND.DEFAULT,
          shadow: SHADOW.LG,
        };
      case 'flat':
        return {
          backgroundColor: COLORS.BACKGROUND.DARK,
          shadow: null,
        };
      case 'default':
      default:
        return {
          backgroundColor: COLORS.BACKGROUND.DEFAULT,
          shadow: SHADOW.SM,
        };
    }
  };
  
  const variantStyle = getVariantStyle();
  const CardComponent = onPress ? TouchableOpacity : View;
  
  const cardStyle = [
    styles.container,
    {
      backgroundColor: variantStyle.backgroundColor,
      ...(variantStyle.shadow || {}),
    },
    style,
  ];
  
  return (
    <CardComponent
      style={cardStyle}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      {...props}
    >
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
  },
  content: {
    padding: SPACING.MD,
  },
});

export default Card; 