// GigOS DateField — Native date picker wrapper
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal, Pressable, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, ControlHeight } from '@/src/theme/spacing';
import { MaterialIcons } from '@expo/vector-icons';

interface DateFieldProps {
  label?: string;
  value: string; // ISO date string 'YYYY-MM-DD' or ''
  onChange: (dateStr: string) => void;
  minDate?: Date;
  placeholder?: string;
  error?: string;
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}

export function DateField({ label, value, onChange, minDate, placeholder, error }: DateFieldProps) {
  const [show, setShow] = useState(false);
  const currentDate = value ? new Date(value + 'T00:00:00') : new Date();

  const handleChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
  };

  const handleDone = () => setShow(false);

  return (
    <View>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TouchableOpacity testID="date-field" onPress={() => setShow(true)} style={[s.field, error ? s.fieldError : null]}>
        <MaterialIcons name="calendar-today" size={16} color={Colors.textTertiary} />
        <Text style={[s.fieldText, !value && s.placeholder]}>{value ? formatDisplay(value) : (placeholder || 'Select date')}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.textTertiary} />
      </TouchableOpacity>
      {error ? <Text style={s.error}>{error}</Text> : null}

      {/* iOS: Modal with picker */}
      {Platform.OS === 'ios' && show ? (
        <Modal transparent animationType="slide" onRequestClose={handleDone}>
          <Pressable style={s.overlay} onPress={handleDone}>
            <View style={s.pickerSheet}>
              <View style={s.pickerHeader}>
                <TouchableOpacity onPress={() => setShow(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleDone}><Text style={s.doneText}>DONE</Text></TouchableOpacity>
              </View>
              <DateTimePicker value={currentDate} mode="date" display="spinner" onChange={handleChange} minimumDate={minDate} textColor={Colors.textPrimary} themeVariant="dark" />
            </View>
          </Pressable>
        </Modal>
      ) : null}

      {/* Android: inline picker */}
      {Platform.OS === 'android' && show ? (
        <DateTimePicker value={currentDate} mode="date" display="default" onChange={handleChange} minimumDate={minDate} />
      ) : null}

      {/* Web fallback: native input */}
      {Platform.OS === 'web' && show ? (
        <Modal transparent animationType="fade" onRequestClose={() => setShow(false)}>
          <Pressable style={s.overlay} onPress={() => setShow(false)}>
            <View style={s.webPickerWrap}>
              <Text style={s.webPickerLabel}>Select Date</Text>
              <input
                type="date"
                value={value}
                min={minDate ? minDate.toISOString().split('T')[0] : undefined}
                onChange={(e) => { onChange(e.target.value); setShow(false); }}
                style={{ fontSize: 18, padding: 12, backgroundColor: Colors.surfaceInput, color: Colors.white, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, width: '100%' }}
              />
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.textTertiary, marginBottom: 6 },
  field: { flexDirection: 'row', alignItems: 'center', height: ControlHeight.md, backgroundColor: Colors.surfaceInput, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.borderDefault, paddingHorizontal: 12, gap: 8 },
  fieldError: { borderColor: Colors.red },
  fieldText: { flex: 1, fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textPrimary },
  placeholder: { color: Colors.textDisabled },
  error: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.red, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: Colors.surfaceRaised, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 20 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  cancelText: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textTertiary },
  doneText: { fontFamily: FontFamily.sairaSemiBold, fontSize: 15, color: Colors.cyan },
  webPickerWrap: { backgroundColor: Colors.surfaceRaised, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  webPickerLabel: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
});
