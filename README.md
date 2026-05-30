# Koloti — Plateforme ASL

Application web de gestion d'une Association Syndicale Libre (ASL) de lotissement.
SvelteKit PWA · Supabase · Netlify

## Prérequis

- Node.js 22+
- [Supabase CLI](https://supabase.com/docs/guides/cli) installé globalement (`npm i -g supabase`)

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Copier les variables d'environnement
cp .env.example .env
# → Renseigner les valeurs dans .env

# 3. Démarrer Supabase en local
supabase start

# 4. Appliquer les migrations
supabase db reset

# 5. Générer les types TypeScript depuis le schéma
npm run gen:types

# 6. Lancer le serveur de développement
npm run dev
```

## Config

Toutes les variables sont dans `.env` (jamais committer ce fichier — voir `.env.example`).

| Variable                                              | Portée                 | Description                   |
| ----------------------------------------------------- | ---------------------- | ----------------------------- |
| `PUBLIC_SUPABASE_URL`                                 | Client + Serveur       | URL du projet Supabase        |
| `PUBLIC_SUPABASE_ANON_KEY`                            | Client + Serveur       | Clé publique anon             |
| `SUPABASE_SERVICE_ROLE_KEY`                           | **Serveur uniquement** | Clé service_role (bypass RLS) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Serveur                | SMTP custom (Brevo/Resend)    |
| `SMTP_FROM` / `SMTP_FROM_NAME`                        | Serveur                | Expéditeur des emails         |
| `PUBLIC_APP_URL`                                      | Client + Serveur       | URL publique de l'application |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypasse toutes les RLS. Ne jamais l'exposer côté client.

## Supabase — Workflow dev → prod

```bash
# Créer une migration
supabase migration new <nom>

# Appliquer en local
supabase db reset

# Appliquer en production
supabase db push --linked

# Générer les types après une migration
npm run gen:types
```

**Région impérative : Europe (UE)** — RGPD, sélectionnée à la création du projet, irréversible.

**Ne jamais modifier le schéma production via l'UI Supabase.** Toujours passer par des migrations versionnées.

## Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run preview      # Prévisualiser le build
npm run check        # Vérification TypeScript (svelte-check)
npm run lint         # Prettier + ESLint
npm run format       # Formater le code
npm run test         # Tests unitaires (Vitest)
npm run gen:types    # Générer src/lib/types/database.ts depuis Supabase local
```

## Architecture

Voir [PLAN.md](./PLAN.md) pour les décisions d'architecture et [SPEC.md](./SPEC.md) pour la spec fonctionnelle.

```
src/
├── routes/
│   ├── (auth)/     # login, activation, magic-link
│   ├── (app)/      # espace connecté (membres)
│   └── (admin)/    # gestion (admin/éditeur)
├── lib/
│   ├── server/     # SERVEUR UNIQUEMENT — ne jamais importer côté client
│   ├── supabase/   # clients browser/server
│   ├── components/ # composants UI réutilisables
│   ├── stores/     # état client
│   ├── types/      # types TypeScript (database.ts généré)
│   └── utils/      # validation, formatage, markdown
supabase/
├── migrations/     # SQL versionné
└── functions/      # Edge Functions Deno
```
