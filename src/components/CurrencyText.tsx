// GigOS CurrencyText — formats INR (Indian numbering) / USD
import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { FontFamily } from '@/src/theme/typography';
import { Colors } from '@/src/theme/colors';

interface CurrencyTextProps {
  amount: number | null | undefined;
  currency?: string;
  fontSize?: number;
  color?: string;
  style?: TextStyle;
}

function formatINR(n: number): string {
  const s = Math.abs(n).toString();
  if (s.length <= 3) return (n < 0 ? '-' : '') + s;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  // Indian numbering: groups of 2 after the first 3
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) parts.unshift(rest);
  return (n < 0 ? '-' : '') + parts.join(',') + ',' + last3;
}

function formatUSD(n: number): string {
  return Math.abs(n).toLocaleString('en-US');
}

export function CurrencyText({ amount, currency = 'INR', fontSize = 15, color, style }: CurrencyTextProps) {
  if (amount == null) {
    return (
      <Text
        testID="currency-text"
        style={[styles.text, { fontSize, color: color || Colors.textDisabled }, style]}
      >
        —
      </Text>
    );
  }

  const symbol = currency === 'USD' ? '$' : '₹';
  const formatted = currency === 'USD' ? formatUSD(amount) : formatINR(amount);

  return (
    <Text
      testID="currency-text"
      style={[styles.text, { fontSize, color: color || Colors.textPrimary }, style]}
    >
      {symbol}{formatted}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: FontFamily.sairaBold,
  },
});
