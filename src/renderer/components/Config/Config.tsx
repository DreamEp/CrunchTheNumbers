import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { formatDate, formatPrice, getSessionsIndicator, getExpirationIndicator } from '../../utils/indicators';
import { Participant, CreditPack, ParticipantSortField } from '../../../shared/types';
import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  FormGroup,
  Select,
  Textarea,
  Toggle,
  SubTabs,
  SubTab,
  SectionHeader,
  Modal,
  ModalTitle,
  ModalDescription,
  ModalActions,
  EmptyState,
  Tooltip,
} from '../ui';

type ConfigTab = 'participants' | 'credits' | 'settings';
type PacksView = 'active' | 'history';

function Config() {
  const {
    participants,
    settings,
    updateSettings,
    addParticipant,
    updateParticipant,
    addCreditPack,
    updateCreditPack,
    deleteCreditPack,
    deleteExpiredPacks,
    expirePack,
    reactivatePack,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<ConfigTab>('participants');

  const [newParticipant, setNewParticipant] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    notes: '',
  });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [editEmailError, setEditEmailError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultExpirationDate = new Date();
  defaultExpirationDate.setMonth(defaultExpirationDate.getMonth() + 6);
  const expirationStr = defaultExpirationDate.toISOString().split('T')[0];

  const [newCredit, setNewCredit] = useState({
    participantId: '',
    sessionCount: '10',
    priceMode: 'perSession' as 'total' | 'perSession',
    price: '15',
    startDate: todayStr,
    expirationDate: expirationStr,
  });

  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editingPack, setEditingPack] = useState<{
    participantId: string;
    pack: CreditPack;
  } | null>(null);
  const [editingPackStart, setEditingPackStart] = useState<{
    participantId: string;
    pack: CreditPack;
  } | null>(null);
  const [showDeleteExpiredConfirm, setShowDeleteExpiredConfirm] = useState(false);
  const [packsView, setPacksView] = useState<PacksView>('active');
  const [reactivatingPack, setReactivatingPack] = useState<{
    participantId: string;
    pack: CreditPack;
    newExpirationDate: string;
  } | null>(null);

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    if (!email) return true; // Empty is valid (optional field)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = (email: string) => {
    setNewParticipant({ ...newParticipant, email });
    if (email && !isValidEmail(email)) {
      setEmailError('Format d\'email invalide (ex: exemple@email.com)');
    } else {
      setEmailError(null);
    }
  };

  const handleEditEmailChange = (email: string) => {
    setEditingParticipant(prev =>
      prev ? { ...prev, email: email || undefined } : null
    );
    if (email && !isValidEmail(email)) {
      setEditEmailError('Format d\'email invalide (ex: exemple@email.com)');
    } else {
      setEditEmailError(null);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipant.firstName.trim() || !newParticipant.lastName.trim()) return;

    // Validate email format if provided
    if (newParticipant.email && !isValidEmail(newParticipant.email)) {
      setEmailError('Format d\'email invalide (ex: exemple@email.com)');
      return;
    }

    await addParticipant({
      firstName: newParticipant.firstName.trim(),
      lastName: newParticipant.lastName.trim(),
      email: newParticipant.email.trim() || undefined,
      age: newParticipant.age ? parseInt(newParticipant.age) : undefined,
      notes: newParticipant.notes.trim() || undefined,
    });

    setNewParticipant({ firstName: '', lastName: '', email: '', age: '', notes: '' });
    setEmailError(null);
  };

  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newCredit.participantId ||
      !newCredit.sessionCount ||
      !newCredit.price ||
      !newCredit.startDate ||
      !newCredit.expirationDate
    )
      return;

    const sessionCount = parseInt(newCredit.sessionCount);
    const price = parseFloat(newCredit.price);

    const totalPrice =
      newCredit.priceMode === 'total' ? price : price * sessionCount;
    const pricePerSession =
      newCredit.priceMode === 'perSession' ? price : price / sessionCount;

    await addCreditPack(newCredit.participantId, {
      sessionCount,
      remainingSessions: sessionCount,
      pricePerSession,
      totalPrice,
      purchaseDate: new Date(newCredit.startDate).toISOString(),
      expirationDate: new Date(newCredit.expirationDate).toISOString(),
    });

    const newTodayStr = new Date().toISOString().split('T')[0];
    const newExpirationDate = new Date();
    newExpirationDate.setMonth(newExpirationDate.getMonth() + 6);
    const newExpirationStr = newExpirationDate.toISOString().split('T')[0];
    setNewCredit({
      participantId: '',
      sessionCount: '10',
      priceMode: 'perSession',
      price: '15',
      startDate: newTodayStr,
      expirationDate: newExpirationStr,
    });
  };

  const handleSaveParticipant = async () => {
    if (!editingParticipant) return;

    // Validate email format if provided
    if (editingParticipant.email && !isValidEmail(editingParticipant.email)) {
      setEditEmailError('Format d\'email invalide (ex: exemple@email.com)');
      return;
    }

    await updateParticipant(editingParticipant.id, {
      firstName: editingParticipant.firstName,
      lastName: editingParticipant.lastName,
      email: editingParticipant.email,
      age: editingParticipant.age,
      notes: editingParticipant.notes,
    });

    setEditingParticipant(null);
    setEditEmailError(null);
  };

  const handleExtendPack = async () => {
    if (!editingPack) return;

    await updateCreditPack(editingPack.participantId, editingPack.pack.id, {
      expirationDate: editingPack.pack.expirationDate,
    });

    setEditingPack(null);
  };

  const handleEditPackStart = async () => {
    if (!editingPackStart) return;

    await updateCreditPack(editingPackStart.participantId, editingPackStart.pack.id, {
      purchaseDate: editingPackStart.pack.purchaseDate,
    });

    setEditingPackStart(null);
  };

  const activeParticipants = participants.filter((p) => p.status === 'active');

  // Sort participants based on global settings
  const sortedActiveParticipants = [...activeParticipants].sort((a, b) => {
    let comparison = 0;
    switch (settings.participantSortField) {
      case 'name':
        comparison = a.lastName.localeCompare(b.lastName);
        break;
      case 'firstName':
        comparison = a.firstName.localeCompare(b.firstName);
        break;
      case 'age':
        comparison = (a.age || 0) - (b.age || 0);
        break;
      default:
        comparison = a.lastName.localeCompare(b.lastName);
    }
    return settings.participantSortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSortChange = (field: ParticipantSortField) => {
    if (settings.participantSortField === field) {
      updateSettings({ participantSortDirection: settings.participantSortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      updateSettings({ participantSortField: field, participantSortDirection: 'asc' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Sub-navigation */}
      <SubTabs>
        <SubTab
          active={activeTab === 'participants'}
          onClick={() => setActiveTab('participants')}
        >
          👤 Participants
        </SubTab>
        <SubTab
          active={activeTab === 'credits'}
          onClick={() => setActiveTab('credits')}
        >
          🎫 Crédits & Packs
        </SubTab>
        <SubTab
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Paramètres
        </SubTab>
      </SubTabs>

      {/* Tab: Participants */}
      {activeTab === 'participants' && (
        <div className="space-y-8">
          {/* Add form */}
          <Card>
            <SectionHeader icon="👤" title="Ajouter un participant" />
            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup>
                  <Label>Prénom *</Label>
                  <Input
                    type="text"
                    required
                    value={newParticipant.firstName}
                    onChange={(e) =>
                      setNewParticipant({ ...newParticipant, firstName: e.target.value })
                    }
                    placeholder="Marie"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Nom *</Label>
                  <Input
                    type="text"
                    required
                    value={newParticipant.lastName}
                    onChange={(e) =>
                      setNewParticipant({ ...newParticipant, lastName: e.target.value })
                    }
                    placeholder="Dupont"
                  />
                </FormGroup>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newParticipant.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="exemple@email.com"
                    className={emailError ? 'border-red focus:border-red focus:ring-red/50' : ''}
                  />
                  {emailError && (
                    <p className="text-red text-xs mt-1">{emailError}</p>
                  )}
                </FormGroup>
                <FormGroup>
                  <Label>Âge</Label>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    value={newParticipant.age}
                    onChange={(e) =>
                      setNewParticipant({ ...newParticipant, age: e.target.value })
                    }
                    placeholder="35"
                  />
                </FormGroup>
              </div>
              <FormGroup>
                <Label>Notes</Label>
                <Textarea
                  value={newParticipant.notes}
                  onChange={(e) =>
                    setNewParticipant({ ...newParticipant, notes: e.target.value })
                  }
                  placeholder={"Informations supplémentaires...\n- Point 1\n- Point 2"}
                  rows={3}
                />
              </FormGroup>
              <div className="pt-2">
                <Button type="submit" variant="primary" disabled={!!emailError}>
                  + Ajouter le participant
                </Button>
              </div>
            </form>
          </Card>

          {/* Participants list */}
          <Card noPadding>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle count={activeParticipants.length}>📋 Liste des participants</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Trier par :</span>
                  <Button
                    size="sm"
                    variant={settings.participantSortField === 'name' ? 'primary' : 'secondary'}
                    onClick={() => handleSortChange('name')}
                  >
                    Nom {settings.participantSortField === 'name' && (settings.participantSortDirection === 'asc' ? '↑' : '↓')}
                  </Button>
                  <Button
                    size="sm"
                    variant={settings.participantSortField === 'firstName' ? 'primary' : 'secondary'}
                    onClick={() => handleSortChange('firstName')}
                  >
                    Prénom {settings.participantSortField === 'firstName' && (settings.participantSortDirection === 'asc' ? '↑' : '↓')}
                  </Button>
                  <Button
                    size="sm"
                    variant={settings.participantSortField === 'age' ? 'primary' : 'secondary'}
                    onClick={() => handleSortChange('age')}
                  >
                    Âge {settings.participantSortField === 'age' && (settings.participantSortDirection === 'asc' ? '↑' : '↓')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {activeParticipants.length === 0 ? (
              <EmptyState icon="👥" message="Aucun participant. Ajoutez-en un ci-dessus." />
            ) : (
              <div className="divide-y divide-border">
                {sortedActiveParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-overlay/30 transition-colors"
                  >
                    <div>
                      <span className="font-medium text-text">
                        {participant.firstName} {participant.lastName.toUpperCase()}
                      </span>
                      {participant.age && (
                        <span className="ml-2 text-sm text-muted">
                          ({participant.age} ans)
                        </span>
                      )}
                      {participant.email && (
                        <span className="ml-2 text-sm text-accent">
                          📧 {participant.email}
                        </span>
                      )}
                      {participant.notes && (
                        <p className="text-sm mt-0.5 text-subtext">
                          {participant.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingParticipant({ ...participant })}
                    >
                      ✏️ Modifier
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab: Credits */}
      {activeTab === 'credits' && (
        <div className="space-y-8">
          {/* Add credit form */}
          <Card>
            <SectionHeader icon="🎫" title="Ajouter des séances" />
            <form onSubmit={handleAddCredit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup>
                  <Label>Participant</Label>
                  <Select
                    required
                    value={newCredit.participantId}
                    onChange={(e) =>
                      setNewCredit({ ...newCredit, participantId: e.target.value })
                    }
                  >
                    <option value="">Sélectionner...</option>
                    {sortedActiveParticipants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName.toUpperCase()}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Nombre de séances</Label>
                  <Input
                    type="number"
                    required
                    min="1"
                    value={newCredit.sessionCount}
                    onChange={(e) =>
                      setNewCredit({ ...newCredit, sessionCount: e.target.value })
                    }
                    placeholder="10"
                  />
                </FormGroup>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup>
                  <Label>
                    <Tooltip
                      disabled={!settings.showTooltips}
                      content={
                        <div className="max-w-xs text-xs">
                          <div className="font-semibold text-accent mb-1">Mode de prix</div>
                          <div className="text-subtext">
                            <p><strong>€/séance</strong> : entrez le prix d'une séance, le total sera calculé automatiquement.</p>
                            <p className="mt-1"><strong>€ total</strong> : entrez le prix total du pack.</p>
                          </div>
                        </div>
                      }
                    >
                      <span className={settings.showTooltips ? 'cursor-help border-b border-dotted border-muted' : ''}>
                        Prix
                      </span>
                    </Tooltip>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={newCredit.price}
                      onChange={(e) =>
                        setNewCredit({ ...newCredit, price: e.target.value })
                      }
                      placeholder={newCredit.priceMode === 'perSession' ? '20' : '200'}
                    />
                    <Select
                      value={newCredit.priceMode}
                      onChange={(e) =>
                        setNewCredit({
                          ...newCredit,
                          priceMode: e.target.value as 'total' | 'perSession',
                        })
                      }
                      className="w-auto"
                    >
                      <option value="perSession">€/séance</option>
                      <option value="total">€ total</option>
                    </Select>
                  </div>
                </FormGroup>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup>
                  <Label>Date de début de validité</Label>
                  <Input
                    type="date"
                    required
                    value={newCredit.startDate}
                    onChange={(e) =>
                      setNewCredit({ ...newCredit, startDate: e.target.value })
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Date de fin de validité</Label>
                  <Input
                    type="date"
                    required
                    value={newCredit.expirationDate}
                    min={newCredit.startDate}
                    onChange={(e) =>
                      setNewCredit({ ...newCredit, expirationDate: e.target.value })
                    }
                  />
                </FormGroup>
              </div>
              <div className="pt-2">
                <Button type="submit" variant="primary">
                  + Ajouter les séances
                </Button>
              </div>
            </form>
          </Card>

          {/* Packs list by participant */}
          <Card noPadding>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle>📦 Packs de séances par participant</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={packsView === 'active' ? 'primary' : 'secondary'}
                    onClick={() => setPacksView('active')}
                  >
                    En cours
                  </Button>
                  <Button
                    size="sm"
                    variant={packsView === 'history' ? 'primary' : 'secondary'}
                    onClick={() => setPacksView('history')}
                  >
                    Historique
                  </Button>
                </div>
              </div>
            </CardHeader>

            {packsView === 'active' && (
              activeParticipants.length === 0 ? (
                <EmptyState icon="📦" message="Aucun participant avec des packs." />
              ) : (
                <div className="divide-y divide-border">
                  {sortedActiveParticipants.map((participant) => {
                    const activePacks = participant.creditPacks.filter(
                      (pack) => pack.remainingSessions > 0
                    );
                    return (
                      <div key={participant.id} className="px-6 py-5">
                        <h4 className="font-medium text-text mb-3">
                          {participant.firstName} {participant.lastName.toUpperCase()}
                        </h4>
                        {activePacks.length === 0 ? (
                          <p className="text-sm italic text-muted">
                            Aucun pack actif
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {activePacks.map((pack) => {
                              const isExpired = new Date(pack.expirationDate) < new Date();
                              const sessionsIndicator = getSessionsIndicator(pack.remainingSessions);
                              const expirationIndicator = getExpirationIndicator(pack.expirationDate);

                              // Determine border/background color from worst indicator
                              const isUrgent = sessionsIndicator.pulse || expirationIndicator.pulse || isExpired;
                              const isWarning = !isUrgent && (
                                sessionsIndicator.variant === 'warning' || expirationIndicator.variant === 'warning'
                              );
                              const isDanger = !isUrgent && (
                                sessionsIndicator.variant === 'danger' || expirationIndicator.variant === 'danger'
                              );

                              const borderClass = isUrgent
                                ? 'bg-red/15 border-red/40'
                                : isDanger
                                ? 'bg-red/10 border-red/30'
                                : isWarning
                                ? 'bg-yellow/10 border-yellow/30'
                                : 'bg-overlay border-border';

                              return (
                                <div
                                  key={pack.id}
                                  className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg border ${borderClass}`}
                                >
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-sm font-medium">
                                      <span className={
                                        sessionsIndicator.variant === 'danger' || sessionsIndicator.variant === 'negative'
                                          ? 'text-red'
                                          : sessionsIndicator.variant === 'warning'
                                          ? 'text-yellow'
                                          : 'text-accent'
                                      }>
                                        {pack.remainingSessions}
                                      </span>
                                      /{pack.sessionCount} séances
                                    </span>
                                    <span className="text-sm text-subtext">
                                      {formatPrice(pack.totalPrice)}
                                    </span>
                                    <span className={`text-sm ${isExpired ? 'text-red font-medium' : expirationIndicator.variant === 'danger' ? 'text-red' : expirationIndicator.variant === 'warning' ? 'text-yellow' : 'text-muted'}`}>
                                      {isExpired ? '⚠️ Expiré le' : 'Expire le'} {formatDate(pack.expirationDate)}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setEditingPackStart({
                                          participantId: participant.id,
                                          pack,
                                        })
                                      }
                                    >
                                      ✏️ Début
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setEditingPack({
                                          participantId: participant.id,
                                          pack,
                                        })
                                      }
                                    >
                                      📅 Prolonger
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        expirePack(participant.id, pack.id)
                                      }
                                    >
                                      ⏹️ Expirer
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() =>
                                        deleteCreditPack(participant.id, pack.id)
                                      }
                                    >
                                      🗑️
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {packsView === 'history' && (
              activeParticipants.length === 0 ? (
                <EmptyState icon="📦" message="Aucun participant." />
              ) : (
                <div className="divide-y divide-border">
                  {sortedActiveParticipants.map((participant) => {
                    const depletedPacks = participant.creditPacks.filter(
                      (pack) => pack.remainingSessions === 0
                    );
                    const historyPacks = [
                      ...depletedPacks.map((pack) => ({ ...pack, _source: 'creditPacks' as const })),
                      ...(participant.packHistory || []).map((pack) => ({ ...pack, _source: 'packHistory' as const })),
                    ].sort((a, b) => new Date(b.expirationDate).getTime() - new Date(a.expirationDate).getTime());

                    return (
                      <div key={participant.id} className="px-6 py-5">
                        <h4 className="font-medium text-text mb-3">
                          {participant.firstName} {participant.lastName.toUpperCase()}
                        </h4>
                        {historyPacks.length === 0 ? (
                          <p className="text-sm italic text-muted">
                            Aucun historique
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {historyPacks.map((pack) => {
                              const isExpired = new Date(pack.expirationDate) < new Date();
                              const isDepleted = pack.remainingSessions === 0;
                              const isInHistory = pack._source === 'packHistory';
                              return (
                                <div
                                  key={pack.id}
                                  className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg border ${
                                    isExpired && !isDepleted
                                      ? 'bg-red/10 border-red/30'
                                      : 'bg-overlay border-border'
                                  } opacity-75`}
                                >
                                  <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-sm font-medium">
                                      <span className="text-accent">
                                        {pack.remainingSessions}
                                      </span>
                                      /{pack.sessionCount} séances
                                    </span>
                                    <span className="text-sm text-subtext">
                                      {formatPrice(pack.totalPrice)}
                                    </span>
                                    <span className="text-sm text-muted">
                                      {formatDate(pack.purchaseDate)} → {formatDate(pack.expirationDate)}
                                    </span>
                                    {isDepleted && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                                        Terminé
                                      </span>
                                    )}
                                    {isExpired && !isDepleted && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-red/20 text-red">
                                        Expiré
                                      </span>
                                    )}
                                  </div>
                                  {isInHistory && pack.remainingSessions > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newExp = new Date();
                                        newExp.setMonth(newExp.getMonth() + 6);
                                        setReactivatingPack({
                                          participantId: participant.id,
                                          pack,
                                          newExpirationDate: newExp.toISOString().split('T')[0],
                                        });
                                      }}
                                    >
                                      📅 Réactiver
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </Card>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <SectionHeader icon="⏱️" title="Gestion des expirations" />
              <Tooltip
                disabled={!settings.showTooltips}
                content={
                  <div className="max-w-xs text-xs">
                    <div className="font-semibold text-accent mb-1">Comment ça fonctionne ?</div>
                    <div className="text-subtext space-y-2">
                      <p>
                        Chaque pack de séances a une date d'expiration.
                        Passé cette date, les séances restantes ne peuvent plus être utilisées.
                      </p>
                      <p>
                        Le <strong>délai de grâce</strong> permet d'utiliser les séances
                        quelques jours après la date d'expiration officielle.
                      </p>
                    </div>
                  </div>
                }
              >
                <span className={settings.showTooltips ? 'text-lg cursor-help' : 'hidden'}>ℹ️</span>
              </Tooltip>
            </div>
            <div className="space-y-4">
              <Tooltip
                disabled={!settings.showTooltips}
                content={
                  <div className="max-w-xs text-xs">
                    <div className="font-semibold text-accent mb-1">Délai de grâce</div>
                    <div className="text-subtext">
                      Permet aux participants d'utiliser leurs séances pendant quelques jours
                      supplémentaires après l'expiration de leur pack.
                      Utile pour les absences imprévues ou les retards de renouvellement.
                    </div>
                  </div>
                }
              >
                <div>
                  <Toggle
                    active={settings.enableGracePeriod}
                    onClick={() => updateSettings({ enableGracePeriod: !settings.enableGracePeriod })}
                  >
                    Autoriser un délai de grâce après expiration
                  </Toggle>
                </div>
              </Tooltip>

              {settings.enableGracePeriod && (
                <div className="flex items-center gap-3 ml-1">
                  <span className="text-sm text-muted">
                    Durée du délai :
                  </span>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.gracePeriodDays}
                    onChange={(e) =>
                      updateSettings({ gracePeriodDays: parseInt(e.target.value) || 7 })
                    }
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted">
                    jours
                  </span>
                </div>
              )}

              <div className="pt-3">
                <Tooltip
                  disabled={!settings.showTooltips}
                  content={
                    <div className="max-w-xs text-xs">
                      <div className="font-semibold text-red mb-1">Attention</div>
                      <div className="text-subtext">
                        Supprime définitivement tous les packs dont la date d'expiration
                        {settings.enableGracePeriod ? ` (+ ${settings.gracePeriodDays} jours de grâce)` : ''} est dépassée.
                        Les séances non utilisées seront perdues.
                      </div>
                    </div>
                  }
                >
                  <Button
                    variant="danger"
                    onClick={() => setShowDeleteExpiredConfirm(true)}
                  >
                    🗑️ Supprimer tous les packs expirés
                  </Button>
                </Tooltip>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal édition participant */}
      <Modal
        open={!!editingParticipant}
        onClose={() => { setEditingParticipant(null); setEditEmailError(null); }}
      >
        <ModalTitle>✏️ Modifier le participant</ModalTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormGroup>
              <Label>Prénom</Label>
              <Input
                type="text"
                value={editingParticipant?.firstName || ''}
                onChange={(e) =>
                  setEditingParticipant(prev =>
                    prev ? { ...prev, firstName: e.target.value } : null
                  )
                }
              />
            </FormGroup>
            <FormGroup>
              <Label>Nom</Label>
              <Input
                type="text"
                value={editingParticipant?.lastName || ''}
                onChange={(e) =>
                  setEditingParticipant(prev =>
                    prev ? { ...prev, lastName: e.target.value } : null
                  )
                }
              />
            </FormGroup>
          </div>
          <FormGroup>
            <Label>Email</Label>
            <Input
              type="email"
              value={editingParticipant?.email || ''}
              onChange={(e) => handleEditEmailChange(e.target.value)}
              placeholder="exemple@email.com"
              className={editEmailError ? 'border-red focus:border-red focus:ring-red/50' : ''}
            />
            {editEmailError && (
              <p className="text-red text-xs mt-1">{editEmailError}</p>
            )}
          </FormGroup>
          <FormGroup>
            <Label>Âge</Label>
            <Input
              type="number"
              value={editingParticipant?.age || ''}
              onChange={(e) =>
                setEditingParticipant(prev =>
                  prev ? { ...prev, age: e.target.value ? parseInt(e.target.value) : undefined } : null
                )
              }
              className="w-24"
            />
          </FormGroup>
          <FormGroup>
            <Label>Notes</Label>
            <Textarea
              value={editingParticipant?.notes || ''}
              onChange={(e) =>
                setEditingParticipant(prev =>
                  prev ? { ...prev, notes: e.target.value || undefined } : null
                )
              }
              placeholder={"Informations supplémentaires...\n- Point 1\n- Point 2"}
              rows={4}
            />
          </FormGroup>
        </div>
        <ModalActions>
          <Button variant="secondary" onClick={() => { setEditingParticipant(null); setEditEmailError(null); }}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveParticipant} disabled={!!editEmailError}>
            Enregistrer
          </Button>
        </ModalActions>
      </Modal>

      {/* Modal prolongation pack */}
      <Modal
        open={!!editingPack}
        onClose={() => setEditingPack(null)}
      >
        <ModalTitle>📅 Prolonger le pack</ModalTitle>
        <FormGroup>
          <Label>Nouvelle date de fin</Label>
          <Input
            type="date"
            value={editingPack?.pack.expirationDate.split('T')[0] || ''}
            onChange={(e) =>
              setEditingPack(prev =>
                prev
                  ? {
                      ...prev,
                      pack: {
                        ...prev.pack,
                        expirationDate: new Date(e.target.value).toISOString(),
                      },
                    }
                  : null
              )
            }
            className="w-auto"
          />
        </FormGroup>
        <ModalActions>
          <Button variant="secondary" onClick={() => setEditingPack(null)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleExtendPack}>
            Enregistrer
          </Button>
        </ModalActions>
      </Modal>

      {/* Modal édition date de début du pack */}
      <Modal
        open={!!editingPackStart}
        onClose={() => setEditingPackStart(null)}
      >
        <ModalTitle>✏️ Modifier la date de début</ModalTitle>
        <FormGroup>
          <Label>Nouvelle date de début de validité</Label>
          <Input
            type="date"
            value={editingPackStart?.pack.purchaseDate.split('T')[0] || ''}
            onChange={(e) =>
              setEditingPackStart(prev =>
                prev
                  ? {
                      ...prev,
                      pack: {
                        ...prev.pack,
                        purchaseDate: new Date(e.target.value).toISOString(),
                      },
                    }
                  : null
              )
            }
            className="w-auto"
          />
        </FormGroup>
        <ModalActions>
          <Button variant="secondary" onClick={() => setEditingPackStart(null)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleEditPackStart}>
            Enregistrer
          </Button>
        </ModalActions>
      </Modal>

      {/* Modal confirmation suppression packs expirés */}
      <Modal
        open={showDeleteExpiredConfirm}
        onClose={() => setShowDeleteExpiredConfirm(false)}
      >
        <ModalTitle>🗑️ Supprimer les packs expirés ?</ModalTitle>
        <ModalDescription>
          Cette action supprimera tous les packs dont la date d'expiration
          {settings.enableGracePeriod
            ? ` (+ ${settings.gracePeriodDays} jours de grâce)`
            : ''}{' '}
          est dépassée. <strong>Cette action est irréversible.</strong>
        </ModalDescription>
        <ModalActions>
          <Button variant="secondary" onClick={() => setShowDeleteExpiredConfirm(false)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              deleteExpiredPacks();
              setShowDeleteExpiredConfirm(false);
            }}
          >
            Supprimer
          </Button>
        </ModalActions>
      </Modal>

      {/* Modal réactivation pack */}
      <Modal
        open={!!reactivatingPack}
        onClose={() => setReactivatingPack(null)}
      >
        <ModalTitle>📅 Réactiver le pack</ModalTitle>
        <ModalDescription>
          Ce pack sera remis dans les packs actifs avec la nouvelle date d'expiration.
        </ModalDescription>
        <FormGroup>
          <Label>Nouvelle date de fin de validité</Label>
          <Input
            type="date"
            value={reactivatingPack?.newExpirationDate || ''}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) =>
              setReactivatingPack((prev) =>
                prev ? { ...prev, newExpirationDate: e.target.value } : null
              )
            }
            className="w-auto"
          />
        </FormGroup>
        <ModalActions>
          <Button variant="secondary" onClick={() => setReactivatingPack(null)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (reactivatingPack) {
                reactivatePack(
                  reactivatingPack.participantId,
                  reactivatingPack.pack.id,
                  new Date(reactivatingPack.newExpirationDate).toISOString()
                );
                setReactivatingPack(null);
              }
            }}
          >
            Réactiver
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}

export default Config;
