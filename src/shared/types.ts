// Types partagés entre main et renderer

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  age?: number;
  notes?: string;
  creditPacks: CreditPack[];
  packHistory: CreditPack[];
  status: 'active' | 'hidden' | 'archived';
  createdAt: string;
  totalPaid: number;
  sessionDebt: number; // Nombre de séances "dues" (négatives)
}

export interface CreditPack {
  id: string;
  sessionCount: number;
  remainingSessions: number;
  pricePerSession: number;
  totalPrice: number;
  purchaseDate: string;
  expirationDate: string;
}

export interface SessionRecord {
  id: string;
  participantId: string;
  date: string;
  sessionCount: number;
  creditPackId: string;
}

export interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  defaultDuration?: number;
}

export type DateMarkerType = 'vacation' | 'cancelled' | 'sick';

export interface DateMarker {
  date: string; // YYYY-MM-DD
  type: DateMarkerType;
  note?: string;
}

export type ParticipantSortField = 'name' | 'firstName' | 'sessions' | 'remaining' | 'expiration' | 'age';
export type SortDirection = 'asc' | 'desc';

export interface Settings {
  showPricePerParticipant: boolean;
  showTotalReceived: boolean;
  showTooltips: boolean;
  enableGracePeriod: boolean;
  gracePeriodDays: number;
  recurringDays: number[];
  participantSortField: ParticipantSortField;
  participantSortDirection: SortDirection;
}

export interface AppData {
  participants: Participant[];
  archive: Participant[];
  sessionsHistory: SessionRecord[];
  sessionTemplates: SessionTemplate[];
  settings: Settings;
  dateMarkers: DateMarker[];
}

// Valeurs par défaut
export const defaultSettings: Settings = {
  showPricePerParticipant: false,
  showTotalReceived: false,
  showTooltips: true,
  enableGracePeriod: true,
  gracePeriodDays: 7,
  recurringDays: [1], // Lundi par défaut
  participantSortField: 'name',
  participantSortDirection: 'asc',
};

export const defaultAppData: AppData = {
  participants: [],
  archive: [],
  sessionsHistory: [],
  sessionTemplates: [],
  settings: defaultSettings,
  dateMarkers: [],
};

// Types pour les canaux IPC
export type IpcChannels =
  | 'get-data'
  | 'save-participants'
  | 'save-archive'
  | 'save-sessions-history'
  | 'save-session-templates'
  | 'save-settings'
  | 'save-date-markers';
