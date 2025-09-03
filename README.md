# Matter Traffic Frontend

Interface utilisateur pour Matter Traffic Manager - Gestionnaire de trafic intelligent basé sur Notion.

## 🚀 Stack Technologique

- **Framework**: React 19.0
- **Build Tool**: Vite 6.0+
- **Langage**: TypeScript 5.7+
- **State Management**: Zustand 5.0+
- **UI Framework**: Tailwind CSS 3.4+
- **Calendar**: FullCalendar 6.1+
- **Tests**: Vitest 2.1+ + React Testing Library
- **Qualité**: ESLint + Prettier + Husky

## 📋 Prérequis

- Node.js 20 ou supérieur
- npm ou yarn
- Backend API en fonctionnement (port 5005)
- Docker et Docker Compose (optionnel mais recommandé)

## 🔧 Installation

### Méthode 1: Installation locale

```bash
# Cloner le projet
cd matter-traffic-frontend

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer l'URL de l'API dans .env
echo "VITE_API_URL=http://localhost:5005" > .env

# Démarrer en mode développement
npm run dev
```

### Méthode 2: Avec Docker (recommandé)

```bash
# Depuis la racine du projet MatterTrafficManager
docker-compose up frontend
```

L'application sera accessible sur: http://localhost:5173

## 🌍 Variables d'environnement

Copier `.env.example` vers `.env` et configurer:

```bash
# URL de l'API backend
VITE_API_URL=http://localhost:5005

# Mode de développement
VITE_MODE=development

# Outils de développement
VITE_DEV_TOOLS=true
VITE_LOG_LEVEL=debug

# Pour Docker hot reload
CHOKIDAR_USEPOLLING=true
```

## 📜 Scripts disponibles

```bash
# Développement avec hot reload
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview

# Tests
npm test                # Tests unitaires
npm run test:ui        # Interface de test Vitest
npm run test:watch     # Tests en mode watch
npm run test:coverage  # Coverage des tests

# Qualité de code
npm run lint           # Linter ESLint
npm run lint:fix       # Fix automatique
npm run format         # Formatage Prettier
npm run type-check     # Vérification TypeScript
```

## 🗂️ Structure du projet

```
src/
├── assets/           # Images, fonts, styles globaux
├── components/       # Composants React réutilisables
├── features/         # Modules fonctionnels
├── hooks/           # Custom React hooks
├── layouts/         # Layouts de page
├── pages/           # Composants de pages
├── services/        # Services API et utilitaires
├── store/           # Zustand store
├── types/           # Définitions TypeScript
├── utils/           # Fonctions utilitaires
├── App.tsx
└── main.tsx

tests/
├── unit/           # Tests unitaires
├── integration/    # Tests d'intégration
└── e2e/           # Tests end-to-end

public/
├── favicon.ico
└── manifest.json
```

## ✨ Fonctionnalités principales

- 📅 **Calendrier interactif**: Gestion des tâches avec drag & drop
- 🎨 **Interface moderne**: Design responsive avec Tailwind CSS
- ⚡ **Performance**: Hot reload ultra-rapide avec Vite
- 🔄 **État global**: Gestion avec Zustand
- 🌐 **API Integration**: Communication avec le backend Express
- 🧪 **Tests complets**: Unitaires, intégration et E2E
- 🎯 **TypeScript**: Typage fort pour la fiabilité

## 🔌 Services API

```typescript
// Exemple d'utilisation du service API
import { apiClient } from '@/services/api';

// Récupérer les tâches
const tasks = await apiClient.get('/tasks');

// Créer une nouvelle tâche
const newTask = await apiClient.post('/tasks', {
  title: 'Nouvelle tâche',
  description: 'Description de la tâche'
});
```

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests avec interface graphique
npm run test:ui

# Tests avec surveillance
npm run test:watch

# Rapport de couverture
npm run test:coverage

# Tests E2E avec Playwright
npm run test:e2e
```

### Structure des tests:
- **Unitaires**: Tests des composants isolés
- **Intégration**: Tests des interactions entre composants
- **E2E**: Tests du parcours utilisateur complet

## 🎨 Styling et Thème

### Tailwind CSS
- Configuration personnalisée dans `tailwind.config.js`
- Classes utilitaires pour un développement rapide
- Responsive design mobile-first

### Variables CSS personnalisées
```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
}
```

## 📱 Responsive Design

- **Mobile First**: Design optimisé pour mobile
- **Breakpoints Tailwind**: sm, md, lg, xl, 2xl
- **Components adaptatifs**: Menus, calendrier, cartes

## 🚢 Déploiement

### Build de production
```bash
npm run build
```

### Serveur de production (avec Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend:5005;
    }
}
```

## ⚡ Optimisations

### Vite optimisations:
- **Tree shaking**: Elimination du code mort
- **Code splitting**: Chargement lazy des routes
- **Cache busting**: Noms de fichiers avec hash
- **Compression**: Gzip/Brotli automatique

### React optimisations:
- **React.memo**: Mémoization des composants
- **useMemo/useCallback**: Optimisation des recalculs
- **Lazy loading**: Chargement différé des composants

## 🔧 Configuration Vite

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Pour Docker
    hmr: { port: 5173 }
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  }
});
```

## 🤝 Contribution

1. Créer une branche feature: `git checkout -b feature/nom-feature`
2. Développer avec les hooks pre-commit activés
3. Tests passants: `npm test`
4. Linting correct: `npm run lint`
5. Type-check OK: `npm run type-check`
6. Pull Request vers `develop`

## 🔍 Debugging

### DevTools disponibles:
- React DevTools
- Redux DevTools (Zustand)
- Vite DevTools

### Logs de développement:
```typescript
// Activer les logs détaillés
localStorage.setItem('debug', '*');

// Logs API uniquement
localStorage.setItem('debug', 'api:*');
```

## 🛠️ Outils de développement

- **Vite**: Build tool ultra-rapide
- **React DevTools**: Inspection des composants
- **Zustand DevTools**: Debug du state management
- **Vitest**: Framework de test moderne
- **ESLint**: Linting avancé pour React/TypeScript
- **Prettier**: Formatage automatique
- **Husky**: Git hooks pour la qualité

## 🌐 Multi-environnements

```bash
# Développement
VITE_API_URL=http://localhost:5005

# Staging  
VITE_API_URL=https://staging-api.mattertraffic.com

# Production
VITE_API_URL=https://api.mattertraffic.com
```

## 📊 Monitoring et Analytics

- Bundle analyzer intégré
- Performance monitoring
- Error tracking (optionnel)
- User analytics (optionnel)

## 📝 Licence

MIT - Voir fichier LICENSE