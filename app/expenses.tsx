// GigOS Expenses — Track costs against gigs
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  TextInput, Pressable, Alert, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getExpenses, createExpense, deleteExpense, getGigs, type Expense, type Gig } from '@/src/services/supabaseData';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { CurrencyText, SectionLabel } from '@/src/components';
import { MaterialIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const CATEGORIES: { key: string; label: string; icon: IconName; color: string }[] = [
  { key: 'travel',        label: 'Travel',        icon: 'directions-car',  color: Colors.cyan },
  { key: 'accommodation', label: 'Stay',           icon: 'hotel',           color: Colors.violet },
  { key: 'equipment',     label: 'Equipment',      icon: 'speaker',         color: Colors.amber },
  { key: 'studio',        label: 'Studio',         icon: 'mic',             color: Colors.green },
  { key: 'marketing',     label: 'Marketing',      icon: 'trending-up',     color: Colors.red },
  { key: 'food',          label: 'Food & Drink',   icon: 'restaurant',      color: '#F97316' },
  { key: 'other',         label: 'Other',          icon: 'receipt',         color: Colors.slate },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));
const MONTHS_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(iso: string) {
  try { return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
  catch { return iso; }
}

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  // Add form state
  const [addAmount, setAddAmount] = useState('');
  const [addCategory, setAddCategory] = useState('travel');
  const [addDesc, setAddDesc] = useState('');
  const [addDate, setAddDate] = useState(todayISO());
  const [addGigId, setAddGigId] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  const load = useCallback(async () => {
    try {
      const [data, gigData] = await Promise.all([getExpenses(), getGigs()]);
      setExpenses(data);
      setGigs(gigData);
      setError('');
    } catch {
      setError('Could not load expenses. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const gigMap = useMemo(() => Object.fromEntries(gigs.map(g => [g.id, g.event_name])), [gigs]);

  // ── Computed stats ──
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisYear = expenses.filter(e => new Date(e.date).getFullYear() === now.getFullYear());
    const totalMonth = thisMonth.reduce((s, e) => s + e.amount, 0);
    const totalYear = thisYear.reduce((s, e) => s + e.amount, 0);
    const totalAll = expenses.reduce((s, e) => s + e.amount, 0);

    // Category breakdown (all time)
    const catMap: Record<string, number> = {};
    expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
    const catBreakdown = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([key, total]) => ({ key, total, cat: CAT_MAP[key] || CAT_MAP.other }));
    const maxCat = Math.max(...catBreakdown.map(c => c.total), 1);

    return { totalMonth, totalYear, totalAll, catBreakdown, maxCat };
  }, [expenses]);

  // ── Group by month ──
  const grouped = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    expenses.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      (map[key] = map[key] || []).push(e);
    });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => {
        const [yr, mo] = key.split('-').map(Number);
        return {
          title: `${MONTHS_LABELS[mo]} ${yr}`,
          total: items.reduce((s, e) => s + e.amount, 0),
          items,
        };
      });
  }, [expenses]);

  const handleAdd = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      setAddError('Enter a valid amount.');
      return;
    }
    setAddError('');
    setAddSaving(true);
    try {
      const created = await createExpense({
        amount: parseFloat(addAmount),
        category: addCategory,
        description: addDesc.trim() || null,
        date: addDate,
        gig_id: addGigId,
      });
      setExpenses(prev => [created, ...prev]);
      setShowAdd(false);
      setAddAmount(''); setAddDesc(''); setAddCategory('travel'); setAddDate(todayISO()); setAddGigId(null);
    } catch {
      setAddError('Failed to save. Try again.');
    }
    setAddSaving(false);
  };

  const handleDelete = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Remove ${CAT_MAP[expense.category]?.label || 'expense'} of ₹${expense.amount.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteExpense(expense.id).catch(() => {});
            setExpenses(prev => prev.filter(e => e.id !== expense.id));
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={28} color={Colors.cyan} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Expenses</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <MaterialIcons name="add" size={22} color={Colors.cyan} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cyan} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {error ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="wifi-off" size={16} color={Colors.amber} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}><ActivityIndicator color={Colors.cyan} size="large" /></View>
        ) : (
          <>
            {/* ── Summary tiles ── */}
            <View style={styles.tilesRow}>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>THIS MONTH</Text>
                <CurrencyText amount={stats.totalMonth} currency="INR" fontSize={20} color={Colors.red} />
              </View>
              <View style={styles.tile}>
                <Text style={styles.tileLabel}>THIS YEAR</Text>
                <CurrencyText amount={stats.totalYear} currency="INR" fontSize={20} color={Colors.amber} />
              </View>
            </View>

            {/* ── Category breakdown ── */}
            {stats.catBreakdown.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>BY CATEGORY</Text>
                {stats.catBreakdown.map(c => (
                  <View key={c.key} style={styles.catRow}>
                    <MaterialIcons name={c.cat.icon} size={16} color={c.cat.color} style={{ width: 22 }} />
                    <Text style={styles.catLabel}>{c.cat.label}</Text>
                    <View style={styles.catBarBg}>
                      <View style={[styles.catBar, { width: `${(c.total / stats.maxCat) * 100}%`, backgroundColor: c.cat.color }]} />
                    </View>
                    <CurrencyText amount={c.total} currency="INR" fontSize={13} />
                  </View>
                ))}
              </View>
            ) : null}

            {/* ── Grouped expense list ── */}
            {grouped.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="receipt-long" size={48} color={Colors.surfaceCard} />
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySub}>Track travel, gear, stays — anything that costs money.</Text>
                <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>ADD FIRST EXPENSE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              grouped.map(group => (
                <View key={group.title} style={{ marginBottom: 8 }}>
                  <View style={styles.monthHeader}>
                    <Text style={styles.monthTitle}>{group.title}</Text>
                    <CurrencyText amount={group.total} currency="INR" fontSize={13} color={Colors.textSecondary} />
                  </View>
                  <View style={styles.expensesList}>
                    {group.items.map(exp => {
                      const cat = CAT_MAP[exp.category] || CAT_MAP.other;
                      return (
                        <TouchableOpacity
                          key={exp.id}
                          style={styles.expRow}
                          onLongPress={() => handleDelete(exp)}
                          delayLongPress={400}
                        >
                          <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
                            <MaterialIcons name={cat.icon} size={16} color={cat.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.expDesc} numberOfLines={1}>
                              {exp.description || cat.label}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <Text style={styles.expDate}>{formatDisplayDate(exp.date)}</Text>
                              {exp.gig_id && gigMap[exp.gig_id] ? (
                                <View style={styles.gigTag}>
                                  <Text style={styles.gigTagText} numberOfLines={1}>{gigMap[exp.gig_id]}</Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                          <CurrencyText amount={exp.amount} currency="INR" fontSize={15} color={Colors.red} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))
            )}

            {grouped.length > 0 ? (
              <Text style={styles.swipeHint}>Long-press an expense to delete it</Text>
            ) : null}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>

      {/* ── Add Expense Modal ── */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowAdd(false)}>
            <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]} onPress={() => {}}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Add Expense</Text>

              {/* Amount */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>AMOUNT (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addAmount}
                  onChangeText={setAddAmount}
                  keyboardType="numeric"
                  placeholder="2500"
                  placeholderTextColor={Colors.textDisabled}
                  autoFocus
                />
              </View>

              {/* Description */}
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>DESCRIPTION (optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addDesc}
                  onChangeText={setAddDesc}
                  placeholder="Ola to venue, cables, hotel..."
                  placeholderTextColor={Colors.textDisabled}
                />
              </View>

              {/* Category chips */}
              <Text style={[styles.modalFieldLabel, { marginBottom: 8 }]}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChips}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => setAddCategory(c.key)}
                    style={[styles.catChip, addCategory === c.key && { backgroundColor: c.color + '22', borderColor: c.color }]}
                  >
                    <MaterialIcons name={c.icon} size={13} color={addCategory === c.key ? c.color : Colors.textTertiary} />
                    <Text style={[styles.catChipText, addCategory === c.key && { color: c.color }]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Gig link */}
              {gigs.length > 0 ? (
                <>
                  <Text style={[styles.modalFieldLabel, { marginBottom: 8, marginTop: 4 }]}>LINK TO GIG (optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.catChips, { marginBottom: 16 }]}>
                    <TouchableOpacity
                      onPress={() => setAddGigId(null)}
                      style={[styles.catChip, addGigId === null && { backgroundColor: 'rgba(24,200,230,0.12)', borderColor: Colors.cyan }]}
                    >
                      <Text style={[styles.catChipText, addGigId === null && { color: Colors.cyan }]}>No gig</Text>
                    </TouchableOpacity>
                    {gigs.slice(0, 12).map(g => (
                      <TouchableOpacity
                        key={g.id}
                        onPress={() => setAddGigId(g.id)}
                        style={[styles.catChip, addGigId === g.id && { backgroundColor: 'rgba(24,200,230,0.12)', borderColor: Colors.cyan }]}
                      >
                        <Text style={[styles.catChipText, addGigId === g.id && { color: Colors.cyan }]} numberOfLines={1}>{g.event_name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : null}

              {addError ? <Text style={styles.addErrorText}>{addError}</Text> : null}

              <TouchableOpacity
                style={[styles.addConfirmBtn, addSaving && { opacity: 0.6 }]}
                onPress={handleAdd}
                disabled={addSaving}
              >
                {addSaving
                  ? <ActivityIndicator color={Colors.textOnAccent} size="small" />
                  : <Text style={styles.addConfirmText}>SAVE EXPENSE</Text>
                }
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenGutter, paddingVertical: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
  addBtn: { width: 28, alignItems: 'center' },
  scroll: { paddingHorizontal: Layout.screenGutter, paddingTop: 16 },
  loadingWrap: { paddingTop: 80, alignItems: 'center' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: Colors.amberDim, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.amber, marginBottom: 16 },
  errorText: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.amber, flex: 1 },
  // Tiles
  tilesRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  tile: { flex: 1, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, padding: 14, gap: 4 },
  tileLabel: { fontFamily: FontFamily.monoMedium, fontSize: 9, letterSpacing: 1.4, color: Colors.textTertiary, textTransform: 'uppercase' },
  // Card
  card: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderDefault, padding: 16, marginBottom: 12 },
  cardTitle: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, color: Colors.textTertiary, textTransform: 'uppercase', marginBottom: 14 },
  // Category breakdown
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  catLabel: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textSecondary, width: 80 },
  catBarBg: { flex: 1, height: 6, backgroundColor: Colors.surfaceInput, borderRadius: 3, overflow: 'hidden' },
  catBar: { height: 6, borderRadius: 3 },
  // Month headers
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  monthTitle: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1.4, color: Colors.textTertiary, textTransform: 'uppercase' },
  // Expense rows
  expensesList: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderDefault, overflow: 'hidden' },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  catIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  expDesc: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textPrimary },
  expDate: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textTertiary },
  gigTag: { backgroundColor: 'rgba(24,200,230,0.10)', borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 1, maxWidth: 120 },
  gigTagText: { fontFamily: FontFamily.plexRegular, fontSize: 10, color: Colors.cyan },
  swipeHint: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textDisabled, textAlign: 'center', marginTop: 8 },
  // Empty state
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontFamily: FontFamily.sairaBold, fontSize: 20, color: Colors.textPrimary },
  emptySub: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, paddingHorizontal: 20, paddingVertical: 12, marginTop: 12 },
  emptyBtnText: { fontFamily: FontFamily.sairaBold, fontSize: 13, color: Colors.cyan },
  // Add Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.surfaceRaised, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHandle: { width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.graphite500, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: FontFamily.sairaBold, fontSize: 20, color: Colors.textPrimary, marginBottom: 16 },
  modalField: { marginBottom: 14 },
  modalFieldLabel: { fontFamily: FontFamily.monoMedium, fontSize: 9, letterSpacing: 1.4, color: Colors.textTertiary, textTransform: 'uppercase', marginBottom: 6 },
  modalInput: { backgroundColor: Colors.surfaceInput, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.borderDefault, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textPrimary },
  catChips: { gap: 8, paddingBottom: 16 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Colors.surfaceInput, borderWidth: 1, borderColor: Colors.borderDefault },
  catChipText: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textTertiary },
  addErrorText: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.red, marginBottom: 8 },
  addConfirmBtn: { backgroundColor: Colors.cyan, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  addConfirmText: { fontFamily: FontFamily.sairaBold, fontSize: 14, color: Colors.textOnAccent, letterSpacing: 0.5 },
});
