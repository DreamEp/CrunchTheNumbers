import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { DAYS_OF_WEEK, getSessionsIndicator, getExpirationIndicator } from '../../utils/indicators';
import {
  Card,
  Button,
  Badge,
  Select,
  Input,
  Label,
  SectionHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  Tooltip,
  ParticipantTooltipContent,
  Toggle,
  Modal,
  ModalTitle,
  ModalActions,
} from '../ui';

type ViewMode = 'period' | 'sessions';

function Planning() {
  const {
    participants,
    sessionsHistory,
    settings,
    updateSettings,
    getRemainingSessionsForParticipant,
    getEarliestExpirationForParticipant,
    getSessionsForDate,
    updateSessionsForDate,
    setDateMarker,
    removeDateMarker,
    getDateMarker,
  } = useAppStore();

  // Date range state
  const today = new Date();
  const defaultEndDate = new Date(today);
  defaultEndDate.setDate(defaultEndDate.getDate() + 28); // 4 weeks

  const [startDate, setStartDate] = useState(today.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(defaultEndDate.toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('period');
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, Record<string, number>>
  >({});
  const [markerModal, setMarkerModal] = useState<{ date: string; dateLabel: string } | null>(null);

  const activeParticipants = useMemo(() => {
    const active = participants.filter((p) => p.status === 'active');
    const { participantSortField, participantSortDirection } = settings;

    return [...active].sort((a, b) => {
      let comparison = 0;
      switch (participantSortField) {
        case 'name':
          comparison = a.lastName.localeCompare(b.lastName);
          break;
        case 'firstName':
          comparison = a.firstName.localeCompare(b.firstName);
          break;
        case 'sessions':
          const sessionsA = a.creditPacks.reduce((sum, pack) => sum + pack.sessionCount, 0);
          const sessionsB = b.creditPacks.reduce((sum, pack) => sum + pack.sessionCount, 0);
          comparison = sessionsA - sessionsB;
          break;
        case 'remaining':
          comparison = getRemainingSessionsForParticipant(a.id) - getRemainingSessionsForParticipant(b.id);
          break;
        case 'expiration':
          const expA = getEarliestExpirationForParticipant(a.id) || '9999-12-31';
          const expB = getEarliestExpirationForParticipant(b.id) || '9999-12-31';
          comparison = expA.localeCompare(expB);
          break;
        case 'age':
          comparison = (a.age || 0) - (b.age || 0);
          break;
      }
      return participantSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [participants, settings.participantSortField, settings.participantSortDirection, getRemainingSessionsForParticipant, getEarliestExpirationForParticipant]);

  // Get all unique dates with at least one session
  const datesWithSessions = useMemo(() => {
    const dateSet = new Set<string>();
    sessionsHistory.forEach((record) => {
      if (record.sessionCount > 0) {
        dateSet.add(record.date);
      }
    });
    return Array.from(dateSet)
      .sort((a, b) => a.localeCompare(b))
      .map((dateStr) => {
        // Parse YYYY-MM-DD as local date to avoid timezone issues
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      });
  }, [sessionsHistory]);

  // Generate dates for selected days within the date range (period mode)
  const periodDates = useMemo(() => {
    const result: Date[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (settings.recurringDays.length === 0) return result;

    const current = new Date(start);
    while (current <= end) {
      if (settings.recurringDays.includes(current.getDay())) {
        result.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return result;
  }, [startDate, endDate, settings.recurringDays]);

  // Choose which dates to display based on view mode
  const dates = viewMode === 'sessions' ? datesWithSessions : periodDates;

  const toggleDay = (dayValue: number) => {
    const newDays = settings.recurringDays.includes(dayValue)
      ? settings.recurringDays.filter((d) => d !== dayValue)
      : [...settings.recurringDays, dayValue];
    updateSettings({ recurringDays: newDays });
  };

  const handleSessionChange = (
    participantId: string,
    dateStr: string,
    value: number
  ) => {
    const currentSaved = getSessionsForDate(participantId, dateStr);
    if (value !== currentSaved) {
      setPendingChanges((prev) => ({
        ...prev,
        [participantId]: {
          ...prev[participantId],
          [dateStr]: value,
        },
      }));
    } else {
      setPendingChanges((prev) => {
        const updated = { ...prev };
        if (updated[participantId]) {
          delete updated[participantId][dateStr];
          if (Object.keys(updated[participantId]).length === 0) {
            delete updated[participantId];
          }
        }
        return updated;
      });
    }
  };

  const applyChanges = async () => {
    for (const [participantId, dates] of Object.entries(pendingChanges)) {
      for (const [dateStr, newCount] of Object.entries(dates)) {
        await updateSessionsForDate(participantId, dateStr, newCount);
      }
    }
    setPendingChanges({});
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatDateKey = (date: Date) => {
    // Format en YYYY-MM-DD sans conversion UTC pour éviter le décalage de timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Auto-mark past dates (> 2 weeks) with no participants as cancelled
  useEffect(() => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    twoWeeksAgo.setHours(0, 0, 0, 0);

    periodDates.forEach((date) => {
      const dateKey = formatDateKey(date);

      // Only check dates older than 2 weeks
      if (date >= twoWeeksAgo) return;

      // Skip if already has a marker
      if (getDateMarker(dateKey)) return;

      // Check if any participant has sessions on this date
      const hasAnySession = activeParticipants.some(
        (p) => getSessionsForDate(p.id, dateKey) > 0
      );

      // If no sessions, mark as cancelled
      if (!hasAnySession) {
        setDateMarker(dateKey, 'cancelled');
      }
    });
  }, [periodDates, activeParticipants]);

  const showEmptyPeriodMessage = viewMode === 'period' && (settings.recurringDays.length === 0 || periodDates.length === 0);
  const showEmptySessionsMessage = viewMode === 'sessions' && datesWithSessions.length === 0;

  return (
    <div className="space-y-8">
      {/* Configuration panel */}
      <Card>
        <SectionHeader icon="📅" title="Configuration du planning" />

        <div className="space-y-6">
          {/* View mode toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <Tooltip
              disabled={!settings.showTooltips}
              content={
                <div className="max-w-xs text-xs">
                  <div className="font-semibold text-accent mb-1">Mode historique</div>
                  <div className="text-subtext">
                    Affiche uniquement les dates où des séances ont été enregistrées.
                    Idéal pour corriger des erreurs de saisie ou consulter l'historique.
                  </div>
                </div>
              }
            >
              <div>
                <Toggle
                  active={viewMode === 'sessions'}
                  onClick={() => setViewMode(viewMode === 'sessions' ? 'period' : 'sessions')}
                >
                  📋 Historique seul
                </Toggle>
              </div>
            </Tooltip>
          </div>

          {/* Date range selector - only in period mode */}
          {viewMode === 'period' && (
            <div>
              <Label>Période à afficher</Label>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">Du</span>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">au</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Days selector - only in period mode */}
          {viewMode === 'period' && (
            <div>
              <Label>Jours de cours récurrents</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    size="sm"
                    variant={settings.recurringDays.includes(day.value) ? 'primary' : 'secondary'}
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Planning grid */}
      {showEmptyPeriodMessage ? (
        <Card noPadding>
          <EmptyState
            icon="📅"
            message={
              settings.recurringDays.length === 0
                ? "Sélectionnez au moins un jour de cours pour afficher le planning."
                : "Aucune date dans la période sélectionnée correspond aux jours choisis."
            }
          />
        </Card>
      ) : showEmptySessionsMessage ? (
        <Card noPadding>
          <EmptyState
            icon="📋"
            message="Aucune séance n'a encore été enregistrée."
          />
        </Card>
      ) : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead className="sticky left-0 z-10 !bg-overlay w-[120px] min-w-[120px]">
                    Participant
                  </TableHead>
                  <TableHead className="sticky left-[120px] z-10 !bg-overlay text-center">
                    <Tooltip
                      disabled={!settings.showTooltips}
                      content={
                        <div className="max-w-xs text-xs">
                          <div className="font-semibold text-accent mb-1">Séances restantes</div>
                          <div className="text-subtext">
                            Crédit de séances disponibles pour ce participant.
                            Se met à jour automatiquement quand vous enregistrez des participations.
                          </div>
                        </div>
                      }
                    >
                      <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                        Restant
                      </span>
                    </Tooltip>
                  </TableHead>
                  {dates.map((date) => {
                    const dateKey = formatDateKey(date);
                    const marker = getDateMarker(dateKey);
                    const markerClass = marker?.type === 'vacation'
                      ? '!bg-blue-500/30 text-blue-300'
                      : marker?.type === 'cancelled'
                      ? '!bg-orange-500/30 text-orange-300'
                      : marker?.type === 'sick'
                      ? '!bg-purple-500/30 text-purple-300'
                      : '';
                    const markerIcon = marker?.type === 'vacation'
                      ? '🏖️'
                      : marker?.type === 'cancelled'
                      ? '❌'
                      : marker?.type === 'sick'
                      ? '🤒'
                      : '';

                    return (
                      <TableHead
                        key={dateKey}
                        className={`text-center whitespace-nowrap cursor-pointer hover:bg-overlay/50 transition-colors ${markerClass}`}
                        onClick={() => setMarkerModal({ date: dateKey, dateLabel: formatDateHeader(date) })}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{formatDateHeader(date)}</span>
                          {markerIcon && <span className="text-xs">{markerIcon}</span>}
                        </div>
                      </TableHead>
                    );
                  })}
                </tr>
              </TableHeader>
              <TableBody>
                {activeParticipants.length === 0 ? (
                  <tr>
                    <TableCell
                      colSpan={dates.length + 2}
                      className="text-center py-12"
                    >
                      <div className="flex flex-col items-center gap-3 text-muted">
                        <span className="text-4xl opacity-50">👥</span>
                        <span>Aucun participant actif.</span>
                      </div>
                    </TableCell>
                  </tr>
                ) : (
                  activeParticipants.map((participant) => {
                    const remaining = getRemainingSessionsForParticipant(participant.id);
                    const expiration = getEarliestExpirationForParticipant(participant.id);
                    const sessionsIndicator = getSessionsIndicator(remaining);
                    const expirationIndicator = getExpirationIndicator(expiration);

                    const shouldHighlight = sessionsIndicator.pulse || expirationIndicator.pulse;
                    const hasExtraInfo = participant.email || participant.age || participant.notes;

                    return (
                      <TableRow key={participant.id} highlight={shouldHighlight}>
                        <TableCell
                          className={`font-medium sticky left-0 z-10 w-[120px] min-w-[120px] ${
                            shouldHighlight ? 'bg-red/10' : 'bg-surface'
                          }`}
                        >
                          <Tooltip
                            disabled={!hasExtraInfo}
                            content={<ParticipantTooltipContent email={participant.email} age={participant.age} notes={participant.notes} />}
                          >
                            <span className={hasExtraInfo ? 'border-b border-dashed border-muted/50 cursor-help' : ''}>
                              {participant.firstName} {participant.lastName.toUpperCase()}
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell className={`sticky left-[120px] z-10 text-center ${
                          shouldHighlight ? 'bg-red/10' : 'bg-surface'
                        }`}>
                          <Badge variant={sessionsIndicator.variant} pulse={sessionsIndicator.pulse}>
                            {remaining}
                          </Badge>
                        </TableCell>
                        {dates.map((date) => {
                          const dateKey = formatDateKey(date);
                          const savedValue = getSessionsForDate(participant.id, dateKey);
                          const displayValue = pendingChanges[participant.id]?.[dateKey] ?? savedValue;
                          const hasUnsavedChange = pendingChanges[participant.id]?.[dateKey] !== undefined;
                          const marker = getDateMarker(dateKey);
                          const cellMarkerClass = marker?.type === 'vacation'
                            ? '!bg-blue-500/30'
                            : marker?.type === 'cancelled'
                            ? '!bg-orange-500/30'
                            : marker?.type === 'sick'
                            ? '!bg-purple-500/30'
                            : '';

                          return (
                            <TableCell key={dateKey} className={`text-center ${cellMarkerClass}`}>
                              {marker ? (
                                <span className="text-lg opacity-60">
                                  {marker.type === 'vacation' ? '🏖️' : marker.type === 'cancelled' ? '❌' : '🤒'}
                                </span>
                              ) : (
                                <Select
                                  value={displayValue}
                                  onChange={(e) =>
                                    handleSessionChange(
                                      participant.id,
                                      dateKey,
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className={`w-14 text-center text-sm px-1 pr-6 py-1.5 ${
                                    hasUnsavedChange
                                      ? 'bg-yellow/20 border-yellow/50'
                                      : displayValue > 0
                                      ? 'bg-accentMuted border-accent/40'
                                      : ''
                                  }`}
                                >
                                  <option value={0}>0</option>
                                  <option value={1}>1</option>
                                  <option value={2}>2</option>
                                  <option value={3}>3</option>
                                </Select>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Apply button */}
          {hasChanges && (
            <div className="px-6 py-4 flex justify-end gap-3 bg-overlay/50 border-t border-border">
              <Button variant="secondary" onClick={() => setPendingChanges({})}>
                Annuler
              </Button>
              <Button variant="primary" onClick={applyChanges}>
                ✓ Appliquer les séances
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Modal pour marquer une date */}
      <Modal
        open={!!markerModal}
        onClose={() => setMarkerModal(null)}
      >
        <ModalTitle>📅 {markerModal?.dateLabel}</ModalTitle>
        <div className="space-y-3">
          <p className="text-sm text-muted mb-4">
            Marquer cette date comme :
          </p>
          <div className="flex flex-col gap-2">
            <Tooltip
              content={
                <div className="max-w-xs text-xs">
                  <div className="font-semibold text-orange-300 mb-1">Cours annulé</div>
                  <div className="text-subtext">
                    Pas assez de participants inscrits pour maintenir la séance.
                  </div>
                </div>
              }
            >
              <Button
                variant={getDateMarker(markerModal?.date || '')?.type === 'cancelled' ? 'primary' : 'secondary'}
                onClick={() => {
                  if (markerModal) {
                    setDateMarker(markerModal.date, 'cancelled');
                    setMarkerModal(null);
                  }
                }}
                className="justify-start w-full"
              >
                ❌ Cours annulé
              </Button>
            </Tooltip>
            <Tooltip
              content={
                <div className="max-w-xs text-xs">
                  <div className="font-semibold text-blue-300 mb-1">Vacances</div>
                  <div className="text-subtext">
                    Période de vacances, le coach n'est pas disponible.
                  </div>
                </div>
              }
            >
              <Button
                variant={getDateMarker(markerModal?.date || '')?.type === 'vacation' ? 'primary' : 'secondary'}
                onClick={() => {
                  if (markerModal) {
                    setDateMarker(markerModal.date, 'vacation');
                    setMarkerModal(null);
                  }
                }}
                className="justify-start w-full"
              >
                🏖️ Vacances
              </Button>
            </Tooltip>
            <Tooltip
              content={
                <div className="max-w-xs text-xs">
                  <div className="font-semibold text-purple-300 mb-1">Prof indisponible</div>
                  <div className="text-subtext">
                    Coach absent pour raison personnelle (rdv médical, maladie, ou autre).
                  </div>
                </div>
              }
            >
              <Button
                variant={getDateMarker(markerModal?.date || '')?.type === 'sick' ? 'primary' : 'secondary'}
                onClick={() => {
                  if (markerModal) {
                    setDateMarker(markerModal.date, 'sick');
                    setMarkerModal(null);
                  }
                }}
                className="justify-start w-full"
              >
                🤒 Prof indisponible
              </Button>
            </Tooltip>
            {getDateMarker(markerModal?.date || '') && (
              <Button
                variant="danger"
                onClick={() => {
                  if (markerModal) {
                    removeDateMarker(markerModal.date);
                    setMarkerModal(null);
                  }
                }}
                className="justify-start mt-2"
              >
                🗑️ Retirer le marqueur
              </Button>
            )}
          </div>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={() => setMarkerModal(null)}>
            Fermer
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}

export default Planning;
