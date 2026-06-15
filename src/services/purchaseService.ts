import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import type { PurchasesPackage, CustomerInfo, PurchasesOfferings } from 'react-native-purchases';
import Constants from 'expo-constants';
import { updateDJProfile } from './supabaseData';

const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';

export function initRevenueCat(userId: string): void {
  if (!RC_ANDROID_KEY || RC_ANDROID_KEY === 'your_revenuecat_android_api_key_here') return;
  // RevenueCat native store is not available in Expo Go — skip silently
  if (Constants.appOwnership === 'expo') return;
  try {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: RC_ANDROID_KEY, appUserID: userId });
  } catch {
    // Native module unavailable
  }
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; cancelled: boolean; customerInfo: CustomerInfo | null }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = customerInfo.entitlements.active['pro'] !== undefined;
    if (isPro) {
      // Sync pro status to Supabase immediately (webhook is backup)
      const expiresAt = customerInfo.entitlements.active['pro']?.expirationDate ?? null;
      const productId = customerInfo.entitlements.active['pro']?.productIdentifier ?? '';
      const plan = productId.includes('yearly') ? 'pro_yearly' : 'pro_monthly';
      await updateDJProfile({ is_pro: true, plan, plan_expires_at: expiresAt });
    }
    return { success: isPro, cancelled: false, customerInfo };
  } catch (e: any) {
    const cancelled = e?.code === 1 || e?.userCancelled === true;
    return { success: false, cancelled, customerInfo: null };
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    const isPro = info.entitlements.active['pro'] !== undefined;
    if (isPro) {
      const expiresAt = info.entitlements.active['pro']?.expirationDate ?? null;
      const productId = info.entitlements.active['pro']?.productIdentifier ?? '';
      const plan = productId.includes('yearly') ? 'pro_yearly' : 'pro_monthly';
      await updateDJProfile({ is_pro: true, plan, plan_expires_at: expiresAt });
    }
    return isPro;
  } catch {
    return false;
  }
}

export async function checkProEntitlement(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active['pro'] !== undefined;
  } catch {
    return false;
  }
}
