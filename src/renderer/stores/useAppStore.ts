import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Participant,
  CreditPack,
  SessionRecord,
  SessionTemplate,
  Settings,
  defaultSettings,
  DateMarker,
  DateMarkerType,
} from '../../shared/types';
import { ReportData, ReportFilters } from '../../shared/reportTypes';

interface AppState {
  // Données
  participants: Participant[];
  archive: Participant[];
  sessionsHistory: SessionRecord[];
  sessionTemplates: SessionTemplate[];
  settings: Settings;
  dateMarkers: DateMarker[];

  // État UI
  isLoading: boolean;
  activeTab: 'dashboard' | 'planning' | 'config' | 'templates' | 'reports';

  // État rapports (persiste entre navigations)
  cachedReport: ReportData | null;
  cachedReportFilters: ReportFilters | null;

  // Actions - Chargement
  loadData: () => Promise<void>;

  // Actions - Navigation
  setActiveTab: (tab: AppState['activeTab']) => void;

  // Actions - Rapports
  setCachedReport: (report: ReportData | null, filters: ReportFilters | null) => void;

  // Actions - Participants
  addParticipant: (data: Omit<Participant, 'id' | 'creditPacks' | 'packHistory' | 'status' | 'createdAt' | 'totalPaid' | 'sessionDebt'>) => Promise<void>;
  updateParticipant: (id: string, data: Partial<Participant>) => Promise<void>;
  hideParticipant: (id: string) => Promise<void>;
  archiveParticipant: (id: string) => Promise<void>;
  restoreParticipant: (id: string) => Promise<void>;
  deleteParticipant: (id: string) => Promise<void>;

  // Actions - Credit Packs
  addCreditPack: (participantId: string, pack: Omit<CreditPack, 'id'>) => Promise<void>;
  updateCreditPack: (participantId: string, packId: string, data: Partial<CreditPack>) => Promise<void>;
  deleteCreditPack: (participantId: string, packId: string) => Promise<void>;
  deleteExpiredPacks: () => Promise<void>;
  expirePack: (participantId: string, packId: string) => Promise<void>;
  reactivatePack: (participantId: string, packId: string, newExpirationDate: string) => Promise<void>;

  // Actions - Sessions
  debitSessions: (participantId: string, count: number, date: string) => Promise<void>;

  // Actions - Templates
  addTemplate: (template: Omit<SessionTemplate, 'id'>) => Promise<void>;
  updateTemplate: (id: string, data: Partial<SessionTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  reorderTemplates: (fromIndex: number, toIndex: number) => Promise<void>;

  // Actions - Settings
  updateSettings: (settings: Partial<Settings>) => Promise<void>;

  // Actions - Date Markers
  setDateMarker: (date: string, type: DateMarkerType, note?: string) => Promise<void>;
  removeDateMarker: (date: string) => Promise<void>;
  getDateMarker: (date: string) => DateMarker | undefined;

  // Utilitaires
  getRemainingSessionsForParticipant: (participantId: string) => number;
  getEarliestExpirationForParticipant: (participantId: string) => string | null;
  getSessionsForDate: (participantId: string, date: string) => number;
  updateSessionsForDate: (participantId: string, date: string, newCount: number) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // État initial
  participants: [],
  archive: [],
  sessionsHistory: [],
  sessionTemplates: [],
  settings: defaultSettings,
  dateMarkers: [],
  isLoading: true,
  activeTab: 'dashboard',
  cachedReport: null,
  cachedReportFilters: null,

  // Chargement des données depuis le stockage
  loadData: async () => {
    try {
      const data = await window.api.getData();
      set({
        participants: data.participants,
        archive: data.archive,
        sessionsHistory: data.sessionsHistory,
        sessionTemplates: data.sessionTemplates,
        settings: data.settings,
        dateMarkers: data.dateMarkers || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      set({ isLoading: false });
    }
  },

  // Navigation
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Rapports
  setCachedReport: (report, filters) => set({ cachedReport: report, cachedReportFilters: filters }),

  // Participants
  addParticipant: async (data) => {
    const newParticipant: Participant = {
      id: uuidv4(),
      ...data,
      creditPacks: [],
      packHistory: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      totalPaid: 0,
      sessionDebt: 0,
    };
    const participants = [...get().participants, newParticipant];
    set({ participants });
    await window.api.saveParticipants(participants);
  },

  updateParticipant: async (id, data) => {
    const participants = get().participants.map((p) =>
      p.id === id ? { ...p, ...data } : p
    );
    set({ participants });
    await window.api.saveParticipants(participants);
  },

  hideParticipant: async (id) => {
    const participants = get().participants.map((p) =>
      p.id === id ? { ...p, status: 'hidden' as const } : p
    );
    set({ participants });
    await window.api.saveParticipants(participants);
  },

  archiveParticipant: async (id) => {
    const participant = get().participants.find((p) => p.id === id);
    if (!participant) return;

    const archivedParticipant = { ...participant, status: 'archived' as const };
    const participants = get().participants.filter((p) => p.id !== id);
    const archive = [...get().archive, archivedParticipant];

    set({ participants, archive });
    await Promise.all([
      window.api.saveParticipants(participants),
      window.api.saveArchive(archive),
    ]);
  },

  restoreParticipant: async (id) => {
    const participant = get().archive.find((p) => p.id === id);
    if (!participant) return;

    const restoredParticipant = { ...participant, status: 'active' as const };
    const archive = get().archive.filter((p) => p.id !== id);
    const participants = [...get().participants, restoredParticipant];

    set({ participants, archive });
    await Promise.all([
      window.api.saveParticipants(participants),
      window.api.saveArchive(archive),
    ]);
  },

  deleteParticipant: async (id) => {
    const archive = get().archive.filter((p) => p.id !== id);
    set({ archive });
    await window.api.saveArchive(archive);
  },

  // Credit Packs
  addCreditPack: async (participantId, packData) => {
    const now = new Date();
    const participants = get().participants.map((p) => {
      if (p.id === participantId) {
        // Séparer les packs actifs des packs terminés/expirés
        const stillActive: CreditPack[] = [];
        const toArchive: CreditPack[] = [];

        p.creditPacks.forEach((pack) => {
          const isExpired = new Date(pack.expirationDate) < now;
          const isDepleted = pack.remainingSessions === 0;
          if (isDepleted || isExpired) {
            toArchive.push(pack);
          } else {
            stillActive.push(pack);
          }
        });

        // Si le participant a une dette, la déduire du nouveau pack
        const debt = p.sessionDebt || 0;
        const adjustedRemaining = Math.max(0, packData.remainingSessions - debt);
        const debtReduction = Math.min(debt, packData.remainingSessions);

        const pack: CreditPack = {
          id: uuidv4(),
          ...packData,
          remainingSessions: adjustedRemaining,
        };

        return {
          ...p,
          creditPacks: [...stillActive, pack],
          packHistory: [...(p.packHistory || []), ...toArchive],
          totalPaid: p.totalPaid + pack.totalPrice,
          sessionDebt: debt - debtReduction,
        };
      }
      return p;
    });

    set({ participants });
    await window.api.saveParticipants(participants);
  },

  updateCreditPack: async (participantId, packId, data) => {
    const participants = get().participants.map((p) => {
      if (p.id === participantId) {
        const oldPack = p.creditPacks.find((pack) => pack.id === packId);
        const priceDiff = data.totalPrice !== undefined && oldPack
          ? data.totalPrice - oldPack.totalPrice
          : 0;

        return {
          ...p,
          creditPacks: p.creditPacks.map((pack) =>
            pack.id === packId ? { ...pack, ...data } : pack
          ),
          totalPaid: p.totalPaid + priceDiff,
        };
      }
      return p;
    });

    set({ participants });
    await window.api.saveParticipants(participants);
  },

  deleteCreditPack: async (participantId, packId) => {
    const participants = get().participants.map((p) => {
      if (p.id === participantId) {
        const packToDelete = p.creditPacks.find((pack) => pack.id === packId);
        return {
          ...p,
          creditPacks: p.creditPacks.filter((pack) => pack.id !== packId),
          totalPaid: packToDelete ? p.totalPaid - packToDelete.totalPrice : p.totalPaid,
        };
      }
      return p;
    });

    set({ participants });
    await window.api.saveParticipants(participants);
  },

  deleteExpiredPacks: async () => {
    const { settings } = get();
    const now = new Date();
    const graceMs = settings.enableGracePeriod
      ? settings.gracePeriodDays * 24 * 60 * 60 * 1000
      : 0;

    const participants = get().participants.map((p) => {
      const expired = p.creditPacks.filter((pack) => {
        const effectiveExpiration = new Date(new Date(pack.expirationDate).getTime() + graceMs);
        return effectiveExpiration < now && pack.remainingSessions > 0;
      });
      const kept = p.creditPacks.filter((pack) => {
        const effectiveExpiration = new Date(new Date(pack.expirationDate).getTime() + graceMs);
        return effectiveExpiration >= now || pack.remainingSessions === 0;
      });

      return {
        ...p,
        creditPacks: kept,
        packHistory: [...(p.packHistory || []), ...expired],
      };
    });

    set({ participants });
    await window.api.saveParticipants(participants);
  },

  expirePack: async (participantId, packId) => {
    const participants = get().participants.map((p) => {
      if (p.id === participantId) {
        const packToExpire = p.creditPacks.find((pack) => pack.id === packId);
        if (!packToExpire) return p;
        return {
          ...p,
          creditPacks: p.creditPacks.filter((pack) => pack.id !== packId),
          packHistory: [...(p.packHistory || []), packToExpire],
        };
      }
      return p;
    });

    set({ participants });
    await window.api.saveParticipants(participants);
  },

  reactivatePack: async (participantId, packId, newExpirationDate) => {
    const participants = get().participants.map((p) => {
      if (p.id === participantId) {
        const history = p.packHistory || [];
        const packToReactivate = history.find((pack) => pack.id === packId);
        if (!packToReactivate) return p;
        return {
          ...p,
          packHistory: history.filter((pack) => pack.id !== packId),
          creditPacks: [...p.creditPacks, { ...packToReactivate, expirationDate: newExpirationDate }],
        };
      }
      return p;
    });

    set({ participants });
    await window.api.saveParticipants(participants);
  },

  // Sessions - Débit avec FIFO
  debitSessions: async (participantId, count, date) => {
    let remainingToDebit = count;
    const records: SessionRecord[] = [];

    const participants = get().participants.map((p) => {
      if (p.id !== participantId) return p;

      // Trier les packs par date d'achat (FIFO), packs non expirés en premier
      const now = new Date();
      const sortedPacks = [...p.creditPacks].sort((a, b) => {
        const aExpired = new Date(a.expirationDate) < now;
        const bExpired = new Date(b.expirationDate) < now;
        if (aExpired !== bExpired) return aExpired ? 1 : -1;
        return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
      });

      const updatedPacks = sortedPacks.map((pack) => {
        if (remainingToDebit <= 0 || pack.remainingSessions <= 0) return pack;

        const toDebit = Math.min(remainingToDebit, pack.remainingSessions);
        remainingToDebit -= toDebit;

        records.push({
          id: uuidv4(),
          participantId,
          date,
          sessionCount: toDebit,
          creditPackId: pack.id,
        });

        return {
          ...pack,
          remainingSessions: pack.remainingSessions - toDebit,
        };
      });

      return { ...p, creditPacks: updatedPacks };
    });

    const sessionsHistory = [...get().sessionsHistory, ...records];

    set({ participants, sessionsHistory });
    await Promise.all([
      window.api.saveParticipants(participants),
      window.api.saveSessionsHistory(sessionsHistory),
    ]);
  },

  // Templates
  addTemplate: async (templateData) => {
    const template: SessionTemplate = {
      id: uuidv4(),
      ...templateData,
    };
    const sessionTemplates = [...get().sessionTemplates, template];
    set({ sessionTemplates });
    await window.api.saveSessionTemplates(sessionTemplates);
  },

  updateTemplate: async (id, data) => {
    const sessionTemplates = get().sessionTemplates.map((t) =>
      t.id === id ? { ...t, ...data } : t
    );
    set({ sessionTemplates });
    await window.api.saveSessionTemplates(sessionTemplates);
  },

  deleteTemplate: async (id) => {
    const sessionTemplates = get().sessionTemplates.filter((t) => t.id !== id);
    set({ sessionTemplates });
    await window.api.saveSessionTemplates(sessionTemplates);
  },

  reorderTemplates: async (fromIndex, toIndex) => {
    const templates = [...get().sessionTemplates];
    const [removed] = templates.splice(fromIndex, 1);
    templates.splice(toIndex, 0, removed);
    set({ sessionTemplates: templates });
    await window.api.saveSessionTemplates(templates);
  },

  // Settings
  updateSettings: async (newSettings) => {
    const settings = { ...get().settings, ...newSettings };
    set({ settings });
    await window.api.saveSettings(settings);
  },

  // Date Markers
  setDateMarker: async (date, type, note) => {
    const dateMarkers = get().dateMarkers.filter((m) => m.date !== date);
    dateMarkers.push({ date, type, note });
    set({ dateMarkers });
    await window.api.saveDateMarkers(dateMarkers);
  },

  removeDateMarker: async (date) => {
    const dateMarkers = get().dateMarkers.filter((m) => m.date !== date);
    set({ dateMarkers });
    await window.api.saveDateMarkers(dateMarkers);
  },

  getDateMarker: (date) => {
    return get().dateMarkers.find((m) => m.date === date);
  },

  // Utilitaires
  getRemainingSessionsForParticipant: (participantId) => {
    const participant = get().participants.find((p) => p.id === participantId);
    if (!participant) return 0;
    const totalFromPacks = participant.creditPacks.reduce(
      (sum, pack) => sum + pack.remainingSessions,
      0
    );
    // Soustraire la dette de séances
    return totalFromPacks - (participant.sessionDebt || 0);
  },

  getEarliestExpirationForParticipant: (participantId) => {
    const participant = get().participants.find((p) => p.id === participantId);
    if (!participant || participant.creditPacks.length === 0) return null;

    const activePacks = participant.creditPacks.filter(
      (pack) => pack.remainingSessions > 0
    );
    if (activePacks.length === 0) return null;

    return activePacks.reduce((earliest, pack) =>
      pack.expirationDate < earliest ? pack.expirationDate : earliest
    , activePacks[0].expirationDate);
  },

  getSessionsForDate: (participantId, date) => {
    const { sessionsHistory } = get();
    return sessionsHistory
      .filter((s) => s.participantId === participantId && s.date === date)
      .reduce((sum, s) => sum + s.sessionCount, 0);
  },

  updateSessionsForDate: async (participantId, date, newCount) => {
    const { sessionsHistory, participants, dateMarkers } = get();

    // Calculer les séances actuellement enregistrées pour cette date
    const currentRecords = sessionsHistory.filter(
      (s) => s.participantId === participantId && s.date === date
    );
    const currentCount = currentRecords.reduce((sum, s) => sum + s.sessionCount, 0);

    const diff = newCount - currentCount;

    if (diff === 0) return;

    // Si on ajoute des sessions, retirer automatiquement le marker "cancelled" pour cette date
    if (newCount > 0) {
      const marker = dateMarkers.find((m) => m.date === date);
      if (marker?.type === 'cancelled') {
        const updatedMarkers = dateMarkers.filter((m) => m.date !== date);
        set({ dateMarkers: updatedMarkers });
        await window.api.saveDateMarkers(updatedMarkers);
      }
    }

    if (diff > 0) {
      // Ajouter des séances (débiter des packs, puis créer une dette si nécessaire)
      let remainingToDebit = diff;
      const newRecords: SessionRecord[] = [];

      const updatedParticipants = participants.map((p) => {
        if (p.id !== participantId) return p;

        const now = new Date();
        const sortedPacks = [...p.creditPacks].sort((a, b) => {
          const aExpired = new Date(a.expirationDate) < now;
          const bExpired = new Date(b.expirationDate) < now;
          if (aExpired !== bExpired) return aExpired ? 1 : -1;
          return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        });

        const updatedPacks = sortedPacks.map((pack) => {
          if (remainingToDebit <= 0 || pack.remainingSessions <= 0) return pack;

          const toDebit = Math.min(remainingToDebit, pack.remainingSessions);
          remainingToDebit -= toDebit;

          newRecords.push({
            id: uuidv4(),
            participantId,
            date,
            sessionCount: toDebit,
            creditPackId: pack.id,
          });

          return {
            ...pack,
            remainingSessions: pack.remainingSessions - toDebit,
          };
        });

        // Si il reste des séances à débiter, créer une dette
        // et créer un record sans creditPackId pour tracker
        if (remainingToDebit > 0) {
          newRecords.push({
            id: uuidv4(),
            participantId,
            date,
            sessionCount: remainingToDebit,
            creditPackId: 'DEBT', // Marqueur spécial pour les séances en dette
          });
        }

        return {
          ...p,
          creditPacks: updatedPacks,
          sessionDebt: (p.sessionDebt || 0) + remainingToDebit,
        };
      });

      const newSessionsHistory = [...sessionsHistory, ...newRecords];
      set({ participants: updatedParticipants, sessionsHistory: newSessionsHistory });
      await Promise.all([
        window.api.saveParticipants(updatedParticipants),
        window.api.saveSessionsHistory(newSessionsHistory),
      ]);
    } else {
      // Rembourser des séances (d'abord réduire la dette, puis recréditer les packs)
      let remainingToCredit = Math.abs(diff);

      // Supprimer les records et recréditer les packs (LIFO - dernier entré, premier sorti)
      const recordsToProcess = [...currentRecords].reverse();
      const recordIdsToRemove: string[] = [];
      const packCredits: Record<string, number> = {};
      let debtReduction = 0;

      for (const record of recordsToProcess) {
        if (remainingToCredit <= 0) break;

        const toCredit = Math.min(remainingToCredit, record.sessionCount);
        remainingToCredit -= toCredit;

        if (toCredit === record.sessionCount) {
          recordIdsToRemove.push(record.id);
        } else {
          recordIdsToRemove.push(record.id);
        }

        // Si c'est un record de dette, réduire la dette au lieu de recréditer un pack
        if (record.creditPackId === 'DEBT') {
          debtReduction += toCredit;
        } else {
          packCredits[record.creditPackId] = (packCredits[record.creditPackId] || 0) + toCredit;
        }
      }

      // Mettre à jour les packs avec les crédits et réduire la dette
      const updatedParticipants = participants.map((p) => {
        if (p.id !== participantId) return p;

        return {
          ...p,
          sessionDebt: Math.max(0, (p.sessionDebt || 0) - debtReduction),
          creditPacks: p.creditPacks.map((pack) => {
            if (packCredits[pack.id]) {
              return {
                ...pack,
                remainingSessions: pack.remainingSessions + packCredits[pack.id],
              };
            }
            return pack;
          }),
        };
      });

      // Supprimer les records et potentiellement en recréer avec des valeurs partielles
      let newSessionsHistory = sessionsHistory.filter(
        (s) => !recordIdsToRemove.includes(s.id)
      );

      // Si on a eu une suppression partielle, recréer un record avec le reste
      if (remainingToCredit < 0) {
        // Cela ne devrait pas arriver avec la logique actuelle
      }

      set({ participants: updatedParticipants, sessionsHistory: newSessionsHistory });
      await Promise.all([
        window.api.saveParticipants(updatedParticipants),
        window.api.saveSessionsHistory(newSessionsHistory),
      ]);
    }
  },
}));
