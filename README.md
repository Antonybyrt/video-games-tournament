# Tournament API

API REST de gestion de tournois de jeux vidéo — NestJS + TypeORM + PostgreSQL.

## Prerequis

- Node.js >= 20
- pnpm
- Docker Desktop (lance avant toute chose)

## Installation

```bash
pnpm install
```

## Lancement (dev)

```bash
# 1. Demarrer la base de donnees
docker compose -f docker/docker-compose.dev.yml --env-file .env.dev up -d db

# 2. Demarrer l'API
pnpm start:dev
```

> **En mode `development` (`NODE_ENV=development`), TypeORM synchronise automatiquement
> le schema avec les entites au demarrage — aucune migration a executer.**
> Les migrations ne sont necessaires qu'en production (voir [Docker](docker/README.md)).

L'API est accessible sur http://localhost:3000/api/v1

## Variables d'environnement

Fichier `.env.dev` (deja cree) :

| Variable | Description |
|---|---|
| NODE_ENV | `development` |
| PORT | Port de l'API (defaut 3000) |
| DATABASE_URL | URL de connexion PostgreSQL |
| JWT_SECRET | Secret JWT (min 32 caracteres) |
| JWT_EXPIRES_IN | Duree du token (ex: `7d`) |
| POSTGRES_DB | Nom de la base |
| POSTGRES_USER | Utilisateur PostgreSQL |
| POSTGRES_PASSWORD | Mot de passe PostgreSQL |

## Scripts disponibles

```bash
pnpm build                  # Compilation TypeScript
pnpm start:dev              # Demarrage avec hot-reload
pnpm lint                   # Lint ESLint
pnpm test                   # Tests unitaires
pnpm test:e2e               # Tests d'integration
pnpm migration:generate <chemin/NomMigration>  # Generer une migration
pnpm migration:run          # Appliquer les migrations
pnpm migration:revert       # Annuler la derniere migration
```

## Lancement (prod)

```bash
# 1. Creer .env.prod a la racine (voir variables ci-dessous)
# 2. Demarrer la stack complete (db + migrations + api)
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod up -d
```

Le service `migrate` execute automatiquement les migrations TypeORM avant le demarrage de l'API. L'API est accessible sur http://localhost:3000/api/v1.

Variables `.env.prod` requises :

| Variable | Description |
|---|---|
| NODE_ENV | `production` |
| PORT | `3000` |
| POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD | Identifiants Postgres |
| DATABASE_URL | `postgresql://<user>:<password>@tournament_db_prod:5432/<db>` (hostname = nom du container) |
| JWT_SECRET | min 32 caracteres |
| JWT_EXPIRES_IN | ex: `1h` |
| APP_IMAGE | (optionnel) image publiee, defaut `ghcr.io/servald/video-games-tournament/api:latest` |

Logs : `docker logs tournament_app_prod` / `docker logs tournament_migrate_prod`.

Pour builder et publier votre propre image, voir [Documentation Docker](docker/README.md).

## Tests

```bash
pnpm test                 # tests unitaires
pnpm test:e2e             # tests d'integration (lance/arrete une BDD Postgres jetable via Docker)
```

Les tests d'integration ont besoin de Docker Desktop demarre. La base `db_test` est cree puis detruite automatiquement par les hooks Jest globaux.

## Docker

Pour les workflows Docker avancés (dev dans un container, build de l'image, déploiement prod) :

→ [Documentation Docker](docker/README.md)

## Arreter la base de donnees

```bash
docker compose -f docker/docker-compose.dev.yml down
```

## Verifier les tables en BDD

```bash
docker exec tournament_db_dev psql -U tournament_user -d tournament_dev -c "\dt"
```