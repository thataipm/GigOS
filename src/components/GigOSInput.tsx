// GigOS Themed Input Component
import React, { useState, useRef } from 'react';
import { View, TextInput, Text, TouchableOpacity, Pressable, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, ControlHeight, Space } from '@/src/theme/spacing';
import { MaterialIcons } from '@expo/vector-icons';

interface GigOSInputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  prefix?: string;
  containerStyle?: ViewStyle;
}

export function GigOSInput({ label, error, isPassword, prefix, containerStyle, style, ...props }: GigOSInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[styles.inputWrap, focused && styles.inputFocused, error ? styles.inputError : null]}
      >
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          ref={inputRef}
          testID={`input-${(label || 'field').toLowerCase().replace(/\s/g, '-')}`}
          style={[styles.input, style]}
          placeholderTextColor={Colors.textDisabled}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity testID="password-toggle" onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Colors.textTertiary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ControlHeight.md,
    backgroundColor: Colors.surfaceInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    paddingHorizontal: 14,
  },
  inputFocused: {
    borderColor: Colors.cyan,
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  inputError: { borderColor: Colors.red },
  prefix: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 15,
    color: Colors.textTertiary,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.plexRegular,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  eyeBtn: { padding: 4 },
  error: {
    fontFamily: FontFamily.plexRegular,
    fontSize: 13,
    color: Colors.red,
    marginTop: 4,
  },
});
