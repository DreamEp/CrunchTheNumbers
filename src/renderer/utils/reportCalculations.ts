import {
  ReportData,
  ReportSummary,
  ParticipantReportDetail,
  ReportFilters,
} from '../../shared/reportTypes';
import {
  Participant,
  SessionRecord,
  DateMarker,
  Settings,
} from '../../shared/types';

const DAYS_OF_WEEK = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// Helper pour créer une date locale à partir d'une chaîne YYYY-MM-DD
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Helper pour formater une date locale en YYYY-MM-DD
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getScheduledSessionDates(
  startDate: string,
  endDate: string,
  recurringDays: number[]
): string[] {
  const dates: string[] = [];
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (recurringDays.includes(dayOfWeek)) {
      dates.push(formatLocalDate(d));
    }
  }

  return dates;
}

// Normalize ISO date to YYYY-MM-DD format for comparison
function normalizeDate(isoDate: string): string {
  return isoDate.split('T')[0];
}

function participantHadCreditsOnDate(
  participant: Participant,
  date: string,
  sessionsHistory: SessionRecord[]
): boolean {
  // Normalize dates for comparison (handles both ISO timestamps and date strings)
  const packsBefore = participant.creditPacks.filter((pack) => {
    const purchaseDate = normalizeDate(pack.purchaseDate);
    const expirationDate = normalizeDate(pack.expirationDate);
    return purchaseDate <= date && expirationDate >= date;
  });

  if (packsBefore.length === 0) return false;

  const sessionsUsedBefore = sessionsHistory
    .filter(
      (s) =>
        s.participantId === participant.id &&
        normalizeDate(s.date) < date &&
        packsBefore.some((p) => p.id === s.creditPackId)
    )
    .reduce((sum, s) => sum + s.sessionCount, 0);

  const totalAvailable = packsBefore.reduce(
    (sum, p) => sum + p.sessionCount,
    0
  );

  return totalAvailable - sessionsUsedBefore > 0;
}

function getRemainingSessionsForParticipant(participant: Participant): number {
  const totalFromPacks = participant.creditPacks.reduce(
    (sum, pack) => sum + pack.remainingSessions,
    0
  );
  return totalFromPacks - (participant.sessionDebt || 0);
}

function getEarliestExpirationForParticipant(participant: Participant): string | null {
  if (participant.creditPacks.length === 0) return null;

  const activePacks = participant.creditPacks.filter(
    (pack) => pack.remainingSessions > 0
  );
  if (activePacks.length === 0) return null;

  return activePacks.reduce((earliest, pack) =>
    pack.expirationDate < earliest ? pack.expirationDate : earliest
  , activePacks[0].expirationDate);
}

function getLastAttendedDate(
  participantId: string,
  sessionsHistory: SessionRecord[],
  startDate: string,
  endDate: string
): string | null {
  const sessions = sessionsHistory
    .filter(
      (s) =>
        s.participantId === participantId &&
        normalizeDate(s.date) >= startDate &&
        normalizeDate(s.date) <= endDate &&
        s.sessionCount > 0
    )
    .sort((a, b) => normalizeDate(b.date).localeCompare(normalizeDate(a.date)));

  return sessions.length > 0 ? normalizeDate(sessions[0].date) : null;
}

function isExpiringWithinWeeks(expiration: string | null, weeks: number): boolean {
  if (!expiration) return false;

  const now = new Date();
  const expirationDate = new Date(expiration);
  const diffMs = expirationDate.getTime() - now.getTime();
  const diffWeeks = diffMs / (7 * 24 * 60 * 60 * 1000);

  return diffWeeks > 0 && diffWeeks <= weeks;
}

export function calculateReport(
  filters: ReportFilters,
  participants: Participant[],
  sessionsHistory: SessionRecord[],
  dateMarkers: DateMarker[],
  settings: Settings
): ReportData {
  const { mode, startDate, endDate, selectedParticipantIds, reportDays, includeCancelledInAverage, includeVacationSickInAverage } = filters;

  const selectedParticipants = participants.filter((p) =>
    selectedParticipantIds.includes(p.id)
  );

  const today = formatLocalDate(new Date());

  // Utiliser reportDays du filtre (ou settings.recurringDays par défaut)
  const daysToUse = reportDays && reportDays.length > 0 ? reportDays : settings.recurringDays;

  // Get all scheduled session dates (based on selected days)
  const allScheduledDates = getScheduledSessionDates(
    startDate,
    endDate,
    daysToUse
  );

  // Séparer les dates passées et futures
  const pastScheduledDates = allScheduledDates.filter((date) => date <= today);
  const futureScheduledDates = allScheduledDates.filter((date) => date > today);

  // Get markers in range
  const markersInRange = dateMarkers.filter(
    (m) => m.date >= startDate && m.date <= endDate
  );

  // Vacances et maladie (TOUTES - passées + futures car planifiables)
  const vacationDates = markersInRange.filter((m) => m.type === 'vacation');
  const sickDates = markersInRange.filter((m) => m.type === 'sick');

  // Helper pour vérifier si une date est marquée vacances/maladie
  const isVacationOrSick = (date: string) => {
    const marker = markersInRange.find((m) => m.date === date);
    return marker && (marker.type === 'vacation' || marker.type === 'sick');
  };

  // Get sessions by date (PASSÉES uniquement pour "réalisées") - pour les participants sélectionnés
  const sessionsByDatePast = sessionsHistory
    .filter(
      (s) =>
        normalizeDate(s.date) >= startDate &&
        normalizeDate(s.date) <= endDate &&
        normalizeDate(s.date) <= today &&
        selectedParticipantIds.includes(s.participantId)
    )
    .reduce((acc, s) => {
      const dateKey = normalizeDate(s.date);
      acc[dateKey] = (acc[dateKey] || 0) + s.sessionCount;
      return acc;
    }, {} as Record<string, number>);

  // Dates PASSÉES avec des sessions enregistrées (participants sélectionnés)
  const datesWithSessionsPast = Object.keys(sessionsByDatePast).filter(
    (date) => sessionsByDatePast[date] > 0
  );

  // Dates PASSÉES avec des sessions GLOBALES (tous participants) - pour calcul des manquées
  const allSessionsDatesGlobal = sessionsHistory
    .filter(
      (s) =>
        normalizeDate(s.date) >= startDate &&
        normalizeDate(s.date) <= endDate &&
        normalizeDate(s.date) <= today
    )
    .reduce((acc, s) => {
      const dateKey = normalizeDate(s.date);
      acc[dateKey] = (acc[dateKey] || 0) + s.sessionCount;
      return acc;
    }, {} as Record<string, number>);

  const datesWithSessionsGlobal = Object.keys(allSessionsDatesGlobal).filter(
    (date) => allSessionsDatesGlobal[date] > 0
  );

  // Séances annulées = dates PASSÉES prévues sans session GLOBALE et sans marqueur vacances/maladie
  // Une séance est annulée si PERSONNE n'est venu (pas seulement les participants sélectionnés)
  const cancelledDatesPast = pastScheduledDates.filter((date) => {
    if (isVacationOrSick(date)) return false;
    return !datesWithSessionsGlobal.includes(date);
  });

  // Total séances réalisées (PASSÉES uniquement)
  const totalSessionsCompleted = Object.values(sessionsByDatePast).reduce(
    (sum, count) => sum + count,
    0
  );

  // Total séances annulées (PASSÉES uniquement)
  const totalCancelledCount = cancelledDatesPast.length;

  // Séances à venir = dates FUTURES sans marqueur vacances/maladie
  const upcomingDates = futureScheduledDates.filter((date) => !isVacationOrSick(date));
  const totalSessionsUpcoming = upcomingDates.length;

  // Vacances et maladie (TOUTES - passées + futures)
  const totalVacationCount = vacationDates.length;
  const totalSickCount = sickDates.length;

  // Calculate average (sur séances PASSÉES uniquement)
  let averageDates = [...datesWithSessionsPast];
  if (includeCancelledInAverage) {
    cancelledDatesPast.forEach((date) => {
      if (!averageDates.includes(date)) {
        averageDates.push(date);
      }
    });
  }
  if (includeVacationSickInAverage) {
    [...vacationDates, ...sickDates].forEach((m) => {
      if (!averageDates.includes(m.date) && m.date <= today) {
        averageDates.push(m.date);
      }
    });
  }

  const averagePeoplePerSession =
    averageDates.length > 0
      ? totalSessionsCompleted / averageDates.length
      : 0;

  const packsInRange = selectedParticipants.flatMap((p) =>
    p.creditPacks.filter((pack) => {
      const purchaseDate = normalizeDate(pack.purchaseDate);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    })
  );

  const creditPacksPurchased = packsInRange.length;
  const totalRevenue = packsInRange.reduce(
    (sum, pack) => sum + pack.totalPrice,
    0
  );

  const participantDetails: ParticipantReportDetail[] =
    selectedParticipants.map((participant) => {
      // Séances assistées PASSÉES uniquement
      const sessionsAttendedPast = sessionsHistory
        .filter(
          (s) =>
            s.participantId === participant.id &&
            normalizeDate(s.date) >= startDate &&
            normalizeDate(s.date) <= endDate &&
            normalizeDate(s.date) <= today
        )
        .reduce((sum, s) => sum + s.sessionCount, 0);

      // Séances à venir pour ce participant (dates futures où il a des crédits)
      const sessionsUpcoming = upcomingDates.filter((date) =>
        participantHadCreditsOnDate(participant, date, sessionsHistory)
      ).length;

      const packsForParticipant = participant.creditPacks.filter(
        (pack) => {
          const purchaseDate = normalizeDate(pack.purchaseDate);
          return purchaseDate >= startDate && purchaseDate <= endDate;
        }
      );

      const sessionsPurchased = packsForParticipant.reduce(
        (sum, pack) => sum + pack.sessionCount,
        0
      );

      const revenueContributed = packsForParticipant.reduce(
        (sum, pack) => sum + pack.totalPrice,
        0
      );

      // Dates PASSÉES où le participant a assisté
      const attendedDatesPast = new Set<string>();
      sessionsHistory
        .filter(
          (s) =>
            s.participantId === participant.id &&
            normalizeDate(s.date) >= startDate &&
            normalizeDate(s.date) <= endDate &&
            normalizeDate(s.date) <= today &&
            s.sessionCount > 0
        )
        .forEach((s) => attendedDatesPast.add(normalizeDate(s.date)));

      // Séances annulées PASSÉES où le participant aurait pu venir
      const cancelledDatesWhereCouldAttend = cancelledDatesPast.filter((date) =>
        participantHadCreditsOnDate(participant, date, sessionsHistory)
      );

      // Nombre de jours PASSÉS où le participant a assisté
      const daysAttendedPast = attendedDatesPast.size;

      // Dates où une séance a eu lieu GLOBALEMENT (quelqu'un y a assisté, tous participants confondus)
      // Manquées standard = dates où séance a eu lieu ET participant avait crédits ET pas venu
      const datesWithSessionsWhereCouldAttend = datesWithSessionsGlobal.filter(
        (date) =>
          !attendedDatesPast.has(date) &&
          participantHadCreditsOnDate(participant, date, sessionsHistory)
      );
      const sessionsMissed = datesWithSessionsWhereCouldAttend.length;

      // sessionsMissedWithCancelled = standard + annulées où avait crédits
      const sessionsMissedWithCancelled = sessionsMissed + cancelledDatesWhereCouldAttend.length;

      // Dénominateur pour le taux = toutes les dates où le participant aurait pu venir
      // = jours assistés + jours manqués (session a eu lieu) + jours annulés où avait crédits
      const totalPossibleDaysForRate = daysAttendedPast + sessionsMissed + cancelledDatesWhereCouldAttend.length;

      // Taux de présence = Assistées / Total possibles
      // Si aucune date possible → null (N/A)
      const attendanceRate: number | null =
        totalPossibleDaysForRate > 0
          ? (daysAttendedPast / totalPossibleDaysForRate) * 100
          : null;

      // Taux strict = sans compter les annulées (seulement les séances qui ont eu lieu)
      const totalSessionsThatHappened = daysAttendedPast + sessionsMissed;
      const attendanceRateStrict: number | null =
        totalSessionsThatHappened > 0
          ? (daysAttendedPast / totalSessionsThatHappened) * 100
          : null;

      // Nouvelles données
      const remainingSessions = getRemainingSessionsForParticipant(participant);
      const earliestExpiration = getEarliestExpirationForParticipant(participant);
      const lastAttendedDate = getLastAttendedDate(participant.id, sessionsHistory, startDate, endDate);
      const sessionDebt = participant.sessionDebt || 0;

      return {
        participant,
        sessionsAttended: sessionsAttendedPast,
        sessionsUpcoming,
        sessionsPurchased,
        sessionsMissed,
        sessionsMissedWithCancelled,
        attendanceRate,
        attendanceRateStrict,
        revenueContributed,
        remainingSessions,
        earliestExpiration,
        lastAttendedDate,
        sessionDebt,
      };
    });

  // Filtrer participants avec un taux valide pour le podium
  const participantsWithValidRate = participantDetails.filter(
    (pd) => pd.attendanceRate !== null
  );

  const mostAssiduousPerson =
    participantsWithValidRate.length > 0
      ? participantsWithValidRate.reduce((best, current) =>
          (current.attendanceRate ?? 0) > (best.attendanceRate ?? 0) ? current : best
        )
      : null;

  const leastAssiduousPerson =
    participantsWithValidRate.length > 0
      ? participantsWithValidRate.reduce((worst, current) =>
          (current.attendanceRate ?? 100) < (worst.attendanceRate ?? 100) ? current : worst
        )
      : null;

  // Sessions par date (PASSÉES uniquement pour les stats)
  const sessionDates = Object.entries(sessionsByDatePast)
    .filter(([_, count]) => count > 0)
    .map(([date, count]) => ({ date, count }));

  const sessionWithMostParticipants =
    sessionDates.length > 0
      ? sessionDates.reduce((best, current) =>
          current.count > best.count ? current : best
        )
      : null;

  const sessionWithFewestParticipants =
    sessionDates.length > 0
      ? sessionDates.reduce((worst, current) =>
          current.count < worst.count ? current : worst
        )
      : null;

  const sessionsByDayOfWeek: Record<number, { total: number; count: number }> = {};
  datesWithSessionsPast.forEach((date) => {
    const dayOfWeek = parseLocalDate(date).getDay();
    if (!sessionsByDayOfWeek[dayOfWeek]) {
      sessionsByDayOfWeek[dayOfWeek] = { total: 0, count: 0 };
    }
    sessionsByDayOfWeek[dayOfWeek].total += sessionsByDatePast[date];
    sessionsByDayOfWeek[dayOfWeek].count += 1;
  });

  const dayWithHighestAttendance = Object.entries(sessionsByDayOfWeek)
    .map(([day, stats]) => ({
      dayOfWeek: DAYS_OF_WEEK[parseInt(day)],
      averageCount: stats.total / stats.count,
    }))
    .sort((a, b) => b.averageCount - a.averageCount)[0] || null;

  // Nouvelles statistiques
  const participantsWithRemaining = participantDetails.filter((pd) => pd.remainingSessions > 0);
  const averageRemainingSessions =
    participantDetails.length > 0
      ? participantDetails.reduce((sum, pd) => sum + pd.remainingSessions, 0) / participantDetails.length
      : 0;

  const participantsWithExpiringSoon = participantDetails.filter((pd) =>
    isExpiringWithinWeeks(pd.earliestExpiration, 2)
  ).length;

  // Participant avec le plus de séances restantes
  const participantWithMostRemaining =
    participantsWithRemaining.length > 0
      ? participantsWithRemaining.reduce((best, current) =>
          current.remainingSessions > best.remainingSessions ? current : best
        )
      : null;

  // Participant avec le moins de séances restantes (mais > 0)
  const participantWithLeastRemaining =
    participantsWithRemaining.length > 1
      ? participantsWithRemaining.reduce((worst, current) =>
          current.remainingSessions < worst.remainingSessions ? current : worst
        )
      : null;

  // Participant ayant assisté au plus de séances
  const participantsWithAttended = participantDetails.filter((pd) => pd.sessionsAttended > 0);
  const participantWithMostAttended =
    participantsWithAttended.length > 0
      ? participantsWithAttended.reduce((best, current) =>
          current.sessionsAttended > best.sessionsAttended ? current : best
        )
      : null;

  // Participant ayant manqué le plus de séances
  const participantsWithMissed = participantDetails.filter((pd) => pd.sessionsMissedWithCancelled > 0);
  const participantWithMostMissed =
    participantsWithMissed.length > 0
      ? participantsWithMissed.reduce((worst, current) =>
          current.sessionsMissedWithCancelled > worst.sessionsMissedWithCancelled ? current : worst
        )
      : null;

  // Participant dont le pack expire le plus tôt
  const participantsWithExpiration = participantDetails.filter((pd) => pd.earliestExpiration !== null);
  const participantWithEarliestExpiration =
    participantsWithExpiration.length > 0
      ? participantsWithExpiration.reduce((earliest, current) =>
          current.earliestExpiration! < earliest.earliestExpiration! ? current : earliest
        )
      : null;

  const summary: ReportSummary = {
    totalSessionsCompleted,
    totalSessionsCancelled: totalCancelledCount,
    totalSessionsVacation: totalVacationCount,
    totalSessionsSick: totalSickCount,
    totalSessionsUpcoming,
    averagePeoplePerSession,
    averageRemainingSessions,
    participantsWithExpiringSoon,
    creditPacksPurchased,
    totalRevenue,
    mostAssiduousPerson: mostAssiduousPerson
      ? {
          participant: mostAssiduousPerson.participant,
          rate: mostAssiduousPerson.attendanceRate ?? 0,
        }
      : null,
    leastAssiduousPerson: leastAssiduousPerson
      ? {
          participant: leastAssiduousPerson.participant,
          rate: leastAssiduousPerson.attendanceRate ?? 0,
        }
      : null,
    participantWithMostRemaining: participantWithMostRemaining
      ? {
          participant: participantWithMostRemaining.participant,
          remaining: participantWithMostRemaining.remainingSessions,
        }
      : null,
    participantWithLeastRemaining: participantWithLeastRemaining
      ? {
          participant: participantWithLeastRemaining.participant,
          remaining: participantWithLeastRemaining.remainingSessions,
        }
      : null,
    participantWithMostAttended: participantWithMostAttended
      ? {
          participant: participantWithMostAttended.participant,
          count: participantWithMostAttended.sessionsAttended,
        }
      : null,
    participantWithMostMissed: participantWithMostMissed
      ? {
          participant: participantWithMostMissed.participant,
          count: participantWithMostMissed.sessionsMissedWithCancelled,
        }
      : null,
    participantWithEarliestExpiration: participantWithEarliestExpiration
      ? {
          participant: participantWithEarliestExpiration.participant,
          expiration: participantWithEarliestExpiration.earliestExpiration!,
        }
      : null,
    sessionWithMostParticipants,
    sessionWithFewestParticipants,
    dayWithHighestAttendance,
  };

  return {
    mode,
    periodStart: startDate,
    periodEnd: endDate,
    summary,
    participantDetails: participantDetails.sort(
      (a, b) => (b.attendanceRate ?? -1) - (a.attendanceRate ?? -1)
    ),
    generatedAt: new Date().toISOString(),
  };
}

export function calculateIndividualReport(
  participant: Participant,
  sessionsHistory: SessionRecord[],
  dateMarkers: DateMarker[],
  settings: Settings
): ReportData {
  const firstPack = participant.creditPacks.sort(
    (a, b) =>
      new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
  )[0];

  const startDate =
    firstPack?.purchaseDate ||
    participant.createdAt.split('T')[0] ||
    new Date().toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];

  return calculateReport(
    {
      mode: 'individual',
      startDate,
      endDate,
      selectedParticipantIds: [participant.id],
      reportDays: settings.recurringDays,
      includeCancelledInAverage: true,
      includeVacationSickInAverage: false,
      showRevenue: true,
    },
    [participant],
    sessionsHistory,
    dateMarkers,
    settings
  );
}
