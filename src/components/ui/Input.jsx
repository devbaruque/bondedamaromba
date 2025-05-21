import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, TEXT_VARIANT } from '../../design';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  error,
  hint,
  disabled,
  multiline,
  numberOfLines = 1,
  style,
  inputStyle,
  labelStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const toggleSecureEntry = () => {
    setIsSecureVisible(prev => !prev);
  };

  const getBorderColor = () => {
    if (error) return COLORS.FEEDBACK.ERROR;
    if (isFocused) return COLORS.PRIMARY;
    return COLORS.GRAY[700];
  };

  const inputContainerStyle = {
    borderColor: getBorderColor(),
    backgroundColor: disabled ? COLORS.GRAY[800] : COLORS.GRAY[900],
    height: multiline ? 100 : undefined,
  };

  const textInputStyle = {
    height: multiline ? 80 : undefined,
    textAlignVertical: multiline ? 'top' : 'center',
  };

  const helpTextStyle = {
    color: error ? COLORS.FEEDBACK.ERROR : COLORS.GRAY[500],
  };

  // Propriedades completas para evitar o preenchimento automático e sugestões de senha
  // Especialmente importantes para iOS/macOS
  const secureTextInputProps = secureTextEntry ? {
    autoComplete: 'off',                  // Para Android
    textContentType: 'oneTimeCode',       // Para iOS (oneTimeCode é o mais seguro para evitar sugestões)
    autoCorrect: false,
    spellCheck: false,
    keyboardType: 'default',              // Forçar teclado padrão
    passwordRules: 'minlength: 0;',       // Evita regras de validação de senha do iOS
    secureTextEntry: !isSecureVisible,    // Controle de visibilidade
  } : {};

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      <View style={[styles.inputContainer, inputContainerStyle]}>
        <TextInput
          style={[styles.input, textInputStyle, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.GRAY[500]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          {...(secureTextEntry ? secureTextInputProps : {})}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={toggleSecureEntry} style={styles.iconContainer}>
            <Ionicons 
              name={isSecureVisible ? 'eye-off' : 'eye'} 
              size={24} 
              color={COLORS.GRAY[500]} 
            />
          </TouchableOpacity>
        )}
      </View>

      {(error || hint) && (
        <Text style={[styles.helpText, helpTextStyle]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.MD,
    width: '100%',
  },
  label: {
    ...TEXT_VARIANT.labelDefault,
    color: COLORS.TEXT.DEFAULT,
    marginBottom: SPACING.XS,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.SM,
    borderWidth: 1,
    paddingHorizontal: SPACING.SM,
  },
  input: {
    ...TEXT_VARIANT.bodyDefault,
    color: COLORS.TEXT.LIGHT,
    flex: 1,
    paddingVertical: SPACING.SM,
  },
  helpText: {
    ...TEXT_VARIANT.bodySmall,
    marginTop: SPACING.XS,
  },
  iconContainer: {
    paddingLeft: SPACING.XS,
  },
});

export default Input; 