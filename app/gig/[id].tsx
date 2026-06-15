// GigOS Gig Detail — Editable statuses + inline editing + invoice + documents
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Modal,
  Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  getGig, updateGig, deleteGig, getDJProfile,
  getGigsOnDate, getGigDocuments, uploadGigDocument, deleteGigDocument, getGigDocumentUrl,
  getExpensesByGig, createExpense,
  type Gig, type GigDocument, type Expense,
} from '@/src/services/supabaseData';
import { Colors, StatusColors, StatusKey } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { StatusBadge, CurrencyText, SectionLabel, PrimaryButton, SegmentedControl, Meter } from '@/src/components';
import { DateField } from '@/src/components/DateField';
import { MaterialIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];
const EXP_CATS: { key: string; label: string; icon: IconName; color: string }[] = [
  { key: 'travel', label: 'Travel', icon: 'directions-car', color: Colors.cyan },
  { key: 'accommodation', label: 'Stay', icon: 'hotel', color: '#8B5CF6' },
  { key: 'equipment', label: 'Equipment', icon: 'speaker', color: Colors.amber },
  { key: 'studio', label: 'Studio', icon: 'mic', color: Colors.green },
  { key: 'marketing', label: 'Marketing', icon: 'trending-up', color: Colors.red },
  { key: 'food', label: 'Food', icon: 'restaurant', color: '#F97316' },
  { key: 'other', label: 'Other', icon: 'receipt', color: Colors.slate },
];
const EXP_CAT_MAP = Object.fromEntries(EXP_CATS.map(c => [c.key, c]));

const STAGES = [
  { key: 'enquiry',          label: 'Enquiry',     desc: 'Unconfirmed, awaiting reply' },
  { key: 'confirmed',        label: 'Confirmed',   desc: 'Booking confirmed, advance pending' },
  { key: 'advance_received', label: 'Advance In',  desc: 'Advance received, gig upcoming' },
  { key: 'done',             label: 'Done',        desc: 'Gig completed, balance pending' },
  { key: 'paid',             label: 'Paid',        desc: 'Fully settled' },
].map(s => ({ ...s, color: StatusColors[s.key as StatusKey]?.fg ?? Colors.textTertiary }));

const ADV_LABELS   = ['Not Requested', 'Requested', 'Received', 'Waived'];
const ADV_MAP: Record<string, string>     = { 'Not Requested': 'not_requested', Requested: 'requested', Received: 'received', Waived: 'waived' };
const ADV_REVERSE: Record<string, string> = { not_requested: 'Not Requested', requested: 'Requested', received: 'Received', waived: 'Waived' };

function formatDetailDate(d: string) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Safely schedule notifications without crashing if expo-notifications isn't installed
async function tryScheduleNotifications(gig: Gig) {
  try {
    // Dynamic require keeps expo-notifications out of the module-level import graph
    // until the user has installed it
    const ns = require('@/src/services/notificationService');
    await ns.scheduleGigNotifications(gig);
  } catch { /* expo-notifications not installed yet */ }
}

async function tryCancelNotifications(gigId: string) {
  try {
    const ns = require('@/src/services/notificationService');
    await ns.cancelGigNotifications(gigId);
  } catch {}
}

export default function GigDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [gig, setGig] = useState<Gig | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [stageSheet, setStageSheet] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [conflictWarning, setConflictWarning] = useState('');
  // Documents
  const [docs, setDocs] = useState<GigDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  // Expenses
  const [gigExpenses, setGigExpenses] = useState<Expense[]>([]);
  const [showExpModal, setShowExpModal] = useState(false);
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('travel');
  const [expSaving, setExpSaving] = useState(false);
  const [expError, setExpError] = useState('');

  const loadDocs = useCallback(async (gigId: string) => {
    setLoadingDocs(true);
    const d = await getGigDocuments(gigId).catch(() => []);
    setDocs(d);
    setLoadingDocs(false);
  }, []);

  useEffect(() => {
    if (id) {
      Promise.all([getGig(id), getDJProfile()]).then(([g, p]) => {
        setGig(g);
        if (p) setCurrency(p.currency);
        if (g) {
          loadDocs(g.id);
          getExpensesByGig(g.id).then(setGigExpenses).catch(() => {});
          tryScheduleNotifications(g); // ensure reminders are set
        }
      });
    }
  }, [id, loadDocs]);

  if (!gig) return <View style={[s.container, { paddingTop: insets.top }]} />;

  const balance = (gig.fee || 0) - (gig.advance_amount || 0);

  // Optimistic save: update local state immediately, sync to server in bg
  const saveField = async (field: string, value: any) => {
    const prev = { ...gig };
    setGig(g => g ? { ...g, [field]: value } : g);
    setSaveStatus('saving');
    try {
      const updated = await updateGig(gig.id, { [field]: value });
      setGig(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1800);
      // Reschedule notifications when key fields change
      if (['date', 'event_name', 'venue_name', 'balance_status'].includes(field)) {
        tryScheduleNotifications(updated);
      }
    } catch {
      setGig(prev);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const saveFields = async (updates: Partial<Gig>) => {
    const prev = { ...gig };
    setGig(g => g ? { ...g, ...updates } : g);
    setSaveStatus('saving');
    try {
      const updated = await updateGig(gig.id, updates);
      setGig(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1800);
      tryScheduleNotifications(updated);
    } catch {
      setGig(prev);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const startEdit = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue || '');
  };

  const commitEdit = (field?: string, parseAs?: 'int') => {
    const f = field || editField;
    if (!f) return;
    const raw = editValue.trim();
    const value = parseAs === 'int' ? (parseInt(raw) || null) : (raw || null);
    setEditField(null);
    saveField(f, value);
  };

  const handleDateChange = async (d: string) => {
    saveField('date', d);
    // Check for conflicts
    try {
      const conflicts = await getGigsOnDate(d, gig.id);
      if (conflicts.length > 0) {
        setConflictWarning(`⚠️ You already have "${conflicts[0].event_name}" on this date.`);
      } else {
        setConflictWarning('');
      }
    } catch { setConflictWarning(''); }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Gig',
      `Are you sure you want to delete "${gig.event_name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await tryCancelNotifications(gig.id);
            await deleteGig(gig.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleAdvanceStatusChange = (label: string) => {
    const newStatus = ADV_MAP[label];
    saveField('advance_status', newStatus);
    // If marking as requested and no amount set yet, auto-open the amount field
    if (newStatus === 'requested' && !gig.advance_amount) {
      setTimeout(() => startEdit('advance_amount', ''), 350);
    }
  };

  const handleStageChange = (stageKey: string) => {
    setStageSheet(false);
    if (stageKey === gig.pipeline_status) return;

    const updates: Partial<Gig> = { pipeline_status: stageKey };

    // Moving to Advance In → mark advance received
    if (stageKey === 'advance_received') {
      if (gig.advance_status !== 'received' && gig.advance_status !== 'waived') {
        updates.advance_status = 'received';
      }
    }

    // Moving to Paid → settle all payment fields
    if (stageKey === 'paid') {
      updates.balance_status = 'received';
      if (gig.advance_status === 'requested' || gig.advance_status === 'not_requested') {
        updates.advance_status = 'received';
      }
    }

    saveFields(updates);

    // If moved to advance_received with no amount, prompt for it after save animates
    if (stageKey === 'advance_received' && !gig.advance_amount) {
      setTimeout(() => startEdit('advance_amount', ''), 500);
    }
  };

  const openWhatsApp = () => {
    const phone = gig.promoter_phone?.replace(/\s/g, '').replace('+', '');
    if (!phone) {
      Alert.alert('No phone number', 'Add a promoter phone number first — tap the PHONE field above to add it.');
      return;
    }
    const msg = encodeURIComponent(`Hey ${gig.promoter_name || ''}, just checking in on the advance for ${gig.event_name} on ${formatDetailDate(gig.date)}. Can you confirm when it'll come through? Thanks 🙏`);
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
  };

  // ── Documents ──
  const pickDocument = async () => {
    try {
      const DocumentPicker = require('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];
      setUploadingDoc(true);
      const doc = await uploadGigDocument(gig.id, file.uri, file.name, file.mimeType, file.size);
      setDocs(prev => [doc, ...prev]);
    } catch (err: any) {
      if (err?.message?.includes('Cannot find module')) {
        Alert.alert('Package required', 'Run in your frontend/ directory:\n\nnpx expo install expo-document-picker\n\nThen restart the app.', [{ text: 'OK' }]);
      } else if (err?.message?.includes('gig-documents')) {
        Alert.alert('Storage not configured', 'Create a "gig-documents" storage bucket in your Supabase dashboard first.', [{ text: 'OK' }]);
      } else {
        Alert.alert('Upload failed', 'Could not upload the file. Please try again.');
      }
    }
    setUploadingDoc(false);
  };

  const openDocument = async (doc: GigDocument) => {
    const url = await getGigDocumentUrl(doc.storage_path);
    if (url) Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open file.'));
    else Alert.alert('Error', 'Could not get file URL.');
  };

  const confirmDeleteDoc = (doc: GigDocument) => {
    Alert.alert('Remove Attachment', `Remove "${doc.file_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await deleteGigDocument(doc.id, doc.storage_path).catch(() => {});
          setDocs(prev => prev.filter(d => d.id !== doc.id));
        },
      },
    ]);
  };

  const handleAddExpense = async () => {
    if (!expAmount || parseFloat(expAmount) <= 0) { setExpError('Enter a valid amount.'); return; }
    setExpError(''); setExpSaving(true);
    try {
      const created = await createExpense({ amount: parseFloat(expAmount), category: expCategory, description: expDesc.trim() || null, date: new Date().toISOString().split('T')[0], gig_id: gig.id });
      setGigExpenses(prev => [created, ...prev]);
      setShowExpModal(false); setExpAmount(''); setExpDesc(''); setExpCategory('travel');
    } catch { setExpError('Failed to save.'); }
    setExpSaving(false);
  };

  const statusIcon  = saveStatus === 'saving' ? '···' : saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'error' ? 'Failed ✗' : null;
  const statusColor = saveStatus === 'error' ? Colors.red : Colors.green;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <View style={[s.container, { paddingTop: insets.top }]}>

        {/* ── Nav ── */}
        <View style={s.nav}>
          <TouchableOpacity testID="back-btn" onPress={() => router.back()}>
            <MaterialIcons name="chevron-left" size={28} color={Colors.cyan} />
          </TouchableOpacity>
          <Text style={s.navTitle} numberOfLines={1}>{gig.event_name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {statusIcon ? <Text style={[s.savedText, { color: statusColor }]}>{statusIcon}</Text> : null}
            <TouchableOpacity onPress={() => router.push(`/invoice/${gig.id}` as any)}>
              <MaterialIcons name="receipt" size={21} color={Colors.cyan} />
            </TouchableOpacity>
            <TouchableOpacity testID="delete-gig-btn" onPress={confirmDelete}>
              <MaterialIcons name="delete-outline" size={22} color={Colors.red} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Hero ── */}
          <View style={s.hero}>
            <Text style={s.heroVenue}>{gig.venue_name}{gig.venue_city ? `, ${gig.venue_city}` : ''}</Text>
            <EditableText value={gig.event_name} field="event_name" style={s.heroName} editField={editField} editValue={editValue} setEditValue={setEditValue} startEdit={startEdit} commitEdit={commitEdit} />
            <View style={s.heroRow}>
              <TouchableOpacity testID="change-pipeline-status" onPress={() => setStageSheet(true)}>
                <StatusBadge status={gig.pipeline_status as StatusKey} />
              </TouchableOpacity>
              <View style={s.typePill}><Text style={s.typeText}>{gig.gig_type.replace(/_/g, ' ').toUpperCase()}</Text></View>
            </View>
          </View>

          {/* ── Advance Status ── */}
          <View style={s.advanceSection}>
            <SectionLabel>ADVANCE STATUS</SectionLabel>
            <SegmentedControl
              options={ADV_LABELS}
              value={ADV_REVERSE[gig.advance_status] || 'Not Requested'}
              onChange={handleAdvanceStatusChange}
            />
            {(gig.advance_status === 'requested' || gig.advance_status === 'not_requested') && gig.pipeline_status !== 'paid' ? (
              <PrimaryButton title="💬 Chase on WhatsApp" onPress={openWhatsApp} variant="whatsapp" style={{ marginTop: 12 }} />
            ) : null}
          </View>

          {/* ── Detail Fields ── */}
          <View style={s.fields}>
            <EditableRow
              icon="event" label="DATE"
              displayValue={formatDetailDate(gig.date)}
              onPress={() => {}}
              isDate dateValue={gig.date}
              onDateChange={handleDateChange}
            />
            {conflictWarning ? (
              <View style={s.conflictBanner}>
                <MaterialIcons name="warning" size={14} color={Colors.amber} />
                <Text style={s.conflictText}>{conflictWarning}</Text>
              </View>
            ) : null}
            <EditableRow icon="person" label="PROMOTER" displayValue={gig.promoter_name || '—'} onPress={() => startEdit('promoter_name', gig.promoter_name || '')} editField={editField} editValue={editValue} setEditValue={setEditValue} commitEdit={() => commitEdit('promoter_name')} field="promoter_name" tappableAction={gig.promoter_phone ? openWhatsApp : undefined} />
            <EditableRow
              icon="phone" label="PHONE"
              displayValue={gig.promoter_phone || '—'}
              hint={!gig.promoter_phone ? 'Add with country code e.g. +91 98765 43210' : undefined}
              onPress={() => startEdit('promoter_phone', gig.promoter_phone || '')}
              editField={editField} editValue={editValue} setEditValue={setEditValue}
              commitEdit={() => commitEdit('promoter_phone')}
              field="promoter_phone" keyboardType="phone-pad"
            />
            <EditableRow
              icon="payments" label="FEE"
              displayComponent={<CurrencyText amount={gig.fee} currency={currency} fontSize={17} />}
              onPress={() => startEdit('fee', gig.fee?.toString() || '')}
              editField={editField} editValue={editValue} setEditValue={setEditValue}
              commitEdit={() => commitEdit('fee', 'int')}
              field="fee" keyboardType="numeric"
            />
            <EditableRow
              icon="arrow-upward" label="ADVANCE"
              displayComponent={<CurrencyText amount={gig.advance_amount} currency={currency} fontSize={15} />}
              onPress={() => startEdit('advance_amount', gig.advance_amount?.toString() || '')}
              editField={editField} editValue={editValue} setEditValue={setEditValue}
              commitEdit={() => commitEdit('advance_amount', 'int')}
              field="advance_amount" keyboardType="numeric"
            />
            <View style={s.detailRow}>
              <MaterialIcons name="arrow-downward" size={18} color={Colors.textTertiary} />
              <Text style={s.detailLabel}>BALANCE</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <CurrencyText amount={balance} currency={currency} fontSize={15} color={gig.balance_status === 'received' ? Colors.green : Colors.amber} />
              </View>
            </View>
            {gig.fee && gig.pipeline_status !== 'enquiry' ? (
              <Meter
                value={gig.balance_status === 'received' ? 1 : gig.advance_status === 'received' ? (gig.advance_amount || 0) / gig.fee : 0}
                tone={gig.balance_status === 'received' ? 'green' : gig.advance_status === 'received' ? 'cyan' : 'amber'}
                label="PAYMENT PROGRESS"
                valueLabel={gig.balance_status === 'received' ? 'FULLY PAID' : gig.advance_status === 'received' ? `ADV ${Math.round(((gig.advance_amount || 0) / gig.fee) * 100)}%` : 'PENDING'}
                style={{ marginTop: 8, marginHorizontal: 20, marginBottom: 4 }}
              />
            ) : null}
            <EditableRow icon="place" label="VENUE" displayValue={gig.venue_name || '—'} onPress={() => startEdit('venue_name', gig.venue_name || '')} editField={editField} editValue={editValue} setEditValue={setEditValue} commitEdit={() => commitEdit('venue_name')} field="venue_name" />
          </View>

          {/* ── Rider & Logistics ── */}
          {(gig.rider_notes || gig.sound_engineer || gig.travel_notes) ? (
            <View style={s.riderSection}>
              <SectionLabel>RIDER & LOGISTICS</SectionLabel>
              <View style={s.riderCard}>
                {gig.rider_notes    ? <Text style={s.riderItem}>• {gig.rider_notes}</Text>    : null}
                {gig.sound_engineer ? <Text style={s.riderItem}>• Sound: {gig.sound_engineer}</Text> : null}
                {gig.travel_notes   ? <Text style={s.riderItem}>• {gig.travel_notes}</Text>   : null}
              </View>
            </View>
          ) : null}

          {/* ── Expenses ── */}
          <View style={s.riderSection}>
            <View style={s.docSectionHeader}>
              <SectionLabel>EXPENSES</SectionLabel>
              <TouchableOpacity onPress={() => setShowExpModal(true)} style={s.attachBtn}>
                <MaterialIcons name="add" size={16} color={Colors.cyan} />
                <Text style={s.attachBtnText}>ADD</Text>
              </TouchableOpacity>
            </View>
            {gigExpenses.length === 0 ? (
              <Text style={s.docEmpty}>No expenses linked to this gig.</Text>
            ) : (
              <View style={s.docList}>
                {gigExpenses.map(exp => {
                  const cat = EXP_CAT_MAP[exp.category] || EXP_CAT_MAP.other;
                  return (
                    <View key={exp.id} style={[s.docRow, { gap: 10 }]}>
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: cat.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcons name={cat.icon} size={14} color={cat.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.docName} numberOfLines={1}>{exp.description || cat.label}</Text>
                        <Text style={s.docMeta}>{cat.label}</Text>
                      </View>
                      <CurrencyText amount={exp.amount} currency={currency} fontSize={14} color={Colors.red} />
                    </View>
                  );
                })}
                <View style={[s.docRow, { borderBottomWidth: 0, justifyContent: 'space-between' }]}>
                  <Text style={[s.docMeta, { fontFamily: FontFamily.monoMedium, letterSpacing: 0.8 }]}>TOTAL</Text>
                  <CurrencyText amount={gigExpenses.reduce((sum, e) => sum + e.amount, 0)} currency={currency} fontSize={14} color={Colors.amber} />
                </View>
              </View>
            )}
          </View>

          {/* ── Documents / Attachments ── */}
          <View style={s.riderSection}>
            <View style={s.docSectionHeader}>
              <SectionLabel>ATTACHMENTS</SectionLabel>
              <TouchableOpacity onPress={pickDocument} disabled={uploadingDoc} style={s.attachBtn}>
                {uploadingDoc
                  ? <ActivityIndicator size="small" color={Colors.cyan} />
                  : <><MaterialIcons name="attach-file" size={16} color={Colors.cyan} /><Text style={s.attachBtnText}>ADD</Text></>
                }
              </TouchableOpacity>
            </View>
            {loadingDocs ? (
              <ActivityIndicator color={Colors.cyan} style={{ marginVertical: 8 }} />
            ) : docs.length === 0 ? (
              <Text style={s.docEmpty}>No attachments — upload contracts, riders, or setlists.</Text>
            ) : (
              <View style={s.docList}>
                {docs.map(doc => (
                  <View key={doc.id} style={s.docRow}>
                    <MaterialIcons name="insert-drive-file" size={18} color={Colors.textTertiary} />
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => openDocument(doc)}>
                      <Text style={s.docName} numberOfLines={1}>{doc.file_name}</Text>
                      {doc.file_size ? <Text style={s.docMeta}>{formatFileSize(doc.file_size)}</Text> : null}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDeleteDoc(doc)}>
                      <MaterialIcons name="close" size={18} color={Colors.textDisabled} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── Bottom Bar: Balance Received — hidden for enquiries ── */}
        {gig.pipeline_status !== 'enquiry' ? (
          <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
            {gig.balance_status === 'received' || gig.pipeline_status === 'paid' ? (
              <View style={s.receivedBar}>
                <MaterialIcons name="check-circle" size={18} color={Colors.green} />
                <Text style={s.receivedText}>Balance Received ✓</Text>
              </View>
            ) : (
              <PrimaryButton
                title="Mark Balance Received"
                onPress={() => {
                  const updates: Partial<Gig> = { balance_status: 'received' };
                  if (gig.pipeline_status === 'done') updates.pipeline_status = 'paid';
                  if (gig.advance_status === 'requested') updates.advance_status = 'received';
                  saveFields(updates);
                }}
                variant="primary"
                style={{ flex: 1 }}
              />
            )}
          </View>
        ) : null}

        {/* ── Add Expense Modal ── */}
        <Modal visible={showExpModal} transparent animationType="slide" onRequestClose={() => setShowExpModal(false)}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={s.sheetOverlay} onPress={() => setShowExpModal(false)}>
              <Pressable style={[s.sheet, { paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }]} onPress={() => {}}>
                <View style={s.sheetHandle} />
                <Text style={s.sheetTitle}>Add Expense</Text>
                <Text style={[s.detailLabel, { marginBottom: 6 }]}>AMOUNT ({currency === 'USD' ? '$' : '₹'})</Text>
                <TextInput
                  style={s.expInput}
                  value={expAmount}
                  onChangeText={setExpAmount}
                  keyboardType="numeric"
                  placeholder="2500"
                  placeholderTextColor={Colors.textDisabled}
                  autoFocus
                />
                <Text style={[s.detailLabel, { marginBottom: 6, marginTop: 14 }]}>DESCRIPTION (optional)</Text>
                <TextInput
                  style={s.expInput}
                  value={expDesc}
                  onChangeText={setExpDesc}
                  placeholder="Ola, cables, hotel..."
                  placeholderTextColor={Colors.textDisabled}
                />
                <Text style={[s.detailLabel, { marginBottom: 8, marginTop: 14 }]}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
                  {EXP_CATS.map(c => (
                    <TouchableOpacity
                      key={c.key}
                      onPress={() => setExpCategory(c.key)}
                      style={[s.expCatChip, expCategory === c.key && { backgroundColor: c.color + '22', borderColor: c.color }]}
                    >
                      <MaterialIcons name={c.icon} size={13} color={expCategory === c.key ? c.color : Colors.textTertiary} />
                      <Text style={[s.expCatText, expCategory === c.key && { color: c.color }]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {expError ? <Text style={{ fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.red, marginBottom: 8 }}>{expError}</Text> : null}
                <TouchableOpacity style={[s.expSaveBtn, expSaving && { opacity: 0.6 }]} onPress={handleAddExpense} disabled={expSaving}>
                  {expSaving ? <ActivityIndicator color={Colors.textOnAccent} size="small" /> : <Text style={s.expSaveBtnText}>SAVE EXPENSE</Text>}
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        {/* ── Stage Picker Sheet ── */}
        <Modal visible={stageSheet} transparent animationType="slide" onRequestClose={() => setStageSheet(false)}>
          <Pressable style={s.sheetOverlay} onPress={() => setStageSheet(false)}>
            <Pressable style={[s.sheet, { paddingBottom: insets.bottom + 20 }]} onPress={() => {}}>
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>Move to Stage</Text>
              {STAGES.map(st => (
                <TouchableOpacity key={st.key} testID={`stage-${st.key}`} onPress={() => handleStageChange(st.key)} style={s.stageRow}>
                  <View style={[s.stageDot, { backgroundColor: st.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.stageName}>{st.label}</Text>
                    <Text style={s.stageDesc}>{st.desc}</Text>
                  </View>
                  {gig.pipeline_status === st.key ? <MaterialIcons name="check" size={20} color={Colors.cyan} /> : null}
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setStageSheet(false)} style={s.cancelRow}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  );
}

// ── Helper components ──

function EditableText({ value, field, style, editField, editValue, setEditValue, startEdit, commitEdit }: any) {
  if (editField === field) {
    return (
      <TextInput
        autoFocus value={editValue} onChangeText={setEditValue}
        onBlur={commitEdit} onSubmitEditing={commitEdit}
        style={[style, { borderBottomWidth: 1, borderBottomColor: Colors.cyan }]}
      />
    );
  }
  return <TouchableOpacity onPress={() => startEdit(field, value)}><Text style={style}>{value}</Text></TouchableOpacity>;
}

function EditableRow({ icon, label, displayValue, displayComponent, onPress, field, editField, editValue, setEditValue, commitEdit, keyboardType, tappableAction, isDate, dateValue, onDateChange, hint }: any) {
  if (isDate) {
    return (
      <View style={s.detailRow}>
        <MaterialIcons name={icon} size={18} color={Colors.textTertiary} />
        <Text style={s.detailLabel}>{label}</Text>
        <View style={{ flex: 1 }}><DateField value={dateValue} onChange={onDateChange} /></View>
      </View>
    );
  }
  const isEditing = editField === field;
  return (
    <View>
      <TouchableOpacity style={s.detailRow} onPress={onPress} disabled={isEditing}>
        <MaterialIcons name={icon} size={18} color={Colors.textTertiary} />
        <Text style={s.detailLabel}>{label}</Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          {isEditing ? (
            <TextInput
              autoFocus value={editValue} onChangeText={setEditValue}
              onBlur={commitEdit} onSubmitEditing={commitEdit}
              keyboardType={keyboardType} style={s.inlineInput} returnKeyType="done"
            />
          ) : displayComponent || (
            <Text style={[s.detailValue, tappableAction && { color: Colors.cyan }]} onPress={tappableAction}>
              {displayValue}{tappableAction ? ' ↗' : ''}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      {hint && !isEditing ? <Text style={s.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenGutter, paddingVertical: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: 4 },
  savedText: { fontFamily: FontFamily.monoMedium, fontSize: 11 },
  hero: { backgroundColor: Colors.surfaceRaised, padding: 20, gap: 6 },
  heroVenue: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textSecondary },
  heroName: { fontFamily: FontFamily.sairaBold, fontSize: 24, color: Colors.textPrimary },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  typePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.pill, backgroundColor: Colors.graphite600, borderWidth: 1, borderColor: Colors.borderDefault },
  typeText: { fontFamily: FontFamily.monoMedium, fontSize: 9, letterSpacing: 1, color: Colors.textSecondary },
  advanceSection: { padding: Layout.screenGutter, gap: 8 },
  fields: { marginTop: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: 10 },
  detailLabel: { fontFamily: FontFamily.monoMedium, fontSize: 10, letterSpacing: 1, color: Colors.textTertiary, textTransform: 'uppercase', width: 80 },
  detailValue: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textPrimary, textAlign: 'right' },
  inlineInput: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textPrimary, textAlign: 'right', borderBottomWidth: 1, borderBottomColor: Colors.cyan, minWidth: 100, paddingVertical: 2 },
  fieldHint: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textDisabled, paddingHorizontal: 20, paddingBottom: 8, marginTop: -4 },
  conflictBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: Colors.amberDim },
  conflictText: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.amber, flex: 1 },
  riderSection: { paddingHorizontal: 20, marginTop: 16, gap: 8 },
  riderCard: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, padding: 14, gap: 6 },
  riderItem: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  // Documents
  docSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: Radius.pill, backgroundColor: 'rgba(24,200,230,0.10)', borderWidth: 1, borderColor: 'rgba(24,200,230,0.3)' },
  attachBtnText: { fontFamily: FontFamily.monoMedium, fontSize: 10, color: Colors.cyan, letterSpacing: 1 },
  docEmpty: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textDisabled, paddingVertical: 8 },
  docList: { backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderSubtle, overflow: 'hidden' },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  docName: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textPrimary },
  docMeta: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  // Bottom bar
  bottomBar: { backgroundColor: Colors.surfaceRaised, borderTopWidth: 1, borderTopColor: Colors.borderSubtle, paddingHorizontal: 20, paddingTop: 12, flexDirection: 'row' },
  receivedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 6, height: 48 },
  receivedText: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.green },
  // Sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surfaceRaised, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHandle: { width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.graphite500, alignSelf: 'center', marginTop: 10 },
  sheetTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary, padding: 16, paddingHorizontal: 20 },
  stageRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, gap: 12 },
  stageDot: { width: 10, height: 10, borderRadius: 5 },
  stageName: { fontFamily: FontFamily.sairaSemiBold, fontSize: 15, color: Colors.textPrimary },
  stageDesc: { fontFamily: FontFamily.plexRegular, fontSize: 13, color: Colors.textSecondary },
  cancelRow: { alignItems: 'center', paddingVertical: 16 },
  cancelText: { fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textTertiary },
  // Expense modal
  expInput: { backgroundColor: Colors.surfaceInput, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.borderDefault, paddingHorizontal: 14, paddingVertical: 12, fontFamily: FontFamily.plexRegular, fontSize: 15, color: Colors.textPrimary },
  expCatChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Colors.surfaceInput, borderWidth: 1, borderColor: Colors.borderDefault },
  expCatText: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textTertiary },
  expSaveBtn: { backgroundColor: Colors.cyan, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  expSaveBtnText: { fontFamily: FontFamily.sairaBold, fontSize: 14, color: Colors.textOnAccent, letterSpacing: 0.5 },
});
