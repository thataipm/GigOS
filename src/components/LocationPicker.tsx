import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Modal, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, ControlHeight } from '@/src/theme/spacing';

// ─── Data ────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Australia',
  'Canada', 'Germany', 'Netherlands', 'France', 'Afghanistan', 'Albania', 'Algeria', 'Andorra',
  'Angola', 'Argentina', 'Armenia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh',
  'Belarus', 'Belgium', 'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Brunei', 'Bulgaria',
  'Cambodia', 'Cameroon', 'Chile', 'China', 'Colombia', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Ecuador', 'Egypt', 'Estonia', 'Ethiopia', 'Finland', 'Georgia',
  'Ghana', 'Greece', 'Guatemala', 'Honduras', 'Hungary', 'Iceland', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Luxembourg', 'Malaysia', 'Maldives', 'Malta',
  'Mauritius', 'Mexico', 'Moldova', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Nepal', 'New Zealand', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Panama', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 'Spain',
  'Sri Lanka', 'Sweden', 'Switzerland', 'Taiwan', 'Tanzania', 'Thailand', 'Tunisia', 'Turkey',
  'Uganda', 'Ukraine', 'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zimbabwe',
];

const STATES_BY_COUNTRY: Record<string, string[]> = {
  'India': [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'West Bengal',
    // Union Territories
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
  ],
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
    'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee',
    'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
    'District of Columbia',
  ],
  'United Kingdom': [
    'England', 'Scotland', 'Wales', 'Northern Ireland',
  ],
  'Australia': [
    'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland',
    'South Australia', 'Tasmania', 'Victoria', 'Western Australia',
  ],
  'Canada': [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
    'Northwest Territories', 'Nunavut', 'Yukon',
  ],
  'United Arab Emirates': [
    'Abu Dhabi', 'Ajman', 'Dubai', 'Fujairah', 'Ras Al Khaimah', 'Sharjah', 'Umm Al Quwain',
  ],
  'Germany': [
    'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse',
    'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate',
    'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia',
  ],
  'Netherlands': [
    'Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg', 'North Brabant',
    'North Holland', 'Overijssel', 'South Holland', 'Utrecht', 'Zeeland',
  ],
  'France': [
    'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire',
    'Corsica', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandy', 'Nouvelle-Aquitaine',
    'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur',
  ],
  'South Africa': [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga',
    'North West', 'Northern Cape', 'Western Cape',
  ],
  'Brazil': [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal', 'Espírito Santo',
    'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba',
    'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul',
    'Rondônia', 'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins',
  ],
  'Pakistan': [
    'Azad Kashmir', 'Balochistan', 'Gilgit-Baltistan', 'Islamabad Capital Territory',
    'Khyber Pakhtunkhwa', 'Punjab', 'Sindh',
  ],
  'Sri Lanka': [
    'Central', 'Eastern', 'North Central', 'Northern', 'North Western', 'Sabaragamuwa',
    'Southern', 'Uva', 'Western',
  ],
  'Singapore': ['Singapore'],
  'Maldives': ['Malé'],
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationPickerProps {
  country: string;
  state: string;
  city: string;
  onChangeCountry: (v: string) => void;
  onChangeState: (v: string) => void;
  onChangeCity: (v: string) => void;
  label?: string;
  hideState?: boolean;
}

type PickerMode = 'country' | 'state';

// ─── Component ───────────────────────────────────────────────────────────────

export function LocationPicker({ country, state, city, onChangeCountry, onChangeState, onChangeCity, label, hideState = false }: LocationPickerProps) {
  const [modal, setModal] = useState<PickerMode | null>(null);
  const [query, setQuery] = useState('');

  const stateList = STATES_BY_COUNTRY[country] ?? null;

  const filteredCountries = useMemo(() =>
    query.trim() === '' ? COUNTRIES : COUNTRIES.filter(c => c.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  const filteredStates = useMemo(() => {
    if (!stateList) return [];
    return query.trim() === '' ? stateList : stateList.filter(s => s.toLowerCase().includes(query.toLowerCase()));
  }, [stateList, query]);

  const openModal = (mode: PickerMode) => { setQuery(''); setModal(mode); };
  const closeModal = () => setModal(null);

  return (
    <View style={{ gap: 12 }}>
      {label ? <Text style={s.sectionLabel}>{label}</Text> : null}

      {/* City — free text (too many to enumerate) */}
      <View>
        <Text style={s.label}>CITY</Text>
        <TextInput
          value={city}
          onChangeText={onChangeCity}
          placeholder="e.g. Mumbai, Berlin"
          placeholderTextColor={Colors.textDisabled}
          style={s.input}
        />
      </View>

      {/* State — picker if list available, text box otherwise; hidden when hideState=true */}
      {!hideState ? (
        <View>
          <Text style={s.label}>STATE / PROVINCE</Text>
          {stateList ? (
            <Pressable style={s.pickerRow} onPress={() => openModal('state')}>
              <Text style={[s.pickerText, !state && s.placeholder]}>
                {state || 'Select state / province'}
              </Text>
              <MaterialIcons name="expand-more" size={20} color={Colors.textTertiary} />
            </Pressable>
          ) : (
            <TextInput
              value={state}
              onChangeText={onChangeState}
              placeholder="e.g. Maharashtra, Bavaria"
              placeholderTextColor={Colors.textDisabled}
              style={s.input}
            />
          )}
        </View>
      ) : null}

      {/* Country — searchable picker */}
      <View>
        <Text style={s.label}>COUNTRY</Text>
        <Pressable style={s.pickerRow} onPress={() => openModal('country')}>
          <Text style={[s.pickerText, !country && s.placeholder]}>
            {country || 'Select country'}
          </Text>
          <MaterialIcons name="expand-more" size={20} color={Colors.textTertiary} />
        </Pressable>
      </View>

      {/* Shared search modal */}
      <Modal visible={modal !== null} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={s.overlay}>
          <SafeAreaView style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>
                {modal === 'country' ? 'Select Country' : 'Select State / Province'}
              </Text>
              <TouchableOpacity onPress={closeModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={s.searchRow}>
              <MaterialIcons name="search" size={18} color={Colors.textTertiary} style={{ marginRight: 8 }} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={modal === 'country' ? 'Search countries…' : 'Search states…'}
                placeholderTextColor={Colors.textDisabled}
                style={s.searchInput}
                autoFocus
              />
            </View>

            <FlatList
              data={modal === 'country' ? filteredCountries : filteredStates}
              keyExtractor={item => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = modal === 'country' ? item === country : item === state;
                return (
                  <TouchableOpacity
                    style={s.row}
                    onPress={() => {
                      if (modal === 'country') {
                        onChangeCountry(item);
                        // Clear state if country changed and new country has a list
                        if (item !== country) onChangeState('');
                      } else {
                        onChangeState(item);
                      }
                      closeModal();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.rowText, isSelected && s.rowSelected]}>{item}</Text>
                    {isSelected && <MaterialIcons name="check" size={18} color={Colors.cyan} />}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={s.separator} />}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  sectionLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.textTertiary },
  label:        { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.textTertiary, marginBottom: 6 },
  input: {
    height: ControlHeight.md, backgroundColor: Colors.surfaceInput, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.borderDefault, paddingHorizontal: 12,
    fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textPrimary,
  },
  pickerRow: {
    height: ControlHeight.md, backgroundColor: Colors.surfaceInput, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.borderDefault, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pickerText: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textPrimary, flex: 1 },
  placeholder: { color: Colors.textDisabled },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surfaceRaised, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  sheetTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 12, paddingHorizontal: 12, backgroundColor: Colors.surfaceInput, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.borderDefault },
  searchInput: { flex: 1, height: 40, fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textPrimary },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  rowText: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textPrimary },
  rowSelected: { color: Colors.cyan, fontFamily: FontFamily.sairaSemiBold },
  separator: { height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: 20 },
});
