# PainTracker - Spécification d'Architecture

## 1. Vue d'ensemble du projet

| Attribut | Description |
|----------|-------------|
| **Nom** | PainTracker |
| **But** | Suivi de comptabilité pour coach sportive (cours du soir) |
| **Contrainte principale** | Lancement en 1 click (double-clic sur exécutable) |
| **Plateformes** | Windows (développement/test) + macOS (cible finale) |
| **Utilisateur cible** | Coach sportive unique (scalable ultérieurement) |

---

## 2. Stack Technique

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Desktop Runtime | Electron 40 | App native cross-platform (Win + Mac), 1-click |
| Frontend | React 18.3.1 + TypeScript | UI moderne, typage fort |
| Styling | Tailwind CSS 3.4.17 + Catppuccin Mocha | Thème sombre élégant, composants UI custom |
| State Management | Zustand v5 | Léger, simple, persistance facile |
| Stockage | JSON files (electron-store) | Lisible, exportable, backup facile |
| Build | electron-vite + Electron Builder | Build rapide, génère .exe (Win) et .dmg/.app (Mac) |

### Thème Catppuccin Mocha

| Couleur | Hex | Usage |
|---------|-----|-------|
| Base | `#1e1e2e` | Fond principal |
| Surface | `#313244` | Cards, éléments surélevés |
| Overlay | `#45475a` | Inputs, headers de table |
| Text | `#cdd6f4` | Texte principal |
| Subtext | `#a6adc8` | Texte secondaire |
| Accent (Teal) | `#94e2d5` | Actions principales, highlights |
| Red | `#f38ba8` | Erreurs, alertes, séances négatives |
| Peach | `#fab387` | Warnings |
| Yellow | `#f9e2af` | Attention |
| Green | `#a6e3a1` | Succès |

---

## 3. Architecture des fichiers de données

Les données sont stockées dans le dossier utilisateur standard de chaque OS :
- **Windows** : `%APPDATA%/PainTracker/`
- **macOS** : `~/Library/Application Support/PainTracker/`

```
[userData]/PainTracker/
├── data/
│   ├── participants.json      # Participants actifs
│   ├── archive.json           # Participants masqués/supprimés (backup)
│   ├── sessions_history.json  # Historique des séances appliquées
│   ├── session_templates.json # Séances types du coach
│   └── date_markers.json      # Marqueurs de dates (vacances, annulé, malade)
└── settings.json              # Préférences utilisateur
```

> Note : Electron fournit `app.getPath('userData')` pour obtenir le chemin approprié selon l'OS.

---

## 4. Modèles de données (TypeScript interfaces)

### Participant

```typescript
interface Participant {
  id: string;
  firstName: string;          // Obligatoire (affiché en MAJUSCULES)
  lastName: string;           // Obligatoire (affiché en MAJUSCULES)
  age?: number;               // Optionnel
  notes?: string;             // Optionnel (infos supplémentaires)
  creditPacks: CreditPack[];  // Packs de séances achetés
  status: 'active' | 'hidden' | 'archived';
  createdAt: string;
  totalPaid: number;          // Total € payé depuis le début
  sessionDebt: number;        // Séances "dues" (négatives) - déduites auto au recharge
}
```

### CreditPack (pack de séances)

```typescript
interface CreditPack {
  id: string;
  sessionCount: number;       // Nombre de séances achetées
  remainingSessions: number;  // Séances restantes
  pricePerSession: number;    // Prix unitaire
  totalPrice: number;         // Prix total du pack
  purchaseDate: string;
  expirationDate: string;     // Date fin de validité
}
```

### SessionRecord (séance effectuée)

```typescript
interface SessionRecord {
  id: string;
  participantId: string;
  date: string;
  sessionCount: number;       // 1 à 3 séances ce jour
  creditPackId: string;       // Pack débité
}
```

### SessionTemplate (séance type)

```typescript
interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  defaultDuration?: number;
}
```

### Settings (préférences utilisateur)

```typescript
type ParticipantSortField = 'name' | 'firstName' | 'sessions' | 'remaining' | 'expiration' | 'age';
type SortDirection = 'asc' | 'desc';

interface Settings {
  // Affichage
  showPricePerParticipant: boolean;
  showTotalReceived: boolean;

  // Gestion des expirations
  enableGracePeriod: boolean;       // Autoriser délai de grâce
  gracePeriodDays: number;          // Durée du délai (défaut: 7)

  // Planning
  recurringDays: number[];          // Jours de cours [1=Lun, 2=Mar, ...]

  // Tri des participants (global Dashboard + Planning)
  participantSortField: ParticipantSortField;
  participantSortDirection: SortDirection;
}
```

### DateMarker (marqueurs de dates)

```typescript
type DateMarkerType = 'vacation' | 'cancelled' | 'sick';

interface DateMarker {
  date: string;        // Format YYYY-MM-DD
  type: DateMarkerType;
  note?: string;       // Note optionnelle
}
```

> **Note** : Les marqueurs de dates permettent d'indiquer sur le planning si le coach est en vacances (🏖️), si un cours est annulé (❌), ou s'il est malade/indisponible (🤒). Lorsqu'un marqueur est présent sur une date, les sélecteurs de séances sont masqués pour tous les participants.

---

## 5. Structure des onglets (4 pages)

### 5.1 Dashboard (page principale)

**Tableau des participants** avec colonnes :
- Prénom / Nom (affichés en MAJUSCULES)
- Séances totales payées (cumul historique)
- Séances restantes (peut être négatif = dette)
- Date fin validité
- Indicateurs visuels (badges colorés)

**Options d'affichage** :
- Toggle "Afficher prix payé par participant"
- Toggle "Afficher total général reçu"

**Actions** :
- Masquer / Supprimer participant (avec confirmation)
- Restaurer depuis archive

**Tri global** (partagé avec Planning) :
- Par nom, prénom, séances totales, restantes, expiration, âge
- Configurable dans l'onglet Configuration
- Direction ascendante/descendante

### 5.2 Planning/Agenda

- **Configuration** : Sélection jours récurrents (☑ Lundi ☑ Mardi...)
- **Grille calendrier** : Colonnes = dates des jours sélectionnés
- **Lignes** : Participants actifs (même tri que Dashboard)
- **Colonnes sticky** : "Participant" et "Restant" restent visibles au scroll horizontal
- **Cellules** : Dropdown 0/1/2/3 séances à appliquer
- **Indicateurs** : Couleurs alertes sur lignes concernées

**Marqueurs de dates** :
- Clic sur la date (header) pour ouvrir le modal de marqueur
- Types disponibles : 🏖️ Vacances, ❌ Annulé, 🤒 Malade/Indisponible
- Colonne entière colorée selon le type de marqueur
- Sélecteurs de séances masqués pour les dates marquées
- Note optionnelle pour chaque marqueur

**Vues disponibles** :
- Vue "Prochaines dates" : 3-4 semaines à venir
- Vue "Historique" : Toutes les dates avec séances enregistrées

### 5.3 Configuration/Suivi

**Formulaire ajout participant** :
- Nom* (obligatoire)
- Prénom* (obligatoire)
- Age (optionnel)
- Notes (optionnel)

**Formulaire ajout crédit** :
- Participant (dropdown)
- Nombre séances (la dette est automatiquement déduite)
- Prix total ou prix/séance
- Date fin validité (date picker)

**Liste éditable** : Modifier infos participant

**Paramètres de tri** (global Dashboard + Planning) :
- Champ de tri : nom, prénom, séances totales, restantes, expiration, âge
- Direction : ascendant / descendant

**Paramètres d'expiration** :
- Toggle "Autoriser délai de grâce après expiration"
- Champ "Durée du délai de grâce" (en jours, défaut: 7)
- Bouton "Supprimer tous les packs expirés" (avec confirmation)
- Bouton "Prolonger pack expiré" (sur chaque pack concerné)

### 5.4 Séances Types

- **Liste des templates** de séances avec drag & drop pour réordonner
- **CRUD** : Créer, modifier, supprimer templates
- **Drag & Drop** : Maintenir et glisser un template pour changer l'ordre
- **Utilisation** : Référence pour le coach (mémo)

---

## 6. Système d'indicateurs colorés

### Par séances restantes

| Restant | Couleur | Code Catppuccin |
|---------|---------|-----------------|
| ≥ 4 | Vert | `#a6e3a1` (green) |
| 3 | Jaune | `#f9e2af` (yellow) |
| 2 | Orange | `#fab387` (peach) |
| 1 | Rouge | `#f38ba8` (red) |
| 0 | Rouge + pulse | `#f38ba8` + animation |
| Négatif (dette) | Rouge intense | `#f38ba8` bg 40% + bordure 2px + bold |

### Par semaines avant expiration

| Semaines | Couleur | Code Catppuccin |
|----------|---------|-----------------|
| ≥ 5 | Vert | `#a6e3a1` (green) |
| 4 | Jaune | `#f9e2af` (yellow) |
| 3 | Orange | `#fab387` (peach) |
| 2 | Rouge clair | `#f38ba8` (red) |
| 1 | Rouge | `#f38ba8` (red) |
| 0 ou expiré | Rouge flash | `#f38ba8` + pulse |

---

## 7. Logique métier clé

1. **Gestion des expirations (manuelle)** :
   - Pas d'expiration automatique des séances
   - Les packs expirés sont signalés visuellement (indicateurs colorés)
   - La coach décide manuellement de supprimer ou prolonger un pack expiré
   - **Option configurable** : Activer/désactiver un délai de grâce (ex: +1 semaine après expiration)
   - Action manuelle : "Supprimer les séances expirées" disponible dans les paramètres

2. **Débit séances** : Toujours débiter le pack le plus ancien en premier (FIFO), en privilégiant les packs non expirés

3. **Calcul séances restantes** : Somme des `remainingSessions` de tous les packs, moins la dette (`sessionDebt`)

4. **Système de séances négatives (dette)** :
   - Si un participant n'a plus de séances mais assiste au cours, il peut être mis en négatif
   - La dette est affichée avec un badge rouge intense (ex: "-2")
   - Lors de l'ajout d'un nouveau pack de crédits, la dette est automatiquement déduite en premier
   - Exemple : dette de 3 séances + achat de 10 séances = 7 séances disponibles

5. **Tri global des participants** :
   - Le tri est configurable dans l'onglet Configuration
   - Le même ordre est appliqué dans le Dashboard et le Planning
   - Options de tri : nom, prénom, séances totales, restantes, expiration, âge

6. **Marqueurs de dates** :
   - Trois types : vacances (🏖️), annulé (❌), malade/indisponible (🤒)
   - Un seul marqueur par date
   - Lorsqu'un marqueur est actif, la colonne entière est colorée selon le type
   - Les sélecteurs de séances sont masqués pour les dates avec marqueur
   - Clic sur la date dans le header pour ajouter/supprimer un marqueur

7. **Backup automatique** : Copie quotidienne des JSON dans `/backup/`

---

## 8. Structure des dossiers du projet

```
PainTracker/
├── src/
│   ├── main/                 # Process Electron principal
│   │   ├── index.ts          # Point d'entrée, création fenêtre, IPC handlers
│   │   └── storage.ts        # Gestion fichiers JSON (electron-store)
│   ├── preload/
│   │   └── index.ts          # API exposée au renderer (contextBridge)
│   ├── renderer/             # Frontend React
│   │   ├── components/
│   │   │   ├── ui/           # Composants UI réutilisables (custom)
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Textarea.tsx
│   │   │   │   └── Tooltip.tsx
│   │   │   ├── Dashboard/    # Tableau des participants
│   │   │   ├── Planning/     # Grille calendrier avec marqueurs
│   │   │   ├── Config/       # Configuration + ajout participants/crédits
│   │   │   └── Templates/    # Séances types (drag & drop reordering)
│   │   ├── stores/
│   │   │   └── useAppStore.ts  # Zustand store centralisé
│   │   ├── styles/
│   │   │   └── index.css     # Tailwind base + utilities custom
│   │   └── App.tsx           # Layout principal avec tabs
│   └── shared/
│       └── types.ts          # Interfaces TypeScript partagées
├── resources/                # Assets pour le build
│   ├── icon.ico              # Icône Windows (256x256)
│   ├── icon.icns             # Icône macOS
│   └── icon.png              # Icône Linux/fallback (512x512)
├── build/                    # Assets de build Electron
│   └── icon.ico              # Icône utilisée par electron-builder
├── tailwind.config.js        # Configuration Tailwind v3 + thème Catppuccin
├── postcss.config.js
├── electron.vite.config.ts   # Configuration electron-vite
├── electron-builder.yml      # Configuration builds cross-platform
├── package.json
└── architecture_spec.md
```

---

## 9. Composants UI Custom

L'application utilise une bibliothèque de composants UI custom (pas Shadcn) dans `src/renderer/components/ui/` :

| Composant | Props principales | Usage |
|-----------|------------------|-------|
| `Button` | `variant`, `size`, `disabled` | Actions (primary, secondary, danger, ghost) |
| `Card` | `className`, `noPadding` | Conteneurs avec fond surface |
| `Badge` | `variant`, `pulse` | Indicateurs (success, warning, danger, negative, muted) |
| `Input` | Standard HTML + styling | Champs de saisie |
| `Select` | Standard HTML + styling | Dropdowns |
| `Textarea` | Standard HTML + styling | Zones de texte multi-lignes |
| `Modal` | `isOpen`, `onClose`, `title` | Dialogues modaux avec overlay |
| `Table` | `headers`, `rows` | Tableaux de données |
| `Tooltip` | `content`, `position` | Infobulles |

Tous les composants utilisent exclusivement des classes Tailwind pour le styling, avec le thème Catppuccin Mocha.

---

## 10. Considérations futures (scalabilité)

- Structure `userId` prête dans les modèles
- Possibilité d'ajouter authentification locale
- Export/Import des données (JSON, CSV)
