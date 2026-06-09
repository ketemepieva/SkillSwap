# SkillSwap

SkillSwap est une plateforme d'echange de competences entre particuliers et professionnels.  
L'objectif est de connecter des profils complementaires pour apprendre, transmettre et collaborer autour de domaines tres varies (tech, design, langues, artisanat, business, etc.).

## Fonctionnalites principales

- Authentification complete (inscription, connexion, session utilisateur).
- Profil utilisateur enrichi (avatar, bio, niveau, localisation, badge, avis de tutorat).
- Messagerie en vue unique (liste des conversations + fil de discussion cote a cote, rafraichissement automatique du fil ouvert).
- Notifications avec badge numerote dans la navigation et signal sonore a l'arrivee de nouvelles notifications.
- Sessions de tutorat initiees depuis le chat : demande -> acceptation -> duree (jours/semaines/mois) -> rappels d'echeance -> cloture automatique -> evaluation du tuteur (note + commentaire visibles sur son profil).
- Echanges de competences (demandes, suivi, statuts).
- Feed communautaire avec priorisation visuelle des niveaux (Expert / Intermediaire / Debutant).
- Recherche dynamique dans le feed:
  - par competence,
  - par domaine/categorie,
  - par utilisateur.
- Filtrage par categorie et niveau, suggestions de competences populaires.
- Profils de demonstration auto-generes au demarrage backend (pour une plateforme vivante des le premier lancement).

## Stack technique

### Frontend
- React 19
- React Router
- Vite
- Tailwind CSS 4

### Backend
- Node.js
- Express
- SQLite (better-sqlite3)
- JWT + bcryptjs
- Multer (upload avatars)

## Structure du projet

```text
SkillSwap/
  backend/    # API Express + SQLite
  frontend/   # Application React/Vite
```

## Prerequis

- Node.js 20+ (recommande)
- npm 10+

## Installation

```bash
npm install --prefix backend
npm install --prefix frontend
```

## Configuration environnement

Copier les exemples:

- `backend/.env.example` vers `backend/.env`
- `frontend/.env.example` vers `frontend/.env` (optionnel en local)

Variables backend importantes:

- `PORT` (ex: 5000)
- `JWT_SECRET`
- `SQLITE_PATH` (optionnel)
- `TUTORING_REMINDERS` (optionnel, delais de rappel de fin de session en minutes, ex: `10080,1440,60`)
- `TUTORING_SWEEP_INTERVAL_MS` (optionnel, frequence du planificateur de tutorat)

Variables frontend importantes:

- `VITE_DEV_PROXY_TARGET` (ex: `http://127.0.0.1:5000`)
- `VITE_API_URL` (optionnel pour prod)

## Lancer en developpement

Dans deux terminaux:

```bash
npm run dev:backend
npm run dev:frontend
```

## Build production

```bash
npm run build:frontend
```

Le backend se lance avec:

```bash
npm run start:backend
```

## Qualite / verification

- Build frontend valide.
- Controle linter frontend via:

```bash
npm run lint:frontend
```

## Deployment readiness

Le projet est prepare pour un deploiement decouple:

- Frontend build static (`frontend/dist`).
- Backend API configurable via variables d'environnement.
- Base SQLite locale par defaut, chemin personnalisable (`SQLITE_PATH`).
- Fichiers sensibles et artefacts runtime ignores via `.gitignore`.

## Roadmap courte

- Captures ecran et gif de demo dans ce README.
- Pipeline CI (lint/build/tests).
- Deploiement cloud (API + frontend) documente.

