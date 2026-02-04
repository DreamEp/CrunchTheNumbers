import { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import {
  getSessionsIndicator,
  getExpirationIndicator,
  formatDate,
  formatPrice,
  calculateTotalReceived,
} from '../../utils/indicators';
import { Participant, ParticipantSortField } from '../../../shared/types';
import {
  Card,
  Button,
  Badge,
  Toggle,
  SubTabs,
  SubTab,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
  ModalTitle,
  ModalDescription,
  ModalActions,
  EmptyState,
  Tooltip,
  ParticipantTooltipContent,
} from '../ui';

type ViewMode = 'active' | 'hidden' | 'archived';

function Dashboard() {
  const {
    participants,
    archive,
    settings,
    updateSettings,
    updateParticipant,
    hideParticipant,
    archiveParticipant,
    restoreParticipant,
    getRemainingSessionsForParticipant,
    getEarliestExpirationForParticipant,
  } = useAppStore();

  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const sortField = settings.participantSortField;
  const sortDirection = settings.participantSortDirection;
  const [confirmAction, setConfirmAction] = useState<{
    type: 'hide' | 'archive' | 'restore';
    participant: Participant;
  } | null>(null);

  // Filter participants by status
  const activeParticipants = useMemo(() => {
    return participants.filter((p) => p.status === 'active');
  }, [participants]);

  const hiddenParticipants = useMemo(() => {
    return participants.filter((p) => p.status === 'hidden');
  }, [participants]);

  // Get current list based on view mode
  const currentList = useMemo(() => {
    switch (viewMode) {
      case 'active':
        return activeParticipants;
      case 'hidden':
        return hiddenParticipants;
      case 'archived':
        return archive;
      default:
        return activeParticipants;
    }
  }, [viewMode, activeParticipants, hiddenParticipants, archive]);

  // Sort participants
  const sortedParticipants = useMemo(() => {
    return [...currentList].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
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
          comparison =
            getRemainingSessionsForParticipant(a.id) -
            getRemainingSessionsForParticipant(b.id);
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
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [currentList, sortField, sortDirection, getRemainingSessionsForParticipant, getEarliestExpirationForParticipant]);

  const handleSort = (field: ParticipantSortField) => {
    if (sortField === field) {
      updateSettings({ participantSortDirection: sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      updateSettings({ participantSortField: field, participantSortDirection: 'asc' });
    }
  };

  const handleRestore = (participant: Participant) => {
    if (viewMode === 'hidden') {
      updateParticipant(participant.id, { status: 'active' });
    } else if (viewMode === 'archived') {
      restoreParticipant(participant.id);
    }
  };

  const totalReceived = calculateTotalReceived(participants);

  return (
    <div className="space-y-8">
      {/* View mode tabs + Options */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        {/* View mode selector */}
        <SubTabs>
          <SubTab
            active={viewMode === 'active'}
            onClick={() => setViewMode('active')}
          >
            👥 Actifs ({activeParticipants.length})
          </SubTab>
          <SubTab
            active={viewMode === 'hidden'}
            onClick={() => setViewMode('hidden')}
          >
            👁️ Masqués ({hiddenParticipants.length})
          </SubTab>
          <SubTab
            active={viewMode === 'archived'}
            onClick={() => setViewMode('archived')}
          >
            📦 Archivés ({archive.length})
          </SubTab>
        </SubTabs>

        {/* Display options */}
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            active={settings.showPricePerParticipant}
            onClick={() => updateSettings({ showPricePerParticipant: !settings.showPricePerParticipant })}
          >
            Prix par participant
          </Toggle>
          <Toggle
            active={settings.showTotalReceived}
            onClick={() => updateSettings({ showTotalReceived: !settings.showTotalReceived })}
          >
            Total reçu
          </Toggle>
        </div>
      </div>

      {/* Total received banner */}
      {settings.showTotalReceived && (
        <Card className="px-5 py-4 flex items-center justify-between">
          <span className="text-subtext">Total des paiements reçus</span>
          <span className="text-lg font-semibold text-accent">
            {formatPrice(totalReceived)}
          </span>
        </Card>
      )}

      {/* Participants table */}
      <Card noPadding>
        {sortedParticipants.length === 0 ? (
          <EmptyState
            icon={viewMode === 'active' ? '👥' : viewMode === 'hidden' ? '👁️' : '📦'}
            message={
              viewMode === 'active'
                ? "Aucun participant actif. Ajoutez-en un dans l'onglet Gestion."
                : viewMode === 'hidden'
                ? 'Aucun participant masqué.'
                : 'Aucun participant archivé.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead
                    sortable
                    sorted={sortField === 'name' ? sortDirection : false}
                    onClick={() => handleSort('name')}
                  >
                    Nom
                  </TableHead>
                  <TableHead
                    sortable
                    sorted={sortField === 'firstName' ? sortDirection : false}
                    onClick={() => handleSort('firstName')}
                  >
                    Prénom
                  </TableHead>
                  {viewMode === 'active' && (
                    <>
                      <TableHead
                        className="text-center"
                        sortable
                        sorted={sortField === 'sessions' ? sortDirection : false}
                        onClick={() => handleSort('sessions')}
                      >
                        <Tooltip
                          disabled={!settings.showTooltips}
                          content={
                            <div className="max-w-xs text-xs">
                              <div className="font-semibold text-accent mb-1">Total séances achetées</div>
                              <div className="text-subtext">
                                Nombre total de séances achetées par ce participant (tous packs confondus).
                              </div>
                            </div>
                          }
                        >
                          <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                            Séances
                          </span>
                        </Tooltip>
                      </TableHead>
                      <TableHead
                        className="text-center"
                        sortable
                        sorted={sortField === 'remaining' ? sortDirection : false}
                        onClick={() => handleSort('remaining')}
                      >
                        <Tooltip
                          disabled={!settings.showTooltips}
                          content={
                            <div className="max-w-xs text-xs">
                              <div className="font-semibold text-accent mb-1">Séances restantes</div>
                              <div className="text-subtext">
                                Nombre de séances encore disponibles sur les packs actifs.
                              </div>
                              <div className="text-[11px] pt-1 border-t border-border mt-1">
                                <span className="text-green">4+ :</span> OK |{' '}
                                <span className="text-yellow">2-3 :</span> Attention |{' '}
                                <span className="text-red">0-1 :</span> Urgent
                              </div>
                            </div>
                          }
                        >
                          <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                            Restantes
                          </span>
                        </Tooltip>
                      </TableHead>
                      <TableHead
                        className="text-center"
                        sortable
                        sorted={sortField === 'expiration' ? sortDirection : false}
                        onClick={() => handleSort('expiration')}
                      >
                        <Tooltip
                          disabled={!settings.showTooltips}
                          content={
                            <div className="max-w-xs text-xs">
                              <div className="font-semibold text-accent mb-1">Fin de validité</div>
                              <div className="text-subtext">
                                Date d'expiration du pack le plus proche de sa fin.
                              </div>
                              <div className="text-[11px] pt-1 border-t border-border mt-1">
                                <span className="text-green">5+ sem :</span> OK |{' '}
                                <span className="text-yellow">3-4 sem :</span> Attention |{' '}
                                <span className="text-red">&lt;2 sem :</span> Urgent
                              </div>
                            </div>
                          }
                        >
                          <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                            Fin validité
                          </span>
                        </Tooltip>
                      </TableHead>
                      {settings.showPricePerParticipant && (
                        <TableHead className="text-center">Total payé</TableHead>
                      )}
                    </>
                  )}
                  <TableHead className="text-right w-[1%] whitespace-nowrap">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {sortedParticipants.map((participant) => {
                  const remaining = getRemainingSessionsForParticipant(participant.id);
                  const expiration = getEarliestExpirationForParticipant(participant.id);
                  const sessionsIndicator = getSessionsIndicator(remaining);
                  const expirationIndicator = getExpirationIndicator(expiration);
                  const totalSessions = participant.creditPacks.reduce(
                    (sum, pack) => sum + pack.sessionCount,
                    0
                  );

                  const shouldHighlight = sessionsIndicator.pulse || expirationIndicator.pulse;

                  const hasExtraInfo = participant.email || participant.age || participant.notes;

                  return (
                    <TableRow key={participant.id} highlight={shouldHighlight}>
                      <TableCell className="font-medium">
                        <Tooltip
                          disabled={!hasExtraInfo}
                          content={<ParticipantTooltipContent email={participant.email} age={participant.age} notes={participant.notes} />}
                        >
                          <span className={hasExtraInfo ? 'border-b border-dashed border-muted/50 cursor-help' : ''}>
                            {participant.lastName.toUpperCase()}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-subtext">
                        <Tooltip
                          disabled={!hasExtraInfo}
                          content={<ParticipantTooltipContent email={participant.email} age={participant.age} notes={participant.notes} />}
                        >
                          <span className={hasExtraInfo ? 'border-b border-dashed border-muted/50 cursor-help' : ''}>
                            {participant.firstName}
                          </span>
                        </Tooltip>
                      </TableCell>
                      {viewMode === 'active' && (
                        <>
                          <TableCell className="text-center text-subtext">
                            {totalSessions}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={sessionsIndicator.variant} pulse={sessionsIndicator.pulse}>
                              {remaining}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {expiration ? (
                              <Badge variant={expirationIndicator.variant} pulse={expirationIndicator.pulse}>
                                {formatDate(expiration)}
                              </Badge>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </TableCell>
                          {settings.showPricePerParticipant && (
                            <TableCell className="text-center text-subtext">
                              {formatPrice(participant.totalPaid)}
                            </TableCell>
                          )}
                        </>
                      )}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {viewMode === 'active' ? (
                            <>
                              <Tooltip
                                disabled={!settings.showTooltips}
                                content={
                                  <div className="max-w-xs text-xs">
                                    <div className="font-semibold text-yellow mb-1">Masquer</div>
                                    <div className="text-subtext">
                                      Cache le participant du tableau principal sans le supprimer.
                                      Utile pour les participants temporairement inactifs.
                                      Restaurable depuis l'onglet "Masqués".
                                    </div>
                                  </div>
                                }
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setConfirmAction({ type: 'hide', participant })}
                                >
                                  👁️ Masquer
                                </Button>
                              </Tooltip>
                              <Tooltip
                                disabled={!settings.showTooltips}
                                content={
                                  <div className="max-w-xs text-xs">
                                    <div className="font-semibold text-red mb-1">Archiver</div>
                                    <div className="text-subtext">
                                      Déplace le participant vers les archives.
                                      Utilisez cette action pour les participants qui ne reviendront plus.
                                      Restaurable depuis l'onglet "Archivés".
                                    </div>
                                  </div>
                                }
                              >
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setConfirmAction({ type: 'archive', participant })}
                                >
                                  📦
                                </Button>
                              </Tooltip>
                            </>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleRestore(participant)}
                            >
                              ↩️ Restaurer
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Confirmation modal */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
      >
        <ModalTitle>
          {confirmAction?.type === 'hide' ? '👁️ Masquer' : '📦 Archiver'} le participant ?
        </ModalTitle>
        <ModalDescription>
          <strong>{confirmAction?.participant.firstName} {confirmAction?.participant.lastName}</strong>
          {confirmAction?.type === 'hide'
            ? ' sera masqué du tableau principal mais pourra être restauré.'
            : ' sera déplacé dans les archives.'}
        </ModalDescription>
        <ModalActions>
          <Button variant="secondary" onClick={() => setConfirmAction(null)}>
            Annuler
          </Button>
          <Button
            variant={confirmAction?.type === 'hide' ? 'secondary' : 'danger'}
            onClick={() => {
              if (confirmAction?.type === 'hide') {
                hideParticipant(confirmAction.participant.id);
              } else if (confirmAction) {
                archiveParticipant(confirmAction.participant.id);
              }
              setConfirmAction(null);
            }}
          >
            Confirmer
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}

export default Dashboard;
