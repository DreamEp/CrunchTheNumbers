import { ParticipantReportDetail } from '../../../shared/reportTypes';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Tooltip,
} from '../ui';
import { getSessionsIndicator, getExpirationIndicator, formatDate } from '../../utils/indicators';
import { useAppStore } from '../../stores/useAppStore';

interface ReportDetailsProps {
  details: ParticipantReportDetail[];
  showRevenue: boolean;
}

function getAttendanceBadgeVariant(
  rate: number
): 'success' | 'warning' | 'danger' {
  if (rate >= 80) return 'success';
  if (rate >= 50) return 'warning';
  return 'danger';
}

// Tooltips pour les colonnes du tableau
const columnTooltips = {
  nom: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Nom</div>
      <div className="text-subtext text-xs">
        Nom de famille du participant.
      </div>
    </div>
  ),
  prenom: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Prénom</div>
      <div className="text-subtext text-xs">
        Prénom du participant.
      </div>
    </div>
  ),
  assistees: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Séances assistées</div>
      <div className="text-subtext text-xs">
        Nombre de séances PASSÉES auxquelles le participant a effectivement participé sur la période sélectionnée.
      </div>
      <div className="text-[10px] text-muted mt-1 pt-1 border-t border-border">
        Note : Les séances futures ne sont pas comptées ici.
      </div>
    </div>
  ),
  aVenir: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Séances à venir</div>
      <div className="text-subtext text-xs">
        Nombre de séances FUTURES planifiées où le participant a encore des crédits disponibles.
      </div>
      <div className="text-[10px] text-muted mt-1 pt-1 border-t border-border">
        Note : Exclut les jours marqués vacances/maladie.
      </div>
    </div>
  ),
  achetees: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Séances achetées</div>
      <div className="text-subtext text-xs">
        Nombre total de séances contenues dans les packs achetés par ce participant sur la période
        (date d'achat du pack dans la période).
      </div>
    </div>
  ),
  manquees: (
    <div className="max-w-xs">
      <div className="font-semibold text-red mb-1">Séances manquées</div>
      <div className="text-subtext text-xs">
        Inclut les séances annulées où vous aviez des crédits.
      </div>
      <div className="text-subtext text-[11px] mt-1">
        <span className="text-muted">Responsabilité partagée :</span> si plusieurs personnes manquent, la séance est annulée.
      </div>
      <div className="text-[10px] text-muted mt-1 pt-1 border-t border-border">
        Format : standard (avec annulées)
      </div>
    </div>
  ),
  taux: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Taux de présence</div>
      <div className="text-subtext text-xs">
        <span className="text-text font-medium">Formule :</span> (Assistées / Séances possibles) × 100
      </div>
      <div className="text-subtext text-[11px] mt-1">
        <span className="text-muted">Séances possibles =</span> Jours PASSÉS où le participant avait des crédits + séances annulées.
      </div>
      <div className="text-[11px] pt-1 border-t border-border mt-1">
        <span className="text-green">80%+ :</span> Excellent |{' '}
        <span className="text-yellow">50-79% :</span> Moyen |{' '}
        <span className="text-red">&lt;50% :</span> Faible
      </div>
      <div className="text-[10px] text-muted mt-1 pt-1 border-t border-border">
        <span className="text-text">N/A</span> = Aucune séance passée dans la période
      </div>
    </div>
  ),
  restantes: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Séances restantes</div>
      <div className="text-subtext text-xs">
        Nombre de séances disponibles actuellement sur les packs actifs.
      </div>
      <div className="text-[11px] pt-1 border-t border-border mt-1">
        <span className="text-green">4+ :</span> OK |{' '}
        <span className="text-yellow">2-3 :</span> Attention |{' '}
        <span className="text-red">0-1 :</span> Urgent
      </div>
    </div>
  ),
  finValidite: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Fin de validité</div>
      <div className="text-subtext text-xs">
        Date d'expiration du pack le plus proche.
      </div>
      <div className="text-[11px] pt-1 border-t border-border mt-1">
        <span className="text-green">5+ sem :</span> OK |{' '}
        <span className="text-yellow">3-4 sem :</span> Attention |{' '}
        <span className="text-red">&lt;2 sem :</span> Urgent
      </div>
    </div>
  ),
  revenus: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Revenus contribués</div>
      <div className="text-subtext text-xs">
        Somme des montants payés par ce participant pour les packs achetés sur la période sélectionnée.
      </div>
    </div>
  ),
};

function ReportDetails({ details, showRevenue }: ReportDetailsProps) {
  const { settings } = useAppStore();

  if (details.length === 0) {
    return (
      <div className="text-center py-8 text-subtext">
        Aucun détail à afficher
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-subtext uppercase tracking-wider mb-3">
        Détails par participant
      </h3>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Tooltip disabled={!settings.showTooltips} content={columnTooltips.nom}>
                  <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                    Nom
                  </span>
                </Tooltip>
              </TableHead>
              <TableHead>
                <Tooltip disabled={!settings.showTooltips} content={columnTooltips.prenom}>
                  <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                    Prénom
                  </span>
                </Tooltip>
              </TableHead>
              <TableHead className="text-center">
                <Tooltip disabled={!settings.showTooltips} content={columnTooltips.assistees}>
                  <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                    Assistées
                  </span>
                </Tooltip>
              </TableHead>
              <TableHead className="text-center">
                <Tooltip disabled={!settings.showTooltips} content={columnTooltips.aVenir}>
                  <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                    À venir
                  </span>
                </Tooltip>
              </TableHead>
              <TableHead className="text-center">
                <Tooltip disabled={!settings.showTooltips} content={columnTooltips.achetees}>
                  <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                    Achetées
                  </span>
                </Tooltip>
              </TableHead>
              <TableHead className="text-center">
                <Tooltip disabled={!settings.showTooltips} content={columnTooltips.manquees}>
                  <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                    Manquées
                  </span>
                </Tooltip>
              </TableHead>
              <TableHead className="text-center">
                <Tooltip disabled={!settings.showTooltips} content={columnTooltips.taux}>
                  <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                    Taux
                  </span>
                </Tooltip>
              </TableHead>
              <TableHead className="text-center">
                <Tooltip disabled={!settings.showTooltips} content={columnTooltips.restantes}>
                  <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                    Restantes
                  </span>
                </Tooltip>
              </TableHead>
              <TableHead className="text-center">
                <Tooltip disabled={!settings.showTooltips} content={columnTooltips.finValidite}>
                  <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                    Fin validité
                  </span>
                </Tooltip>
              </TableHead>
              {showRevenue && (
                <TableHead className="text-right">
                  <Tooltip disabled={!settings.showTooltips} content={columnTooltips.revenus}>
                    <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                      Revenus
                    </span>
                  </Tooltip>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {details.map((detail) => {
              const sessionsIndicator = getSessionsIndicator(detail.remainingSessions);
              const expirationIndicator = getExpirationIndicator(detail.earliestExpiration);

              return (
                <TableRow key={detail.participant.id}>
                  <TableCell className="font-medium">
                    {detail.participant.lastName}
                  </TableCell>
                  <TableCell>{detail.participant.firstName}</TableCell>
                  <TableCell className="text-center">
                    {detail.sessionsAttended}
                  </TableCell>
                  <TableCell className="text-center text-accent">
                    {detail.sessionsUpcoming}
                  </TableCell>
                  <TableCell className="text-center">
                    {detail.sessionsPurchased}
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip
                      disabled={!settings.showTooltips}
                      content={
                        <div className="text-xs">
                          <div>Standard : {detail.sessionsMissed}</div>
                          <div>Avec annulées : {detail.sessionsMissedWithCancelled}</div>
                        </div>
                      }
                    >
                      <span className={settings.showTooltips ? 'cursor-help' : ''}>
                        {detail.sessionsMissed}
                        {detail.sessionsMissedWithCancelled > detail.sessionsMissed && (
                          <span className="text-muted"> ({detail.sessionsMissedWithCancelled})</span>
                        )}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-center">
                    {detail.attendanceRate !== null ? (
                      <Badge variant={getAttendanceBadgeVariant(detail.attendanceRate)}>
                        {detail.attendanceRate.toFixed(0)}%
                      </Badge>
                    ) : (
                      <span className="text-muted text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={sessionsIndicator.variant} pulse={sessionsIndicator.pulse}>
                      {detail.remainingSessions}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {detail.earliestExpiration ? (
                      <Badge variant={expirationIndicator.variant} pulse={expirationIndicator.pulse}>
                        {formatDate(detail.earliestExpiration)}
                      </Badge>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </TableCell>
                  {showRevenue && (
                    <TableCell className="text-right">
                      {detail.revenueContributed.toFixed(2)} €
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export { ReportDetails };
