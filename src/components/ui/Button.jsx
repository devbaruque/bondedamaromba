import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, TEXT_VARIANT } from '../../design';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: COLORS.SECONDARY,
          textColor: COLORS.TEXT.LIGHT,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: COLORS.PRIMARY,
          borderColor: COLORS.PRIMARY,
          borderWidth: 1,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          textColor: COLORS.PRIMARY,
        };
      case 'primary':
      default:
        return {
          backgroundColor: COLORS.PRIMARY,
          textColor: COLORS.TEXT.LIGHT,
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: SPACING.XS,
          paddingHorizontal: SPACING.MD,
          textVariant: TEXT_VARIANT.labelSmall,
        };
      case 'lg':
        return {
          paddingVertical: SPACING.MD,
          paddingHorizontal: SPACING.XL,
          textVariant: TEXT_VARIANT.labelLarge,
        };
      case 'md':
      default:
        return {
          paddingVertical: SPACING.SM,
          paddingHorizontal: SPACING.LG,
          textVariant: TEXT_VARIANT.labelDefault,
        };
    }
  };

  const variantStyle = getVariantStyle();
  const sizeStyle = getSizeStyle();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          borderWidth: variantStyle.borderWidth,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          opacity: disabled ? 0.7 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor} size="small" />
      ) : (
        <Text
          style={[
            sizeStyle.textVariant,
            {
              color: variantStyle.textColor,
              textAlign: 'center',
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.MD,
  },
});

export default Button; 