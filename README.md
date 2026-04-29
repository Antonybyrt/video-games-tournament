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

# 2. Attendre que le healthcheck passe (quelques secondes), puis generer la migration initiale
pnpm migration:generate src/infrastructure/database/migrations/InitialSchema

# 3. Appliquer la migration
pnpm migration:run

# 4. Demarrer l'API
pnpm start:dev
```

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

## Docker

Pour les workflows Docker (dev dans un container, build de l'image, déploiement prod) :

→ [Documentation Docker](docker/README.md)

## Arreter la base de donnees

```bash
docker compose -f docker/docker-compose.dev.yml down
```

## Verifier les tables en BDD

```bash
docker exec tournament_db_dev psql -U tournament_user -d tournament_dev -c "\dt"
```