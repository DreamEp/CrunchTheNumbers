import { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Input, Label, FormGroup, Toggle, Tooltip } from '../ui';
import { Participant } from '../../../shared/types';
import { ReportMode, ReportFilters as ReportFiltersType } from '../../../shared/reportTypes';
import { useAppStore } from '../../stores/useAppStore';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
  { value: 0, label: 'Dim' },
];

// Tooltips pour les options
const optionTooltips = {
  includeCancelled: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Inclure annulées dans la moyenne</div>
      <div className="text-subtext text-xs">
        Si coché, les jours où la séance a été annulée (pas assez de participants, météo, etc.)
        sont comptés dans le calcul de la moyenne de participants par séance.
      </div>
      <div className="text-[11px] text-muted mt-1 pt-1 border-t border-border">
        <span className="text-text">Exemple :</span> 10 participants sur 5 jours dont 2 annulés
        <br />
        • Coché : 10 ÷ 5 = <span className="text-accent">2.0</span> moy.
        <br />
        • Décoché : 10 ÷ 3 = <span className="text-accent">3.3</span> moy.
      </div>
    </div>
  ),
  includeVacationSick: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Inclure vacances/maladie dans la moyenne</div>
      <div className="text-subtext text-xs">
        Si coché, les jours marqués comme vacances ou maladie du coach
        sont comptés dans le calcul de la moyenne (avec 0 participant).
      </div>
      <div className="text-[11px] text-muted mt-1 pt-1 border-t border-border">
        Généralement décoché car ces jours n'étaient pas prévus pour avoir des séances.
      </div>
    </div>
  ),
  showRevenue: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Afficher les revenus</div>
      <div className="text-subtext text-xs">
        Affiche les informations financières dans le rapport :
        nombre de packs achetés, revenus totaux, et revenus par participant.
      </div>
      <div className="text-[11px] text-muted mt-1 pt-1 border-t border-border">
        Utile pour la comptabilité. Peut être masqué pour un rapport centré sur l'assiduité.
      </div>
    </div>
  ),
  reportDays: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Jours à inclure</div>
      <div className="text-subtext text-xs">
        Sélectionnez les jours de la semaine à prendre en compte pour les calculs du rapport.
      </div>
      <div className="text-[11px] text-muted mt-1 pt-1 border-t border-border">
        Par défaut : jours récurrents définis dans les paramètres.
        Modifier ici n'affecte que ce rapport.
      </div>
    </div>
  ),
};

interface ReportFiltersProps {
  participants: Participant[];
  filters: ReportFiltersType;
  onFiltersChange: (filters: ReportFiltersType) => void;
  onGenerate: () => void;
}

function getParticipantsWithPacksInRange(
  participants: Participant[],
  startDate: string,
  endDate: string
): Participant[] {
  return participants.filter((p) => {
    if (p.status !== 'active') return false;
    return p.creditPacks.some((pack) => {
      return pack.purchaseDate <= endDate && pack.expirationDate >= startDate;
    });
  });
}

function ReportFilters({
  participants,
  filters,
  onFiltersChange,
  onGenerate,
}: ReportFiltersProps) {
  const { settings } = useAppStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeParticipants = participants.filter((p) => p.status === 'active');

  const eligibleParticipants = useMemo(() => {
    if (filters.mode === 'individual') {
      return activeParticipants;
    }
    return getParticipantsWithPacksInRange(
      participants,
      filters.startDate,
      filters.endDate
    );
  }, [participants, filters.startDate, filters.endDate, filters.mode, activeParticipants]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (filters.mode === 'dateRange') {
      const eligibleIds = eligibleParticipants.map((p) => p.id);
      const validSelection = filters.selectedParticipantIds.filter((id) =>
        eligibleIds.includes(id)
      );

      if (validSelection.length === 0 && eligibleParticipants.length > 0) {
        onFiltersChange({
          ...filters,
          selectedParticipantIds: eligibleIds,
        });
      } else if (validSelection.length !== filters.selectedParticipantIds.length) {
        onFiltersChange({
          ...filters,
          selectedParticipantIds: validSelection,
        });
      }
    }
  }, [eligibleParticipants, filters.mode]);

  const handleModeChange = (mode: ReportMode) => {
    if (mode === 'individual') {
      onFiltersChange({
        ...filters,
        mode,
        selectedParticipantIds: [],
      });
    } else {
      const eligible = getParticipantsWithPacksInRange(
        participants,
        filters.startDate,
        filters.endDate
      );
      onFiltersChange({
        ...filters,
        mode,
        selectedParticipantIds: eligible.map((p) => p.id),
      });
    }
  };

  const handleStartDateChange = (newStartDate: string) => {
    let newEndDate = filters.endDate;
    if (filters.endDate < newStartDate) {
      newEndDate = newStartDate;
    }
    onFiltersChange({
      ...filters,
      startDate: newStartDate,
      endDate: newEndDate,
    });
  };

  const handleEndDateChange = (newEndDate: string) => {
    if (newEndDate >= filters.startDate) {
      onFiltersChange({ ...filters, endDate: newEndDate });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      selectedParticipantIds: checked ? eligibleParticipants.map((p) => p.id) : [],
    });
  };

  const handleParticipantToggle = (participantId: string) => {
    const newSelection = filters.selectedParticipantIds.includes(participantId)
      ? filters.selectedParticipantIds.filter((id) => id !== participantId)
      : [...filters.selectedParticipantIds, participantId];

    onFiltersChange({
      ...filters,
      selectedParticipantIds: newSelection,
    });
  };

  const handleIndividualSelect = (participantId: string) => {
    onFiltersChange({
      ...filters,
      selectedParticipantIds: participantId ? [participantId] : [],
    });
  };

  const allSelected =
    eligibleParticipants.length > 0 &&
    filters.selectedParticipantIds.length === eligibleParticipants.length;
  const someSelected =
    filters.selectedParticipantIds.length > 0 &&
    filters.selectedParticipantIds.length < eligibleParticipants.length;

  const selectedParticipant =
    filters.mode === 'individual' && filters.selectedParticipantIds.length === 1
      ? participants.find((p) => p.id === filters.selectedParticipantIds[0])
      : null;

  const individualPeriod = useMemo(() => {
    if (!selectedParticipant) return null;

    const packs = selectedParticipant.creditPacks;
    if (packs.length === 0) return null;

    const sortedPacks = [...packs].sort(
      (a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
    );

    const firstDate = sortedPacks[0].purchaseDate;
    const today = new Date().toISOString().split('T')[0];

    return {
      start: new Date(firstDate).toLocaleDateString('fr-FR'),
      end: new Date(today).toLocaleDateString('fr-FR'),
    };
  }, [selectedParticipant]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Toggle
          active={filters.mode === 'dateRange'}
          onClick={() => handleModeChange('dateRange')}
        >
          Par dates
        </Toggle>
        <Toggle
          active={filters.mode === 'individual'}
          onClick={() => handleModeChange('individual')}
        >
          Par personne
        </Toggle>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {filters.mode === 'dateRange' ? (
          <>
            <FormGroup className="w-40">
              <Label>Date début</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </FormGroup>

            <FormGroup className="w-40">
              <Label>Date fin</Label>
              <Input
                type="date"
                value={filters.endDate}
                min={filters.startDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </FormGroup>

            <FormGroup className="relative w-64" ref={dropdownRef}>
              <Label>Participants</Label>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="
                  w-full
                  bg-overlay border border-border rounded-lg
                  px-4 py-2.5
                  text-sm text-text text-left
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
                  flex items-center justify-between
                "
              >
                <span className="truncate">
                  {eligibleParticipants.length === 0
                    ? 'Aucun participant'
                    : allSelected
                    ? 'Tous les participants'
                    : `${filters.selectedParticipantIds.length} sélectionné(s)`}
                </span>
                <span className="text-muted ml-2">
                  {dropdownOpen ? '▲' : '▼'}
                </span>
              </button>

              {dropdownOpen && (
                <div className="
                  absolute z-50 mt-1 w-full
                  bg-surface border border-border rounded-lg
                  shadow-xl shadow-black/30
                  max-h-64 overflow-y-auto
                ">
                  {eligibleParticipants.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-subtext">
                      Aucun participant avec des séances sur cette période
                    </div>
                  ) : (
                    <>
                      <label className="
                        flex items-center gap-3 px-4 py-3
                        border-b border-border
                        cursor-pointer hover:bg-overlay
                      ">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(input) => {
                            if (input) input.indeterminate = someSelected;
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                        />
                        <span className="font-medium">Tout sélectionner</span>
                      </label>

                      {eligibleParticipants.map((participant) => (
                        <label
                          key={participant.id}
                          className="
                            flex items-center gap-3 px-4 py-2
                            cursor-pointer hover:bg-overlay
                          "
                        >
                          <input
                            type="checkbox"
                            checked={filters.selectedParticipantIds.includes(
                              participant.id
                            )}
                            onChange={() => handleParticipantToggle(participant.id)}
                            className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                          />
                          <span>
                            {participant.firstName} {participant.lastName}
                          </span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              )}
            </FormGroup>
          </>
        ) : (
          <FormGroup className="w-64">
            <Label>Sélectionner un participant</Label>
            <select
              value={filters.selectedParticipantIds[0] || ''}
              onChange={(e) => handleIndividualSelect(e.target.value)}
              className="
                w-full
                bg-overlay border border-border rounded-lg
                px-4 py-2.5
                text-sm text-text
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
              "
            >
              <option value="">-- Choisir --</option>
              {activeParticipants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.firstName} {participant.lastName}
                </option>
              ))}
            </select>
          </FormGroup>
        )}

        <Button
          onClick={onGenerate}
          disabled={
            filters.selectedParticipantIds.length === 0 ||
            (filters.mode === 'dateRange' &&
              (!filters.startDate || !filters.endDate))
          }
        >
          Générer
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-6 text-sm">
        {filters.mode === 'dateRange' && (
          <>
            <Tooltip disabled={!settings.showTooltips} content={optionTooltips.includeCancelled}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.includeCancelledInAverage}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      includeCancelledInAverage: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className={settings.showTooltips ? 'text-subtext border-b border-dotted border-muted' : 'text-subtext'}>
                  Inclure annulées dans la moyenne
                </span>
              </label>
            </Tooltip>

            <Tooltip disabled={!settings.showTooltips} content={optionTooltips.includeVacationSick}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.includeVacationSickInAverage}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      includeVacationSickInAverage: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className={settings.showTooltips ? 'text-subtext border-b border-dotted border-muted' : 'text-subtext'}>
                  Inclure vacances/maladie dans la moyenne
                </span>
              </label>
            </Tooltip>
          </>
        )}

        <Tooltip disabled={!settings.showTooltips} content={optionTooltips.showRevenue}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showRevenue}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  showRevenue: e.target.checked,
                })
              }
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
            />
            <span className={settings.showTooltips ? 'text-subtext border-b border-dotted border-muted' : 'text-subtext'}>
              Afficher les revenus
            </span>
          </label>
        </Tooltip>
      </div>

      {filters.mode === 'dateRange' && (
        <div className="flex flex-wrap items-center gap-3">
          <Tooltip disabled={!settings.showTooltips} content={optionTooltips.reportDays}>
            <span className={`text-sm ${settings.showTooltips ? 'text-subtext border-b border-dotted border-muted cursor-help' : 'text-subtext'}`}>
              Jours à inclure :
            </span>
          </Tooltip>
          <div className="flex flex-wrap gap-1.5">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = (filters.reportDays ?? settings.recurringDays).includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => {
                    const currentDays = filters.reportDays ?? settings.recurringDays;
                    const newDays = isSelected
                      ? currentDays.filter((d) => d !== day.value)
                      : [...currentDays, day.value];
                    onFiltersChange({
                      ...filters,
                      reportDays: newDays.length > 0 ? newDays : currentDays,
                    });
                  }}
                  className={`
                    px-2.5 py-1 text-xs font-medium rounded-md
                    transition-all duration-200
                    ${
                      isSelected
                        ? 'bg-accent text-base text-white'
                        : 'bg-overlay text-subtext hover:bg-surface border border-border'
                    }
                  `}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedParticipant && individualPeriod && (
        <div className="text-sm text-subtext">
          Rapport historique complet pour{' '}
          <span className="text-accent font-medium">
            {selectedParticipant.firstName} {selectedParticipant.lastName}
          </span>
          {' '}depuis le{' '}
          <span className="text-text">{individualPeriod.start}</span>
          {' '}jusqu'au{' '}
          <span className="text-text">{individualPeriod.end}</span>
        </div>
      )}
    </div>
  );
}

export { ReportFilters };
