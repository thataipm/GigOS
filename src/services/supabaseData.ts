// GigOS Data Services — Supabase CRUD for djs and gigs
import { supabase } from '@/src/lib/supabase';

// ─── Types ───

export type DJProfile = {
  id: string;
  user_id: string;
  name: string;
  city: string;
  country: string;
  state: string | null;
  phone: string | null;
  soundcloud_url: string | null;
  instagram_handle: string | null;
  genres: string[];
  preferred_rate_min: number | null;
  preferred_rate_max: number | null;
  currency: string;
  profile_public: boolean;
  onboarding_complete: boolean;
  // Invoice fields
  gstin: string | null;
  business_address: string | null;
  push_token: string | null;
  // Monetization
  is_pro: boolean;
  plan: string;
  plan_expires_at: string | null;
  rc_customer_id: string | null;
  // Artist type
  artist_type: string;
  // Profile media
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  dj_id: string;
  gig_id: string | null;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
};

export type GigDocument = {
  id: string;
  gig_id: string;
  dj_id: string;
  file_name: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

export type Gig = {
  id: string;
  dj_id: string;
  event_name: string;
  date: string;
  venue_name: string | null;
  venue_city: string | null;
  venue_country: string | null;
  venue_state: string | null;
  venue_address: string | null;
  gig_type: string;
  pipeline_status: string;
  fee: number | null;
  advance_amount: number | null;
  advance_status: string;
  balance_status: string;
  promoter_name: string | null;
  promoter_phone: string | null;
  rider_notes: string | null;
  travel_notes: string | null;
  sound_engineer: string | null;
  genre: string | null;
  is_public: boolean;
  created_at: string;
};

export type GigCreate = Omit<Gig, 'id' | 'created_at'>;

// ─── DJ Profile ───

export async function getDJProfile(): Promise<DJProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('djs')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) return null;
  return data as DJProfile;
}

/** Fetches profile + gigs with a single auth call. Use on screens that need both. */
export async function getDJData(): Promise<{ profile: DJProfile | null; gigs: Gig[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { profile: null, gigs: [] };

  const { data: profile, error: pErr } = await supabase
    .from('djs').select('*').eq('user_id', user.id).single();
  if (pErr || !profile) return { profile: null, gigs: [] };

  const { data: gigs } = await supabase
    .from('gigs').select('*').eq('dj_id', profile.id).order('date', { ascending: false });

  return { profile: profile as DJProfile, gigs: (gigs ?? []) as Gig[] };
}

export async function updateDJProfile(updates: Partial<DJProfile>): Promise<DJProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('djs')
    .update(updates)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as DJProfile;
}

// ─── Gigs ───

export async function getGigs(): Promise<Gig[]> {
  const profile = await getDJProfile();
  if (!profile) return [];

  const { data, error } = await supabase
    .from('gigs')
    .select('*')
    .eq('dj_id', profile.id)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Gig[];
}

export async function getGig(gigId: string): Promise<Gig | null> {
  const { data, error } = await supabase
    .from('gigs')
    .select('*')
    .eq('id', gigId)
    .single();

  if (error) return null;
  return data as Gig;
}

export async function createGig(gig: Partial<GigCreate>): Promise<Gig> {
  const profile = await getDJProfile();
  if (!profile) throw new Error('DJ profile not found');

  const { data, error } = await supabase
    .from('gigs')
    .insert({ ...gig, dj_id: profile.id })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Gig;
}

export async function updateGig(gigId: string, updates: Partial<Gig>): Promise<Gig> {
  const { data, error } = await supabase
    .from('gigs')
    .update(updates)
    .eq('id', gigId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Gig;
}

export async function deleteGig(gigId: string): Promise<void> {
  const { error } = await supabase
    .from('gigs')
    .delete()
    .eq('id', gigId);

  if (error) throw new Error(error.message);
}

/** Returns gigs on a given date (YYYY-MM-DD), excluding a specific gig id for conflict checks */
export async function getGigsOnDate(date: string, excludeGigId?: string): Promise<Gig[]> {
  const profile = await getDJProfile();
  if (!profile) return [];

  let query = supabase
    .from('gigs')
    .select('*')
    .eq('dj_id', profile.id)
    .eq('date', date);

  if (excludeGigId) query = query.neq('id', excludeGigId);

  const { data } = await query;
  return (data ?? []) as Gig[];
}

// ─── Expenses ───

export async function getExpenses(): Promise<Expense[]> {
  const profile = await getDJProfile();
  if (!profile) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('dj_id', profile.id)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Expense[];
}

export async function createExpense(expense: Omit<Expense, 'id' | 'dj_id' | 'created_at'>): Promise<Expense> {
  const profile = await getDJProfile();
  if (!profile) throw new Error('DJ profile not found');

  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...expense, dj_id: profile.id })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Expense;
}

export async function getExpensesByGig(gigId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('gig_id', gigId)
    .order('date', { ascending: false });
  if (error) return [];
  return (data ?? []) as Expense[];
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);

  if (error) throw new Error(error.message);
}

// ─── Gig Documents ───

export async function getGigDocuments(gigId: string): Promise<GigDocument[]> {
  const { data, error } = await supabase
    .from('gig_documents')
    .select('*')
    .eq('gig_id', gigId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data ?? []) as GigDocument[];
}

export async function uploadGigDocument(
  gigId: string,
  fileUri: string,
  fileName: string,
  fileType?: string,
  fileSize?: number
): Promise<GigDocument> {
  const profile = await getDJProfile();
  if (!profile) throw new Error('Not authenticated');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const response = await fetch(fileUri);
  const arrayBuffer = await response.arrayBuffer();

  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${user.id}/${gigId}/${Date.now()}_${safeFileName}`;

  const { error: storageError } = await supabase.storage
    .from('gig-documents')
    .upload(storagePath, arrayBuffer, {
      contentType: fileType || 'application/octet-stream',
    });

  if (storageError) throw new Error(storageError.message);

  const { data, error } = await supabase
    .from('gig_documents')
    .insert({
      gig_id: gigId,
      dj_id: profile.id,
      file_name: fileName,
      storage_path: storagePath,
      file_type: fileType ?? null,
      file_size: fileSize ?? arrayBuffer.byteLength ?? null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as GigDocument;
}

export async function deleteGigDocument(documentId: string, storagePath: string): Promise<void> {
  // Delete from storage
  await supabase.storage.from('gig-documents').remove([storagePath]).catch(() => {});
  // Delete record
  const { error } = await supabase.from('gig_documents').delete().eq('id', documentId);
  if (error) throw new Error(error.message);
}

export async function uploadAvatar(uri: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const ext = uri.split('.').pop()?.toLowerCase().split('?')[0] || 'jpg';
  const path = `${user.id}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, {
      upsert: true,
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
  await updateDJProfile({ avatar_url: publicUrl });
  return publicUrl;
}

export async function getGigDocumentUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('gig-documents')
    .createSignedUrl(storagePath, 3600); // 1 hour

  return data?.signedUrl ?? null;
}
