// GigOS Invoice Screen — Preview + PDF export
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getGig, getDJProfile, type Gig, type DJProfile } from '@/src/services/supabaseData';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout, Radius } from '@/src/theme/spacing';
import { MaterialIcons } from '@expo/vector-icons';

function formatDate(d: string) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return d; }
}

function invoiceNumber(gig: Gig): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  return `GOS-${yr}${mo}-${gig.id.slice(-4).toUpperCase()}`;
}

/** Builds the HTML string for the invoice PDF */
function buildInvoiceHTML(gig: Gig, profile: DJProfile): string {
  const sym = profile.currency === 'USD' ? '$' : '₹';
  const fee = gig.fee || 0;
  const advance = gig.advance_amount || 0;
  const hasGST = !!profile.gstin && fee > 0;
  const gstTotal = hasGST ? Math.round(fee * 0.18) : 0;
  const cgst = Math.round(gstTotal / 2);
  const sgst = Math.round(gstTotal / 2);
  const totalFee = fee + gstTotal;
  const balance = totalFee - advance;
  const isPaid = gig.balance_status === 'received';
  const invNum = invoiceNumber(gig);
  const invDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const djSub = [
    profile.business_address,
    (profile as any).phone,
    profile.gstin ? `GSTIN: ${profile.gstin}` : null,
  ].filter(Boolean).join(' · ');

  const gstRows = hasGST ? `
    <tr class="sub"><td colspan="2">CGST @ 9%</td><td class="r">${sym}${cgst.toLocaleString('en-IN')}</td></tr>
    <tr class="sub"><td colspan="2">SGST @ 9%</td><td class="r">${sym}${sgst.toLocaleString('en-IN')}</td></tr>
  ` : '';

  const advRow = advance > 0 ? `
    <tr class="sub"><td colspan="2">Less: Advance Received</td><td class="r" style="color:#16a34a">− ${sym}${advance.toLocaleString('en-IN')}</td></tr>
  ` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#0F172A;font-size:13px;line-height:1.6;background:#fff}
  .page{max-width:800px;margin:0 auto;padding:48px}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:28px;border-bottom:2px solid #0F172A;margin-bottom:36px}
  .dj{font-size:24px;font-weight:800;letter-spacing:-0.5px}
  .dj-sub{margin-top:6px;font-size:11px;color:#64748B}
  .inv-label{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#94A3B8;text-align:right}
  .inv-num{font-size:20px;font-weight:700;text-align:right;margin-top:4px}
  .inv-date{font-size:11px;color:#64748B;text-align:right;margin-top:3px}
  .section{margin-bottom:28px}
  .lbl{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94A3B8;margin-bottom:5px}
  .bill-name{font-size:16px;font-weight:600}
  .bill-detail{font-size:12px;color:#64748B;margin-top:3px}
  table{width:100%;border-collapse:collapse}
  th{padding:10px 0;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#94A3B8;text-align:left;border-bottom:1px solid #E2E8F0}
  td{padding:14px 0;font-size:14px;color:#334155;border-bottom:1px solid #F1F5F9}
  .r{text-align:right}
  .sub td{font-size:12px;color:#64748B;padding:7px 0;border-bottom:none}
  .divider{border-top:2px solid #0F172A;margin:4px 0}
  .total-row td{padding-top:14px;font-size:18px;font-weight:700;color:#0F172A;border-bottom:none}
  .badge{display:inline-block;padding:4px 14px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase}
  .paid{background:#D1FAE5;color:#065F46}
  .pending{background:#FEF3C7;color:#92400E}
  .footer{margin-top:56px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:10px;color:#94A3B8;text-align:center;letter-spacing:1px;text-transform:uppercase}
</style></head><body>
<div class="page">
  <div class="hdr">
    <div>
      <div class="dj">${profile.name}</div>
      ${djSub ? `<div class="dj-sub">${djSub}</div>` : ''}
    </div>
    <div>
      <div class="inv-label">${profile.gstin ? 'Tax Invoice' : 'Invoice'}</div>
      <div class="inv-num">${invNum}</div>
      <div class="inv-date">${invDate}</div>
    </div>
  </div>

  <div class="section">
    <div class="lbl">Bill To</div>
    <div class="bill-name">${gig.promoter_name || 'Client'}</div>
    ${gig.promoter_phone ? `<div class="bill-detail">${gig.promoter_phone}</div>` : ''}
    ${gig.venue_name ? `<div class="bill-detail">${gig.venue_name}${gig.venue_city ? `, ${gig.venue_city}` : ''}</div>` : ''}
  </div>

  <div class="section">
    <table>
      <thead>
        <tr><th>Description</th><th>Event Date</th><th class="r">Amount</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>DJ Performance — ${gig.event_name}${gig.gig_type ? ` <span style="color:#94A3B8;font-size:11px">(${gig.gig_type.replace(/_/g, ' ')})</span>` : ''}</td>
          <td style="color:#64748B;font-size:12px">${formatDate(gig.date)}</td>
          <td class="r">${sym}${fee.toLocaleString('en-IN')}</td>
        </tr>
        ${gstRows}
        ${advRow}
        <tr><td colspan="3" style="padding:0;border:none"><div class="divider"></div></td></tr>
        <tr class="total-row">
          <td colspan="2"><span style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#64748B">Balance Due</span></td>
          <td class="r">${sym}${balance.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div>
    <span class="lbl" style="margin-right:8px">Status</span>
    <span class="badge ${isPaid ? 'paid' : 'pending'}">${isPaid ? 'Paid' : 'Payment Pending'}</span>
  </div>

  <div class="footer">Generated by GigOS &nbsp;·&nbsp; Run The Night · Know Your Money</div>
</div>
</body></html>`;
}

export default function InvoiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { gigId } = useLocalSearchParams<{ gigId: string }>();
  const [gig, setGig] = useState<Gig | null>(null);
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (gigId) {
      Promise.all([getGig(gigId), getDJProfile()]).then(([g, p]) => {
        setGig(g);
        setProfile(p);
      });
    }
  }, [gigId]);

  const handleGeneratePDF = async () => {
    if (!gig || !profile) return;
    setGenerating(true);
    try {
      // Dynamic imports — only loaded after expo-print is installed
      const Print = require('expo-print');
      const Sharing = require('expo-sharing');
      const html = buildInvoiceHTML(gig, profile);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice — ${gig.event_name}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF created', `Saved to: ${uri}`);
      }
    } catch (err: any) {
      if (err?.message?.includes('Cannot find module')) {
        Alert.alert(
          'Package required',
          'Run: npx expo install expo-print expo-sharing\n\nthen restart the app.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Could not generate PDF. Please try again.');
      }
    }
    setGenerating(false);
  };

  if (!gig || !profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.back()}><MaterialIcons name="chevron-left" size={28} color={Colors.cyan} /></TouchableOpacity>
          <Text style={styles.navTitle}>Invoice</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingWrap}><ActivityIndicator color={Colors.cyan} size="large" /></View>
      </View>
    );
  }

  const sym = profile.currency === 'USD' ? '$' : '₹';
  const fee = gig.fee || 0;
  const advance = gig.advance_amount || 0;
  const hasGST = !!profile.gstin && fee > 0;
  const gst = hasGST ? Math.round(fee * 0.18) : 0;
  const totalFee = fee + gst;
  const balance = totalFee - advance;
  const isPaid = gig.balance_status === 'received';
  const invNum = invoiceNumber(gig);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={28} color={Colors.cyan} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Invoice</Text>
        <TouchableOpacity onPress={handleGeneratePDF} disabled={generating} style={styles.shareBtn}>
          {generating
            ? <ActivityIndicator color={Colors.cyan} size="small" />
            : <MaterialIcons name="ios-share" size={22} color={Colors.cyan} />}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Invoice card preview */}
        <View style={styles.invoiceCard}>
          {/* Header */}
          <View style={styles.invHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.djName}>{profile.name}</Text>
              {profile.business_address ? <Text style={styles.djSub}>{profile.business_address}</Text> : null}
              {profile.gstin ? <Text style={styles.djSub}>GSTIN: {profile.gstin}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.invLabel}>{profile.gstin ? 'TAX INVOICE' : 'INVOICE'}</Text>
              <Text style={styles.invNum}>{invNum}</Text>
              <Text style={styles.invDate}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Bill To */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BILL TO</Text>
            <Text style={styles.billName}>{gig.promoter_name || 'Client'}</Text>
            {gig.promoter_phone ? <Text style={styles.billDetail}>{gig.promoter_phone}</Text> : null}
            {gig.venue_name ? <Text style={styles.billDetail}>{gig.venue_name}{gig.venue_city ? `, ${gig.venue_city}` : ''}</Text> : null}
          </View>

          <View style={styles.divider} />

          {/* Service Row */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SERVICES</Text>
            <View style={styles.lineRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineDesc}>DJ Performance — {gig.event_name}</Text>
                <Text style={styles.lineSubtext}>{formatDate(gig.date)}</Text>
              </View>
              <Text style={styles.lineAmt}>{sym}{fee.toLocaleString('en-IN')}</Text>
            </View>
            {hasGST ? (
              <>
                <View style={[styles.lineRow, styles.subLine]}>
                  <Text style={styles.subLineLabel}>CGST @ 9%</Text>
                  <Text style={styles.subLineAmt}>{sym}{Math.round(gst / 2).toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.lineRow, styles.subLine]}>
                  <Text style={styles.subLineLabel}>SGST @ 9%</Text>
                  <Text style={styles.subLineAmt}>{sym}{Math.round(gst / 2).toLocaleString('en-IN')}</Text>
                </View>
              </>
            ) : null}
            {advance > 0 ? (
              <View style={[styles.lineRow, styles.subLine]}>
                <Text style={styles.subLineLabel}>Less: Advance Received</Text>
                <Text style={[styles.subLineAmt, { color: Colors.green }]}>− {sym}{advance.toLocaleString('en-IN')}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.thickDivider} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{isPaid ? 'AMOUNT PAID' : 'BALANCE DUE'}</Text>
            <Text style={[styles.totalAmt, { color: isPaid ? Colors.green : Colors.amber }]}>
              {sym}{balance.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Status badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, isPaid ? styles.badgePaid : styles.badgePending]}>
              <Text style={[styles.statusBadgeText, isPaid ? styles.badgePaidText : styles.badgePendingText]}>
                {isPaid ? '✓ PAID' : 'PAYMENT PENDING'}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.invFooter}>Generated by GigOS · Run The Night · Know Your Money</Text>
        </View>

        {/* CTA warning if profile missing invoice fields */}
        {!profile.business_address && !profile.gstin ? (
          <View style={styles.tipCard}>
            <MaterialIcons name="info-outline" size={16} color={Colors.amber} />
            <Text style={styles.tipText}>
              Add your business address & GSTIN in Settings for a complete invoice.
            </Text>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <Text style={styles.tipLink}>Settings →</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity style={styles.pdfBtn} onPress={handleGeneratePDF} disabled={generating}>
          {generating
            ? <ActivityIndicator color={Colors.textOnAccent} size="small" />
            : <><MaterialIcons name="picture-as-pdf" size={20} color={Colors.textOnAccent} /><Text style={styles.pdfBtnText}>GENERATE & SHARE PDF</Text></>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Layout.screenGutter, paddingVertical: 12, backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
  shareBtn: { width: 28, alignItems: 'center' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Layout.screenGutter },
  invoiceCard: { backgroundColor: Colors.surfaceRaised, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderDefault, padding: 20, marginBottom: 16 },
  invHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  djName: { fontFamily: FontFamily.sairaBold, fontSize: 18, color: Colors.textPrimary },
  djSub: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
  invLabel: { fontFamily: FontFamily.monoMedium, fontSize: 8, letterSpacing: 2, color: Colors.textTertiary, textTransform: 'uppercase' },
  invNum: { fontFamily: FontFamily.sairaBold, fontSize: 16, color: Colors.cyan, textAlign: 'right', marginTop: 2 },
  invDate: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textSecondary, textAlign: 'right', marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.borderSubtle, marginVertical: 14 },
  thickDivider: { height: 2, backgroundColor: Colors.borderDefault, marginVertical: 12 },
  section: { gap: 4 },
  sectionLabel: { fontFamily: FontFamily.monoMedium, fontSize: 8, letterSpacing: 2, color: Colors.textDisabled, textTransform: 'uppercase', marginBottom: 6 },
  billName: { fontFamily: FontFamily.sairaSemiBold, fontSize: 15, color: Colors.textPrimary },
  billDetail: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textSecondary },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  lineDesc: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textPrimary },
  lineSubtext: { fontFamily: FontFamily.plexRegular, fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  lineAmt: { fontFamily: FontFamily.monoMedium, fontSize: 14, color: Colors.textPrimary },
  subLine: { marginTop: 6 },
  subLineLabel: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.textSecondary, flex: 1 },
  subLineAmt: { fontFamily: FontFamily.monoMedium, fontSize: 12, color: Colors.textSecondary },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  totalLabel: { fontFamily: FontFamily.monoMedium, fontSize: 9, letterSpacing: 2, color: Colors.textTertiary, textTransform: 'uppercase' },
  totalAmt: { fontFamily: FontFamily.sairaBold, fontSize: 22 },
  badgeRow: { marginTop: 14, alignItems: 'flex-start' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.pill },
  badgePaid: { backgroundColor: 'rgba(46,230,160,0.15)', borderWidth: 1, borderColor: 'rgba(46,230,160,0.34)' },
  badgePending: { backgroundColor: 'rgba(255,176,32,0.12)', borderWidth: 1, borderColor: 'rgba(255,176,32,0.32)' },
  statusBadgeText: { fontFamily: FontFamily.monoMedium, fontSize: 9, letterSpacing: 1.5 },
  badgePaidText: { color: Colors.green },
  badgePendingText: { color: Colors.amber },
  invFooter: { fontFamily: FontFamily.plexRegular, fontSize: 10, color: Colors.textDisabled, textAlign: 'center', marginTop: 20 },
  tipCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.amberDim, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.amber, padding: 12, marginBottom: 16 },
  tipText: { fontFamily: FontFamily.plexRegular, fontSize: 12, color: Colors.amber, flex: 1, lineHeight: 18 },
  tipLink: { fontFamily: FontFamily.sairaSemiBold, fontSize: 12, color: Colors.cyan },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.cyan, borderRadius: Radius.md, paddingVertical: 14 },
  pdfBtnText: { fontFamily: FontFamily.sairaBold, fontSize: 14, color: Colors.textOnAccent, letterSpacing: 0.5 },
});
