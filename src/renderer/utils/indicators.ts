// Utilitaires pour les indicateurs colorés
import { BadgeVariant } from '../components/ui';

export type StatusColor = 'green' | 'yellow' | 'orange' | 'red' | 'red-dark';

export interface IndicatorResult {
  color: StatusColor;
  variant: BadgeVariant;
  pulse: boolean;
}

// Couleurs par séances restantes
export function getSessionsIndicator(remaining: number): IndicatorResult {
  if (remaining >= 4) {
    return { color: 'green', variant: 'success', pulse: false };
  }
  if (remaining === 3) {
    return { color: 'yellow', variant: 'warning', pulse: false };
  }
  if (remaining === 2) {
    return { color: 'orange', variant: 'warning', pulse: false };
  }
  if (remaining === 1) {
    return { color: 'red', variant: 'danger', pulse: false };
  }
  if (remaining === 0) {
    return { color: 'red-dark', variant: 'danger', pulse: true };
  }
  // Négatif - style très prononcé
  return { color: 'red-dark', variant: 'negative', pulse: true };
}

// Couleurs par semaines avant expiration
export function getExpirationIndicator(expirationDate: string | null): IndicatorResult {
  if (!expirationDate) {
    return { color: 'green', variant: 'muted', pulse: false };
  }

  const now = new Date();
  const expiration = new Date(expirationDate);
  const diffMs = expiration.getTime() - now.getTime();
  const diffWeeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));

  if (diffWeeks >= 5) {
    return { color: 'green', variant: 'success', pulse: false };
  }
  if (diffWeeks === 4) {
    return { color: 'yellow', variant: 'warning', pulse: false };
  }
  if (diffWeeks === 3) {
    return { color: 'orange', variant: 'warning', pulse: false };
  }
  if (diffWeeks === 2) {
    return { color: 'red', variant: 'danger', pulse: false };
  }
  if (diffWeeks === 1) {
    return { color: 'red-dark', variant: 'danger', pulse: false };
  }
  // Expiré ou 0 semaines
  return { color: 'red-dark', variant: 'danger', pulse: true };
}

// Formatage de date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Formatage de prix
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// Calcul du total payé par tous les participants
export function calculateTotalReceived(participants: { totalPaid: number }[]): number {
  return participants.reduce((sum, p) => sum + p.totalPaid, 0);
}

// Noms des jours de la semaine
export const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];
