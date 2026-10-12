import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  textStyle,
}: ButtonProps) {
  const height = size === 'sm' ? 44 : size === 'lg' ? 64 : 56;
  const fontSize = size === 'sm' ? FontSize.label : size === 'lg' ? FontSize.subhead : FontSize.body;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { height },
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? Colors.textWhite : Colors.primary} />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize, fontWeight: FontWeight.semibold },
            variant === 'primary' && styles.textPrimary,
            variant === 'secondary' && styles.textSecondary,
            variant === 'danger' && styles.textPrimary,
            disabled && styles.textDisabled,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.level1,
  },
  danger: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.15)',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    letterSpacing: 0.3,
  },
  textPrimary: {
    color: Colors.textWhite,
  },
  textSecondary: {
    color: Colors.primary,
  },
  textDisabled: {
    color: Colors.textMuted,
  },
});
