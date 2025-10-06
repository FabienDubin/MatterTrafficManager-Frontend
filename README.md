# 📅 Matter Traffic Manager - Frontend

> Interface utilisateur moderne pour Matter Traffic Manager - Gestionnaire de trafic intelligent synchronisé avec Notion

[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646cff.svg)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4+-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Fonctionnalités

- 📅 **Calendrier interactif** avec FullCalendar et drag & drop
- 🎯 **3 vues calendrier** : Jour (par membre), Semaine, Mois
- ✏️ **Édition complète** des tâches via panneau latéral
- 🎨 **Thèmes** clair/sombre avec switch instantané
- 🔍 **Filtres avancés** multi-critères (membres, équipes, clients, projets)
- ⚡ **Updates optimistes** avec rollback automatique
- 🔄 **Synchronisation temps réel** via webhooks Notion
- 🎨 **Couleurs personnalisables** par client ou membre
- 📊 **Dashboard admin** complet avec métriques
- 🧪 **Tests complets** avec Vitest et React Testing Library

## 📋 Table des matières

- [Stack Technologique](#-stack-technologique)
- [Prérequis](#-prérequis)
- [Installation Rapide](#-installation-rapide)
- [Configuration](#-configuration)
- [Scripts Disponibles](#-scripts-disponibles)
- [Structure du Projet](#-structure-du-projet)
- [Pages & Fonctionnalités](#-pages--fonctionnalités)
- [Architecture](#-architecture)
- [Composants UI](#-composants-ui)
- [State Management](#-state-management)
- [Tests](#-tests)
- [Build & Déploiement](#-build--déploiement)
- [Contribution](#-contribution)

## 🛠️ Stack Technologique

| Technologie | Version | Description |
|------------|---------|-------------|
| **React** | 19.0 | Library UI moderne |
| **Vite** | 6.0+ | Build tool ultra-rapide |
| **TypeScript** | 5.7+ | Typage statique |
| **Tailwind CSS** | 3.4+ | Framework CSS utility-first |
| **Zustand** | 5.0+ | State management léger |
| **FullCalendar** | 6.1+ | Composant calendrier |
| **Radix UI** | Latest | Composants accessibles headless |
| **TanStack Query** | 5.85+ | Gestion des requêtes async |
| **React Hook Form** | 7.63+ | Gestion des formulaires |
| **Zod** | 3.25+ | Validation de schémas |
| **Vitest** | 3.2+ | Framework de tests |

## 📦 Prérequis

- **Node.js** 20 ou supérieur
- **npm** ou **yarn**
- **Backend API** en fonctionnement sur port 5005
- **Docker** & **Docker Compose** (optionnel mais recommandé)

## 🚀 Installation Rapide

### Option 1: Installation Locale (3 minutes)

```bash
# 1. Cloner et installer
cd matter-traffic-frontend
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Par défaut: VITE_API_URL=http://localhost:5005

# 3. Démarrer en mode développement
npm run dev
```

✅ L'application démarre sur **http://localhost:5173**

### Option 2: Avec Docker (Recommandé)

```bash
# Depuis la racine du projet MatterTrafficManager
docker-compose up frontend -d
```

✅ Frontend + hot reload Docker activé

## ⚙️ Configuration

### Variables d'Environnement

Copier `.env.example` vers `.env` et configurer:

```bash
# 🔗 URL de l'API backend
VITE_API_URL=http://localhost:5005

# 🌍 Mode de développement
VITE_MODE=development

# 🔑 Clé localStorage pour JWT
VITE_JWT_LOCAL_STORAGE_KEY=matter_traffic_token

# 🛠️ Outils de développement
VITE_DEV_TOOLS=true
VITE_LOG_LEVEL=debug

# ⏱️ Timeout des requêtes API (ms)
VITE_API_TIMEOUT=10000

# 🐳 Hot reload pour Docker
CHOKIDAR_USEPOLLING=true

# 🚀 URLs par environnement
VITE_API_URL_DEV=http://localhost:5005
VITE_API_URL_STAGING=https://staging-api.mattertraffic.com
VITE_API_URL_PROD=https://api.mattertraffic.com
```

## 📜 Scripts Disponibles

### Développement

```bash
npm run dev              # Démarrer en mode développement (port 5173)
npm run build            # Build de production
npm run preview          # Prévisualiser le build de production
```

### Tests

```bash
npm test                 # Lancer tous les tests
npm run test:ui          # Interface graphique Vitest
npm run test:watch       # Tests en mode watch
npm run test:coverage    # Rapport de couverture
```

### Qualité de Code

```bash
npm run lint             # Vérifier le code (ESLint)
npm run lint:fix         # Corriger automatiquement
npm run format           # Formater avec Prettier
npm run type-check       # Vérification TypeScript sans build
```

## 🗂️ Structure du Projet

```
matter-traffic-frontend/
│
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── admin/           # Composants admin
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── NotionMappingTab.tsx
│   │   │   └── monitoring/
│   │   ├── auth/            # Composants authentification
│   │   │   └── LoginForm.tsx
│   │   ├── calendar/        # Composants calendrier
│   │   │   ├── CalendarView.tsx
│   │   │   ├── CalendarHeader.tsx
│   │   │   ├── CalendarControls.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskEditSheet.tsx
│   │   │   ├── DayView.tsx
│   │   │   ├── MemberColumn.tsx
│   │   │   ├── UnassignedColumn.tsx
│   │   │   └── columns/
│   │   ├── filters/         # Composants de filtrage
│   │   ├── shared/          # Composants partagés
│   │   │   ├── SyncIndicator.tsx
│   │   │   ├── ActiveFiltersIndicator.tsx
│   │   │   └── MemberCombobox.tsx
│   │   └── ui/              # Composants UI de base (shadcn)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       └── ... (40+ composants Radix UI)
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── api/
│   │   │   ├── useTasks.ts
│   │   │   └── useMembers.ts
│   │   ├── calendar/
│   │   │   ├── useCalendarTasks.ts
│   │   │   └── useProgressiveCalendarTasks.ts
│   │   ├── useCalendarConfig.ts
│   │   ├── useFilteredTasks.ts
│   │   ├── useOptimisticUpdate.ts
│   │   ├── useSyncStatus.ts
│   │   └── use-toast.ts
│   │
│   ├── layouts/             # Layouts de page
│   │   ├── MainLayout.tsx
│   │   └── AdminLayout.tsx
│   │
│   ├── pages/               # Pages de l'application
│   │   ├── auth/
│   │   │   └── Login.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarPage.tsx
│   │   │   └── DayViewTest.tsx
│   │   └── admin/
│   │       ├── Dashboard.tsx
│   │       ├── configuration/
│   │       │   ├── NotionConnectionPage.tsx
│   │       │   ├── MappingBasesPage.tsx
│   │       │   └── CalendarConfigPage.tsx
│   │       ├── monitoring/
│   │       │   ├── GlobalView.tsx
│   │       │   ├── CacheDashboard.tsx
│   │       │   └── HealthMemoryPage.tsx
│   │       ├── synchronisation/
│   │       │   ├── SyncControlPage.tsx
│   │       │   ├── ConflictsPage.tsx
│   │       │   └── WebhookLogsPage.tsx
│   │       └── users/
│   │           └── UsersPage.tsx
│   │
│   ├── providers/           # Context providers
│   │   ├── AuthProvider.tsx
│   │   └── ThemeProvider.tsx
│   │
│   ├── router/              # Configuration routing
│   │   └── AppRouter.tsx
│   │
│   ├── schemas/             # Schémas de validation Zod
│   │
│   ├── services/            # Services API
│   │   └── api/
│   │       ├── client.ts           # Client API Axios
│   │       ├── tasks.service.ts
│   │       ├── members.service.ts
│   │       ├── projects.service.ts
│   │       ├── teams.service.ts
│   │       ├── clients.service.ts
│   │       ├── cache.service.ts
│   │       ├── sync.service.ts
│   │       ├── metrics.service.ts
│   │       └── monitoring.service.ts
│   │
│   ├── store/               # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── calendar.store.ts
│   │   ├── calendar-config.store.ts
│   │   ├── config.store.ts
│   │   └── filter.store.ts
│   │
│   ├── types/               # Définitions TypeScript
│   │   ├── calendar.types.ts
│   │   ├── task.types.ts
│   │   └── client.types.ts
│   │
│   ├── utils/               # Fonctions utilitaires
│   │   ├── cn.ts                # Merge classes Tailwind
│   │   ├── dateHelpers.ts
│   │   ├── taskMapper.ts
│   │   ├── taskFormatter.ts
│   │   ├── taskHelpers.ts
│   │   ├── colorUtils.ts
│   │   └── storage.ts
│   │
│   ├── lib/                 # Librairies configurées
│   │   └── migrateLocalStorage.ts
│   │
│   ├── index.css            # Styles globaux Tailwind
│   ├── App.tsx              # Composant racine
│   └── main.tsx             # Point d'entrée
│
├── public/
│   ├── Monogram.svg         # Logo
│   └── favicon.ico
│
├── tests/
│   ├── unit/                # Tests unitaires
│   ├── integration/         # Tests d'intégration
│   └── e2e/                 # Tests end-to-end
│
├── .env.example             # Template de configuration
├── tailwind.config.js       # Configuration Tailwind
├── vite.config.ts           # Configuration Vite
├── tsconfig.json            # Configuration TypeScript
└── package.json
```

## 📄 Pages & Fonctionnalités

### 🔐 Authentification

- **Login** (`/login`) : Connexion email/password

### 📅 Calendrier Principal

- **CalendarPage** (`/calendar`) : Vue principale avec 3 modes
  - 👤 **Vue Jour** : Colonnes par membre avec scroll horizontal
  - 📆 **Vue Semaine** : Grille hebdomadaire classique
  - 📊 **Vue Mois** : Calendrier mensuel avec aperçu
- Drag & drop des tâches
- Redimensionnement des tâches
- Sheet d'édition latéral complet
- Filtres multi-critères (membres, équipes, clients, projets)
- Couleurs par client ou par membre
- Indicateurs de conflits temps réel

### 🔧 Administration

#### Configuration

- **NotionConnectionPage** : Configuration des bases Notion
- **MappingBasesPage** : Mapping des champs Notion
- **CalendarConfigPage** : Personnalisation du calendrier
  - Configuration des équipes affichées
  - Couleurs clients
  - Paramètres d'affichage

#### Monitoring

- **GlobalView** : Vue d'ensemble système
- **CacheDashboard** : Métriques du cache
- **HealthMemoryPage** : Santé & mémoire

#### Synchronisation

- **SyncControlPage** : Contrôles de synchronisation
- **ConflictsPage** : Gestion des conflits
- **WebhookLogsPage** : Logs webhooks Notion

#### Utilisateurs

- **UsersPage** : CRUD utilisateurs avec rôles

## 🏗️ Architecture

### Flux de Données

```
User Action
    ↓
Component (React)
    ↓
Custom Hook (useXxx)
    ↓
TanStack Query / Zustand Store
    ↓
API Service (Axios)
    ↓
Backend API
    ↓
Notion / MongoDB
```

### Optimistic Updates

```typescript
// Exemple d'update optimiste
const updateTask = useOptimisticTaskUpdate();

const handleUpdate = (taskId, updates) => {
  updateTask.mutate(
    { taskId, updates },
    {
      // UI mise à jour immédiatement
      onMutate: async (newData) => {
        // Annuler les requêtes en cours
        await queryClient.cancelQueries(['tasks']);

        // Snapshot de l'état actuel
        const previousTasks = queryClient.getQueryData(['tasks']);

        // Mise à jour optimiste
        queryClient.setQueryData(['tasks'], (old) =>
          updateTaskInList(old, newData)
        );

        return { previousTasks };
      },

      // Rollback si erreur
      onError: (err, newData, context) => {
        queryClient.setQueryData(['tasks'], context.previousTasks);
        toast.error('Erreur lors de la mise à jour');
      }
    }
  );
};
```

## 🎨 Composants UI

### Radix UI + Tailwind

Tous les composants UI sont basés sur **Radix UI** (accessibilité native) + **Tailwind CSS** :

- **Formulaires** : Form, Input, Textarea, Select, Checkbox, Radio, Switch
- **Navigation** : Sidebar, Tabs, Accordion, Collapsible
- **Overlays** : Dialog, Sheet, Popover, Tooltip, AlertDialog
- **Feedback** : Toast (Sonner), Progress, Skeleton
- **Data Display** : Card, Avatar, Badge, Separator
- **Actions** : Button, Toggle, Command

### Composants Calendrier

- **CalendarView** : Conteneur principal FullCalendar
- **CalendarHeader** : Navigation + contrôles
- **CalendarControls** : Filtres rapides
- **TaskCard** : Carte de tâche avec drag & drop
- **TaskEditSheet** : Panneau d'édition complet
- **MemberColumn** : Colonne par membre (vue Jour)
- **UnassignedColumn** : Tâches non assignées

## 📦 State Management

### Zustand Stores

```typescript
// auth.store.ts - Authentification
const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));

// calendar.store.ts - État du calendrier
const useCalendarStore = create<CalendarStore>((set) => ({
  view: 'dayGridMonth',
  selectedDate: new Date(),
  setView: (view) => set({ view }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));

// filter.store.ts - Filtres actifs
const useFilterStore = create<FilterStore>((set) => ({
  selectedTeams: [],
  selectedMembers: [],
  selectedClients: [],
  toggleTeam: (teamId) => set((state) => ({
    selectedTeams: state.selectedTeams.includes(teamId)
      ? state.selectedTeams.filter(id => id !== teamId)
      : [...state.selectedTeams, teamId]
  })),
}));
```

### TanStack Query

Gestion des requêtes async avec cache automatique :

```typescript
// Récupérer les tâches avec cache
const { data: tasks, isLoading } = useQuery({
  queryKey: ['tasks', filters],
  queryFn: () => tasksService.getTasks(filters),
  staleTime: 30000, // 30 secondes
  refetchOnWindowFocus: true,
});

// Mutation avec invalidation
const createTaskMutation = useMutation({
  mutationFn: tasksService.createTask,
  onSuccess: () => {
    queryClient.invalidateQueries(['tasks']);
    toast.success('Tâche créée !');
  },
});
```

## 🧪 Tests

### Lancer les Tests

```bash
# Tous les tests
npm test

# Interface graphique
npm run test:ui

# Mode watch
npm run test:watch

# Couverture
npm run test:coverage
```

### Structure des Tests

```typescript
// Exemple de test composant
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from './TaskCard';

describe('TaskCard', () => {
  it('should display task title', () => {
    const task = { id: '1', title: 'Test Task' };
    render(<TaskCard task={task} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('should handle drag and drop', () => {
    const onDrop = jest.fn();
    render(<TaskCard task={task} onDrop={onDrop} />);

    const card = screen.getByTestId('task-card');
    fireEvent.dragStart(card);
    fireEvent.drop(card);

    expect(onDrop).toHaveBeenCalled();
  });
});
```

### Couverture Cible

- **Composants** : > 80%
- **Hooks** : > 90%
- **Utils** : > 95%
- **Services** : > 70%

## 🚢 Build & Déploiement

### Build de Production

```bash
# Build optimisé
npm run build

# Dossier dist/ généré avec :
# - Code minifié et tree-shaken
# - Assets avec hash pour cache busting
# - Chunks optimisés pour lazy loading
```

### Optimisations Vite

- **Tree shaking** : Élimination code mort
- **Code splitting** : Routes lazy loaded
- **Asset optimization** : Images et fonts optimisés
- **Compression** : Gzip/Brotli automatique
- **Cache busting** : Hash dans les noms de fichiers

### Déploiement

#### Serveur Statique (Nginx)

```nginx
server {
    listen 80;
    server_name mattertraffic.com;

    root /var/www/matter-traffic-frontend/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API
    location /api {
        proxy_pass http://backend:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Azure Static Web Apps

```bash
# Déploiement automatique via GitHub Actions
# Configuration dans azure-static-web-apps-xxx.yml
```

## ⚡ Performance

### Optimisations React

```typescript
// Mémoization des composants
const TaskCard = React.memo(({ task }) => {
  return <div>{task.title}</div>;
});

// useMemo pour calculs coûteux
const filteredTasks = useMemo(() =>
  tasks.filter(task => filters.includes(task.teamId)),
  [tasks, filters]
);

// useCallback pour fonctions
const handleTaskClick = useCallback((taskId) => {
  setSelectedTask(taskId);
}, []);

// Lazy loading des routes
const AdminPage = lazy(() => import('./pages/admin/Dashboard'));
```

### Métriques Cibles

- ⏱️ **Time to Interactive** : < 3s
- 📦 **Bundle size** : < 500kb (gzipped)
- 🎨 **First Contentful Paint** : < 1.5s
- ♻️ **Cache hit rate** : > 90%

## 🤝 Contribution

### Workflow Git

```bash
# 1. Créer une branche
git checkout -b feature/nom-feature

# 2. Développer
# ... code ...

# 3. Tests + Linting
npm test
npm run lint
npm run type-check

# 4. Commit
git commit -m "feat: ajout composant TaskEditSheet"

# 5. Pull Request vers develop
git push origin feature/nom-feature
```

### Standards de Code

- **Commits** : Convention Conventional Commits
- **Composants** : PascalCase, un composant par fichier
- **Hooks** : Préfixe `use`, fichiers `.ts`
- **Types** : Définitions centralisées dans `types/`
- **Styles** : Tailwind classes uniquement

### Pre-commit Hooks

Husky configuré pour vérifier :
- ✅ Linting (ESLint)
- ✅ Formatage (Prettier)
- ✅ Type checking (TypeScript)

## 🔍 Debugging

### DevTools

```bash
# React DevTools
# Extension Chrome/Firefox

# TanStack Query DevTools
# Activé automatiquement en dev

# Zustand DevTools
# Via Redux DevTools Extension
```

### Logs

```typescript
// Activer les logs détaillés
localStorage.setItem('debug', '*');

// Logs API uniquement
localStorage.setItem('debug', 'api:*');

// Logs calendar uniquement
localStorage.setItem('debug', 'calendar:*');
```

### Problèmes Courants

| Problème | Solution |
|----------|----------|
| API unreachable | Vérifier `VITE_API_URL` et backend démarré |
| CORS errors | Vérifier `FRONTEND_URL` dans backend .env |
| Hot reload ne fonctionne pas | Activer `CHOKIDAR_USEPOLLING=true` |
| JWT expired | Re-login ou vérifier refresh token |
| Build errors | `npm run type-check` pour voir les erreurs TS |

## 📚 Documentation Supplémentaire

- 🎨 [Design System](./docs/design-system.md) - Guide des composants UI
- 🏗️ [Architecture](./docs/architecture.md) - Décisions techniques
- 📘 [API Integration](./docs/api.md) - Guide d'intégration API
- 📝 [Changelog](./CHANGELOG.md) - Historique des versions

## 📄 Licence

MIT © FabLab - Voir [LICENSE](LICENSE) pour plus de détails

---

<div align="center">

**[⬆ Retour en haut](#-matter-traffic-manager---frontend)**

Made with ❤️ by the FabLab team

</div>
