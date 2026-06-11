// GigOS LocationPicker — Simple text inputs for venue location
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, ControlHeight } from '@/src/theme/spacing';

interface LocationPickerProps {
  country: string;
  state: string;
  city: string;
  onChangeCountry: (v: string) => void;
  onChangeState: (v: string) => void;
  onChangeCity: (v: string) => void;
  label?: string;
}

export function LocationPicker({ country, state, city, onChangeCountry, onChangeState, onChangeCity, label }: LocationPickerProps) {
  return (
    <View style={{ gap: 12 }}>
      {label ? <Text style={s.sectionLabel}>{label}</Text> : null}
      <View>
        <Text style={s.label}>CITY</Text>
        <TextInput value={city} onChangeText={onChangeCity} placeholder="e.g. Mumbai, Berlin" placeholderTextColor={Colors.textDisabled} style={s.input} />
      </View>
      <View>
        <Text style={s.label}>STATE / PROVINCE</Text>
        <TextInput value={state} onChangeText={onChangeState} placeholder="e.g. Maharashtra, Bavaria" placeholderTextColor={Colors.textDisabled} style={s.input} />
      </View>
      <View>
        <Text style={s.label}>COUNTRY</Text>
        <TextInput value={country} onChangeText={onChangeCountry} placeholder="e.g. India, Germany" placeholderTextColor={Colors.textDisabled} style={s.input} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sectionLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.textTertiary },
  label: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.textTertiary, marginBottom: 6 },
  input: { height: ControlHeight.md, backgroundColor: Colors.surfaceInput, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.borderDefault, paddingHorizontal: 12, fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textPrimary },
});
