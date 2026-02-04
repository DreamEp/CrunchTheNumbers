import { ReportSummary as ReportSummaryType } from '../../../shared/reportTypes';
import { Tooltip } from '../ui';
import { StatCard } from './StatCard';
import { useAppStore } from '../../stores/useAppStore';

interface ReportSummaryProps {
  summary: ReportSummaryType;
  showRevenue: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Tooltips pour les statistiques
const tooltips = {
  sessionsRealisees: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Séances réalisées</div>
      <div className="text-subtext text-xs">
        Nombre total de séances effectuées par tous les participants sur la période sélectionnée.
        Chaque participation d'un participant compte comme une séance.
      </div>
    </div>
  ),
  sessionsAnnulees: (
    <div className="max-w-xs">
      <div className="font-semibold text-red mb-1">Séances annulées</div>
      <div className="text-subtext text-xs">
        Jours de cours prévus qui n'ont pas eu lieu sur la période (dates passées uniquement).
      </div>
      <div className="text-subtext text-[11px] mt-1">
        <span className="text-muted">Causes possibles :</span>
        <ul className="list-disc list-inside mt-0.5">
          <li>Pas assez de participants</li>
          <li>Météo défavorable</li>
          <li>Autre raison</li>
        </ul>
      </div>
      <div className="text-[10px] text-muted mt-1 pt-1 border-t border-border">
        Note : Une séance sans participation enregistrée est automatiquement considérée comme annulée
        (sauf si marquée vacances/maladie).
      </div>
    </div>
  ),
  vacances: (
    <div className="max-w-xs">
      <div className="font-semibold text-peach mb-1">Vacances</div>
      <div className="text-subtext text-xs">
        Nombre de jours de cours marqués comme "vacances" sur la période.
        Jours fériés ou périodes de congés planifiées.
      </div>
    </div>
  ),
  maladie: (
    <div className="max-w-xs">
      <div className="font-semibold text-yellow mb-1">Maladie</div>
      <div className="text-subtext text-xs">
        Nombre de jours de cours marqués comme "maladie" sur la période.
        Séances non tenues pour cause de maladie du coach.
      </div>
    </div>
  ),
  moyenne: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Moyenne par séance</div>
      <div className="text-subtext text-xs">
        Nombre moyen de participants par jour de cours.
        Calculé en divisant le total des séances réalisées par le nombre de jours de cours effectifs.
      </div>
    </div>
  ),
  packsAchetes: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Packs achetés</div>
      <div className="text-subtext text-xs">
        Nombre de packs de séances achetés par les participants dont la date d'achat est dans la période sélectionnée.
      </div>
    </div>
  ),
  revenus: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Revenus</div>
      <div className="text-subtext text-xs">
        Somme totale des paiements reçus pour les packs achetés sur la période.
        Correspond au chiffre d'affaires généré.
      </div>
    </div>
  ),
  plusAssidu: (
    <div className="max-w-xs">
      <div className="font-semibold text-green mb-1">Plus assidu</div>
      <div className="text-subtext text-xs">
        Participant avec le meilleur taux de présence sur la période.
        Le taux est calculé : (séances assistées / séances possibles) × 100.
      </div>
    </div>
  ),
  moinsAssidu: (
    <div className="max-w-xs">
      <div className="font-semibold text-red mb-1">Moins assidu</div>
      <div className="text-subtext text-xs">
        Participant avec le taux de présence le plus faible sur la période
        (parmi ceux qui avaient des séances disponibles).
      </div>
    </div>
  ),
  seancePlusRemplie: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Séance la plus remplie</div>
      <div className="text-subtext text-xs">
        Date du cours ayant réuni le plus grand nombre de participants sur la période.
      </div>
    </div>
  ),
  seanceMoinsRemplie: (
    <div className="max-w-xs">
      <div className="font-semibold text-yellow mb-1">Séance la moins remplie</div>
      <div className="text-subtext text-xs">
        Date du cours ayant réuni le moins de participants sur la période
        (parmi les cours qui ont eu lieu).
      </div>
    </div>
  ),
  jourPopulaire: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Jour le plus populaire</div>
      <div className="text-subtext text-xs">
        Jour de la semaine avec la meilleure moyenne de fréquentation.
        Utile pour identifier les créneaux les plus demandés.
      </div>
    </div>
  ),
  aVenir: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Séances à venir</div>
      <div className="text-subtext text-xs">
        Séances planifiées dans la période qui n'ont pas encore eu lieu.
      </div>
      <div className="text-[10px] text-muted mt-1 pt-1 border-t border-border">
        Note : Exclut les vacances et maladies marquées.
      </div>
    </div>
  ),
  moyenneRestantes: (
    <div className="max-w-xs">
      <div className="font-semibold text-accent mb-1">Moyenne restantes</div>
      <div className="text-subtext text-xs">
        Moyenne des séances restantes par participant sélectionné.
      </div>
    </div>
  ),
  expirentBientot: (
    <div className="max-w-xs">
      <div className="font-semibold text-yellow mb-1">Expirent bientôt</div>
      <div className="text-subtext text-xs">
        Participants dont un pack expire dans moins de 2 semaines.
      </div>
    </div>
  ),
  plusRestantes: (
    <div className="max-w-xs">
      <div className="font-semibold text-green mb-1">Plus de séances restantes</div>
      <div className="text-subtext text-xs">
        Participant avec le plus grand nombre de séances disponibles.
      </div>
    </div>
  ),
  moinsRestantes: (
    <div className="max-w-xs">
      <div className="font-semibold text-yellow mb-1">Moins de séances restantes</div>
      <div className="text-subtext text-xs">
        Participant avec le moins de séances disponibles (parmi ceux qui en ont).
      </div>
    </div>
  ),
  plusAssiste: (
    <div className="max-w-xs">
      <div className="font-semibold text-green mb-1">Plus de séances assistées</div>
      <div className="text-subtext text-xs">
        Participant ayant participé au plus grand nombre de séances sur la période.
      </div>
    </div>
  ),
  plusManquees: (
    <div className="max-w-xs">
      <div className="font-semibold text-red mb-1">Plus de séances manquées</div>
      <div className="text-subtext text-xs">
        Participant ayant manqué le plus de séances (incluant les annulations).
      </div>
    </div>
  ),
  expirePlusTot: (
    <div className="max-w-xs">
      <div className="font-semibold text-yellow mb-1">Expire le plus tôt</div>
      <div className="text-subtext text-xs">
        Participant dont le pack expire le plus tôt.
      </div>
    </div>
  ),
};

function ReportSummary({ summary, showRevenue }: ReportSummaryProps) {
  const { settings } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-subtext uppercase tracking-wider mb-3">
          Résumé
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          <StatCard
            label="Séances réalisées"
            value={summary.totalSessionsCompleted}
            variant="default"
            tooltip={tooltips.sessionsRealisees}
            tooltipDisabled={!settings.showTooltips}
          />
          <StatCard
            label="Séances annulées"
            value={summary.totalSessionsCancelled}
            variant="cancelled"
            tooltip={tooltips.sessionsAnnulees}
            tooltipDisabled={!settings.showTooltips}
          />
          <StatCard
            label="Vacances"
            value={summary.totalSessionsVacation}
            variant="vacation"
            tooltip={tooltips.vacances}
            tooltipDisabled={!settings.showTooltips}
          />
          <StatCard
            label="Maladie"
            value={summary.totalSessionsSick}
            variant="sick"
            tooltip={tooltips.maladie}
            tooltipDisabled={!settings.showTooltips}
          />
          <StatCard
            label="À venir"
            value={summary.totalSessionsUpcoming}
            variant="accent"
            tooltip={tooltips.aVenir}
            tooltipDisabled={!settings.showTooltips}
          />
          <StatCard
            label="Moyenne/séance"
            value={summary.averagePeoplePerSession.toFixed(1)}
            variant="default"
            tooltip={tooltips.moyenne}
            tooltipDisabled={!settings.showTooltips}
          />
          <StatCard
            label="Moy. restantes"
            value={summary.averageRemainingSessions.toFixed(1)}
            variant="default"
            tooltip={tooltips.moyenneRestantes}
            tooltipDisabled={!settings.showTooltips}
          />
          {summary.participantsWithExpiringSoon > 0 && (
            <StatCard
              label="Expirent bientôt"
              value={summary.participantsWithExpiringSoon}
              variant="warning"
              tooltip={tooltips.expirentBientot}
              tooltipDisabled={!settings.showTooltips}
            />
          )}
          {showRevenue && (
            <>
              <StatCard
                label="Packs achetés"
                value={summary.creditPacksPurchased}
                variant="default"
                tooltip={tooltips.packsAchetes}
                tooltipDisabled={!settings.showTooltips}
              />
              <StatCard
                label="Revenus"
                value={`${summary.totalRevenue.toFixed(0)} €`}
                variant="revenue"
                tooltip={tooltips.revenus}
                tooltipDisabled={!settings.showTooltips}
              />
            </>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-subtext uppercase tracking-wider mb-3">
          Podium
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {/* Assiduité */}
          {summary.mostAssiduousPerson && (
            <Tooltip disabled={!settings.showTooltips} content={tooltips.plusAssidu}>
              <div className={`bg-overlay rounded-lg p-4 h-full flex flex-col ${settings.showTooltips ? 'cursor-help' : ''}`}>
                <div className={`text-xs text-green uppercase tracking-wider mb-2 inline-block ${settings.showTooltips ? 'border-b border-dotted border-green/50' : ''}`}>
                  Plus assidu
                </div>
                <div className="font-semibold text-text flex-1">
                  {summary.mostAssiduousPerson.participant.firstName}{' '}
                  {summary.mostAssiduousPerson.participant.lastName}
                </div>
                <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-green/20 text-green w-fit">
                  {summary.mostAssiduousPerson.rate.toFixed(0)}%
                </div>
              </div>
            </Tooltip>
          )}

          {summary.leastAssiduousPerson && (
            <Tooltip disabled={!settings.showTooltips} content={tooltips.moinsAssidu}>
              <div className={`bg-overlay rounded-lg p-4 h-full flex flex-col ${settings.showTooltips ? 'cursor-help' : ''}`}>
                <div className={`text-xs text-red uppercase tracking-wider mb-2 inline-block ${settings.showTooltips ? 'border-b border-dotted border-red/50' : ''}`}>
                  Moins assidu
                </div>
                <div className="font-semibold text-text flex-1">
                  {summary.leastAssiduousPerson.participant.firstName}{' '}
                  {summary.leastAssiduousPerson.participant.lastName}
                </div>
                <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-red/20 text-red w-fit">
                  {summary.leastAssiduousPerson.rate.toFixed(0)}%
                </div>
              </div>
            </Tooltip>
          )}

          {/* Séances assistées/manquées */}
          {summary.participantWithMostAttended && (
            <Tooltip disabled={!settings.showTooltips} content={tooltips.plusAssiste}>
              <div className={`bg-overlay rounded-lg p-4 h-full flex flex-col ${settings.showTooltips ? 'cursor-help' : ''}`}>
                <div className={`text-xs text-accent uppercase tracking-wider mb-2 inline-block ${settings.showTooltips ? 'border-b border-dotted border-accent/50' : ''}`}>
                  + assistées
                </div>
                <div className="font-semibold text-text flex-1">
                  {summary.participantWithMostAttended.participant.firstName}{' '}
                  {summary.participantWithMostAttended.participant.lastName}
                </div>
                <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent w-fit">
                  {summary.participantWithMostAttended.count} séances
                </div>
              </div>
            </Tooltip>
          )}

          {summary.participantWithMostMissed && (
            <Tooltip disabled={!settings.showTooltips} content={tooltips.plusManquees}>
              <div className={`bg-overlay rounded-lg p-4 h-full flex flex-col ${settings.showTooltips ? 'cursor-help' : ''}`}>
                <div className={`text-xs text-red uppercase tracking-wider mb-2 inline-block ${settings.showTooltips ? 'border-b border-dotted border-red/50' : ''}`}>
                  + manquées
                </div>
                <div className="font-semibold text-text flex-1">
                  {summary.participantWithMostMissed.participant.firstName}{' '}
                  {summary.participantWithMostMissed.participant.lastName}
                </div>
                <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-red/20 text-red w-fit">
                  {summary.participantWithMostMissed.count} séances
                </div>
              </div>
            </Tooltip>
          )}

          {/* Crédits restants */}
          {summary.participantWithMostRemaining && (
            <Tooltip disabled={!settings.showTooltips} content={tooltips.plusRestantes}>
              <div className={`bg-overlay rounded-lg p-4 h-full flex flex-col ${settings.showTooltips ? 'cursor-help' : ''}`}>
                <div className={`text-xs text-green uppercase tracking-wider mb-2 inline-block ${settings.showTooltips ? 'border-b border-dotted border-green/50' : ''}`}>
                  + restantes
                </div>
                <div className="font-semibold text-text flex-1">
                  {summary.participantWithMostRemaining.participant.firstName}{' '}
                  {summary.participantWithMostRemaining.participant.lastName}
                </div>
                <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-green/20 text-green w-fit">
                  {summary.participantWithMostRemaining.remaining} séances
                </div>
              </div>
            </Tooltip>
          )}

          {summary.participantWithLeastRemaining && (
            <Tooltip disabled={!settings.showTooltips} content={tooltips.moinsRestantes}>
              <div className={`bg-overlay rounded-lg p-4 h-full flex flex-col ${settings.showTooltips ? 'cursor-help' : ''}`}>
                <div className={`text-xs text-yellow uppercase tracking-wider mb-2 inline-block ${settings.showTooltips ? 'border-b border-dotted border-yellow/50' : ''}`}>
                  - restantes
                </div>
                <div className="font-semibold text-text flex-1">
                  {summary.participantWithLeastRemaining.participant.firstName}{' '}
                  {summary.participantWithLeastRemaining.participant.lastName}
                </div>
                <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-yellow/20 text-yellow w-fit">
                  {summary.participantWithLeastRemaining.remaining} séances
                </div>
              </div>
            </Tooltip>
          )}

          {summary.participantWithEarliestExpiration && (
            <Tooltip disabled={!settings.showTooltips} content={tooltips.expirePlusTot}>
              <div className={`bg-overlay rounded-lg p-4 h-full flex flex-col ${settings.showTooltips ? 'cursor-help' : ''}`}>
                <div className={`text-xs text-yellow uppercase tracking-wider mb-2 inline-block ${settings.showTooltips ? 'border-b border-dotted border-yellow/50' : ''}`}>
                  Expire + tôt
                </div>
                <div className="font-semibold text-text flex-1">
                  {summary.participantWithEarliestExpiration.participant.firstName}{' '}
                  {summary.participantWithEarliestExpiration.participant.lastName}
                </div>
                <div className="text-sm text-yellow mt-2">
                  {formatDate(summary.participantWithEarliestExpiration.expiration)}
                </div>
              </div>
            </Tooltip>
          )}

          {/* Séances collectives */}
          {summary.sessionWithMostParticipants && (
            <Tooltip disabled={!settings.showTooltips} content={tooltips.seancePlusRemplie}>
              <div className={`bg-overlay rounded-lg p-4 h-full flex flex-col ${settings.showTooltips ? 'cursor-help' : ''}`}>
                <div className={`text-xs text-accent uppercase tracking-wider mb-2 inline-block ${settings.showTooltips ? 'border-b border-dotted border-accent/50' : ''}`}>
                  Séance + remplie
                </div>
                <div className="font-semibold text-text flex-1">
                  {formatDate(summary.sessionWithMostParticipants.date)}
                </div>
                <div className="text-sm text-accent mt-2">
                  {summary.sessionWithMostParticipants.count} personnes
                </div>
              </div>
            </Tooltip>
          )}

          {summary.sessionWithFewestParticipants && (
            <Tooltip disabled={!settings.showTooltips} content={tooltips.seanceMoinsRemplie}>
              <div className={`bg-overlay rounded-lg p-4 h-full flex flex-col ${settings.showTooltips ? 'cursor-help' : ''}`}>
                <div className={`text-xs text-yellow uppercase tracking-wider mb-2 inline-block ${settings.showTooltips ? 'border-b border-dotted border-yellow/50' : ''}`}>
                  Séance - remplie
                </div>
                <div className="font-semibold text-text flex-1">
                  {formatDate(summary.sessionWithFewestParticipants.date)}
                </div>
                <div className="text-sm text-yellow mt-2">
                  {summary.sessionWithFewestParticipants.count} personnes
                </div>
              </div>
            </Tooltip>
          )}

          {summary.dayWithHighestAttendance && (
            <Tooltip disabled={!settings.showTooltips} content={tooltips.jourPopulaire}>
              <div className={`bg-overlay rounded-lg p-4 h-full flex flex-col ${settings.showTooltips ? 'cursor-help' : ''}`}>
                <div className={`text-xs text-accent uppercase tracking-wider mb-2 inline-block ${settings.showTooltips ? 'border-b border-dotted border-accent/50' : ''}`}>
                  Jour populaire
                </div>
                <div className="font-semibold text-text flex-1">
                  {summary.dayWithHighestAttendance.dayOfWeek}
                </div>
                <div className="text-sm text-accent mt-2">
                  {summary.dayWithHighestAttendance.averageCount.toFixed(1)} pers./séance
                </div>
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

export { ReportSummary };
