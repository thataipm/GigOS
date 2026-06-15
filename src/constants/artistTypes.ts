export const GENRES_BY_ARTIST_TYPE: Record<string, string[]> = {
  dj:            ['Techno', 'House', 'Psytrance', 'DnB', 'Bollywood', 'Bollytech', 'Commercial', 'Hip-Hop', 'Afrobeats', 'Trance', 'Minimal', 'Amapiano'],
  producer:      ['Techno', 'House', 'Bollywood', 'Hip-Hop', 'Afrobeats', 'Trance', 'Amapiano', 'EDM', 'Pop', 'R&B', 'DnB', 'Psytrance'],
  singer:        ['Bollywood', 'Sufi', 'Classical', 'Pop', 'R&B', 'Jazz', 'Folk', 'Ghazal', 'Indie', 'Devotional', 'Carnatic', 'Punjabi'],
  live_band:     ['Rock', 'Fusion', 'Jazz', 'Bollywood', 'Pop', 'Blues', 'Folk', 'Reggae', 'Indie Rock', 'Country', 'Funk', 'Metal'],
  mc:            ['Hip-Hop', 'R&B', 'Spoken Word', 'Freestyle', 'Party', 'Motivational', 'Bilingual'],
  percussionist: ['Dholak', 'Tabla', 'Djembe', 'Cajon', 'Dhol', 'World Music', 'Fusion', 'Jazz', 'Classical', 'Folk'],
};

export type GigTypeOption = { label: string; value: string };

export const GIG_TYPES_BY_ARTIST_TYPE: Record<string, GigTypeOption[]> = {
  dj: [
    { label: 'Club Night', value: 'club_night' },
    { label: 'Residency', value: 'residency' },
    { label: 'Private Party', value: 'private_party' },
    { label: 'Festival', value: 'festival' },
    { label: 'Corporate', value: 'corporate' },
    { label: 'Brand Activation', value: 'brand_activation' },
  ],
  producer: [
    { label: 'Studio Session', value: 'studio_session' },
    { label: 'Live Set', value: 'club_night' },
    { label: 'Festival', value: 'festival' },
    { label: 'Corporate', value: 'corporate' },
    { label: 'Brand Activation', value: 'brand_activation' },
    { label: 'Masterclass', value: 'masterclass' },
  ],
  singer: [
    { label: 'Live Performance', value: 'live_performance' },
    { label: 'Wedding', value: 'wedding' },
    { label: 'Private Party', value: 'private_party' },
    { label: 'Festival', value: 'festival' },
    { label: 'Corporate', value: 'corporate' },
    { label: 'Concert', value: 'concert' },
  ],
  live_band: [
    { label: 'Live Performance', value: 'live_performance' },
    { label: 'Wedding', value: 'wedding' },
    { label: 'Festival', value: 'festival' },
    { label: 'Corporate', value: 'corporate' },
    { label: 'Private Party', value: 'private_party' },
    { label: 'Concert', value: 'concert' },
  ],
  mc: [
    { label: 'Event Hosting', value: 'event_hosting' },
    { label: 'Corporate', value: 'corporate' },
    { label: 'Wedding', value: 'wedding' },
    { label: 'Festival', value: 'festival' },
    { label: 'Brand Activation', value: 'brand_activation' },
    { label: 'Award Show', value: 'award_show' },
  ],
  percussionist: [
    { label: 'Wedding', value: 'wedding' },
    { label: 'Festival', value: 'festival' },
    { label: 'Corporate', value: 'corporate' },
    { label: 'Private Party', value: 'private_party' },
    { label: 'Live Performance', value: 'live_performance' },
    { label: 'Concert', value: 'concert' },
  ],
};

export const DEFAULT_GIG_TYPES = GIG_TYPES_BY_ARTIST_TYPE.dj;
export const DEFAULT_GENRES    = GENRES_BY_ARTIST_TYPE.dj;

export const ARTIST_TYPES = [
  { key: 'dj',            label: 'DJ' },
  { key: 'singer',        label: 'Singer' },
  { key: 'live_band',     label: 'Live Band' },
  { key: 'mc',            label: 'MC / Host' },
  { key: 'producer',      label: 'Producer' },
  { key: 'percussionist', label: 'Percussionist' },
];
