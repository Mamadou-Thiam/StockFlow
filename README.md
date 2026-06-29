# Stockflow

Application SaaS de gestion de stock, ventes et facturation pour les PME.

## Architecture

```
stockflow/
├── backend/          # API Express + TypeScript + MongoDB
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── frontend/         # React + Vite + TypeScript + Ant Design
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   └── package.json
└── render.yaml       # Configuration de déploiement Render
```

## Fonctionnalités

- **Gestion de stock** : Produits, catégories, stock minimum
- **Point de vente** : Ventes rapides avec caisse intégrée
- **Facturation** : Génération et envoi de factures PDF
- **Clients** : Gestion des clients avec historique
- **Multi-utilisateurs** : 3 rôles (super_admin, admin, caissier)
- **Multi-entreprise** : Architecture multi-tenant
- **Rapports** : Tableau de bord, statistiques, exports Excel

## Rôles et permissions

| Rôle | Accès |
|---|---|
| **super_admin** | Gestion globale de toutes les entreprises |
| **admin** | Gestion complète de son entreprise |
| **caissier** | Ventes, consultation des données (lecture seule) |

## Prérequis

- Node.js 18+
- MongoDB 7+
- npm

## Installation

```bash
# Backend
cd backend
npm install
cp .env.dev.example .env.dev
# Éditer .env.dev avec vos paramètres MongoDB
npm run dev

# Frontend
cd frontend
npm install
cp .env.development.example .env.development
npm run dev
```

## Déploiement sur Render

Voir [render.yaml](render.yaml) et la documentation Render pour le déploiement.

### Variables d'environnement requises

**Backend :**
- `MONGODB_URI` — URI de connexion MongoDB
- `JWT_SECRET` — Clé secrète JWT
- `SUPER_ADMIN_EMAIL` — Email du super admin
- `SUPER_ADMIN_PASSWORD` — Mot de passe du super admin
- `FRONTEND_URL` — URL du frontend (CORS)

**Frontend :**
- `VITE_API_URL` — URL de l'API backend
