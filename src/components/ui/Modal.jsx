import React from 'react';
import {
  View,
  Modal as RNModal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, TEXT_VARIANT } from '../../design';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const Modal = ({
  visible,
  onClose,
  children,
  title,
  variant = 'center',
  closeButton = true,
  contentStyle,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'bottom-sheet':
        return {
          containerStyle: styles.bottomSheetContainer,
          contentWrapperStyle: styles.bottomSheetContent,
          animation: 'slide',
        };
      case 'fullscreen':
        return {
          containerStyle: styles.fullscreenContainer,
          contentWrapperStyle: styles.fullscreenContent,
          animation: 'slide',
        };
      case 'center':
      default:
        return {
          containerStyle: styles.centerContainer,
          contentWrapperStyle: styles.centerContent,
          animation: 'fade',
        };
    }
  };

  const variantStyle = getVariantStyle();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={variantStyle.animation}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, variantStyle.containerStyle]}>
        <View style={[styles.contentWrapper, variantStyle.contentWrapperStyle, contentStyle]}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {closeButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.TEXT.DEFAULT} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {!title && closeButton && (
            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.closeButton, styles.topRightClose]}
            >
              <Ionicons name="close" size={24} color={COLORS.TEXT.DEFAULT} />
            </TouchableOpacity>
          )}

          <View style={styles.content}>
            {children}
          </View>
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentWrapper: {
    backgroundColor: COLORS.BACKGROUND.DEFAULT,
    borderRadius: BORDER_RADIUS.LG,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[800],
  },
  title: {
    ...TEXT_VARIANT.labelLarge,
    color: COLORS.TEXT.LIGHT,
    flex: 1,
  },
  content: {
    padding: SPACING.MD,
  },
  closeButton: {
    padding: SPACING.XS,
  },
  topRightClose: {
    position: 'absolute',
    top: SPACING.SM,
    right: SPACING.SM,
    zIndex: 10,
  },
  // Variantes de container
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    width: WINDOW_WIDTH * 0.85,
    maxHeight: WINDOW_HEIGHT * 0.8,
  },
  bottomSheetContainer: {
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    width: WINDOW_WIDTH,
    borderTopLeftRadius: BORDER_RADIUS.LG,
    borderTopRightRadius: BORDER_RADIUS.LG,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: WINDOW_HEIGHT * 0.9,
  },
  fullscreenContainer: {
    justifyContent: 'center',
  },
  fullscreenContent: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    borderRadius: 0,
  },
});

export default Modal; 