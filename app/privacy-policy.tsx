// GigOS Privacy Policy Screen
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Layout } from '@/src/theme/spacing';
import { MaterialIcons } from '@expo/vector-icons';

const LAST_UPDATED = 'June 2025';
const CONTACT_EMAIL = 'growwithvny@gmail.com';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `When you create a GigOS account, we collect your name, email address, and password. As you use the app, we also store the information you enter: your artist profile (bio, photo, location, genres, rate), gig records (venue, fee, dates, promoter contacts), expenses, and any files you upload.\n\nWe do not collect device identifiers, advertising IDs, or track your location in the background.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use your information solely to provide GigOS features:\n\n• Displaying your artist profile and gig history\n• Generating invoices and income summaries\n• Sending follow-up and payment reminders\n• Authentication and account security\n\nWe do not use your data for advertising or sell it to any third party.`,
  },
  {
    title: '3. Data Storage',
    body: `Your data is stored securely on Supabase (a cloud database provider). Data is encrypted in transit (TLS) and at rest. Supabase infrastructure is hosted on AWS and complies with SOC 2 Type II standards.\n\nYou can request deletion of all your data at any time by contacting us.`,
  },
  {
    title: '4. Third-Party Services',
    body: `GigOS uses the following third-party services:\n\n• Supabase — database and authentication\n• RevenueCat — subscription management (if you upgrade to a paid plan)\n• Expo (EAS) — app delivery\n\nNone of these services receive your gig or promoter contact data.`,
  },
  {
    title: '5. Data Sharing',
    body: `We do not sell, rent, or share your personal data with third parties for marketing purposes. We may share data only if required by law or to protect the rights and safety of GigOS users.`,
  },
  {
    title: '6. Your Rights',
    body: `You may at any time:\n\n• Access and export your data (contact us)\n• Correct inaccurate information (via Settings)\n• Delete your account and all associated data (contact us)\n\nTo exercise any of these rights, email us at ${CONTACT_EMAIL}.`,
  },
  {
    title: '7. Children\'s Privacy',
    body: `GigOS is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.`,
  },
  {
    title: '8. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice. Continued use of GigOS after changes constitutes your acceptance of the updated policy.`,
  },
  {
    title: '9. Contact',
    body: `If you have any questions about this Privacy Policy or how we handle your data, contact us at:\n\n${CONTACT_EMAIL}`,
  },
];

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={28} color={Colors.cyan} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Privacy Policy</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>GigOS Privacy Policy</Text>
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>
        <Text style={styles.intro}>
          GigOS is built for working artists. Your data belongs to you — we only use it to make the app work for you, nothing else.
        </Text>

        {SECTIONS.map(sec => (
          <View key={sec.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.sectionBody}>{sec.body}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceApp },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.screenGutter, paddingVertical: 12,
    backgroundColor: Colors.surfaceRaised, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  navTitle: { fontFamily: FontFamily.sairaBold, fontSize: 17, color: Colors.textPrimary },
  scroll: { paddingHorizontal: Layout.screenGutter, paddingTop: 24, paddingBottom: 40 },
  heading: { fontFamily: FontFamily.sairaBold, fontSize: 24, color: Colors.textPrimary },
  updated: { fontFamily: FontFamily.monoMedium, fontSize: 11, color: Colors.textTertiary, marginTop: 6, letterSpacing: 0.5 },
  intro: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary, marginTop: 16, lineHeight: 22 },
  section: { marginTop: 28 },
  sectionTitle: { fontFamily: FontFamily.plexSemiBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 8 },
  sectionBody: { fontFamily: FontFamily.plexRegular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
});
