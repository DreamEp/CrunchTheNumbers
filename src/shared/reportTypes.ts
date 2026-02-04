import { Participant } from './types';

export type ReportMode = 'dateRange' | 'individual';

export interface ReportSummary {
  totalSessionsCompleted: number;
  totalSessionsCancelled: number;
  totalSessionsVacation: number;
  totalSessionsSick: number;
  totalSessionsUpcoming: number;    // Séances à venir (futures, pas encore réalisées/annulées)
  averagePeoplePerSession: number;
  averageRemainingSessions: number; // Moyenne des séances restantes par participant
  participantsWithExpiringSoon: number; // Participants avec packs expirant < 2 semaines
  creditPacksPurchased: number;
  totalRevenue: number;
  // Podiums participants
  mostAssiduousPerson: { participant: Participant; rate: number } | null;
  leastAssiduousPerson: { participant: Participant; rate: number } | null;
  participantWithMostRemaining: { participant: Participant; remaining: number } | null;
  participantWithLeastRemaining: { participant: Participant; remaining: number } | null;
  participantWithMostAttended: { participant: Participant; count: number } | null;
  participantWithMostMissed: { participant: Participant; count: number } | null;
  participantWithEarliestExpiration: { participant: Participant; expiration: string } | null;
  // Podiums séances
  sessionWithMostParticipants: { date: string; count: number } | null;
  sessionWithFewestParticipants: { date: string; count: number } | null;
  dayWithHighestAttendance: { dayOfWeek: string; averageCount: number } | null;
}

export interface ParticipantReportDetail {
  participant: Participant;
  sessionsAttended: number;         // Séances assistées (PASSÉES uniquement)
  sessionsUpcoming: number;         // Séances à venir où le participant a des crédits
  sessionsPurchased: number;
  sessionsMissed: number;           // Séances manquées (PASSÉES, hors annulées)
  sessionsMissedWithCancelled: number; // Inclut les séances annulées (responsabilité partagée)
  attendanceRate: number | null;    // null = "N/A" si aucune séance passée
  attendanceRateStrict: number | null; // Basé sur sessionsMissedWithCancelled
  revenueContributed: number;
  remainingSessions: number;        // Séances restantes actuelles
  earliestExpiration: string | null; // Date de fin de validité la plus proche
  lastAttendedDate: string | null;  // Dernière présence
  sessionDebt: number;              // Dette éventuelle
}

export interface ReportData {
  mode: ReportMode;
  periodStart: string;
  periodEnd: string;
  summary: ReportSummary;
  participantDetails: ParticipantReportDetail[];
  generatedAt: string;
}

export type ExportFormat = 'json' | 'csv' | 'pdf' | 'html';

export interface ReportFilters {
  mode: ReportMode;
  startDate: string;
  endDate: string;
  selectedParticipantIds: string[];
  reportDays: number[];             // Jours à inclure (0=Dim, 1=Lun, etc.)
  includeCancelledInAverage: boolean;
  includeVacationSickInAverage: boolean;
  showRevenue: boolean;
}
