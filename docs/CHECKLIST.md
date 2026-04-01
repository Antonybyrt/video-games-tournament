# Tableau de bord — NestJS Tournament API

## Récapitulatif des étapes

| # | Étape | Objectif | Dépendances | Validation |
|---|---|---|---|---|
| 0 | Bootstrap & Config | Activer TypeScript strict, ESLint, path aliases, env | — | `pnpm build && pnpm lint && pnpm test` → zéro erreur |
| 1 | Database Module | Connecter PostgreSQL, créer 4 entités TypeORM, migration initiale | 0 | `pnpm migration:run` + vérifier 5 tables en BDD |
| 2 | Infrastructure partagée | Enveloppe réponse unifiée, filter, ValidationPipe global | 0 | `curl /api/v1` → `{ success, data, timestamp }` |
| 3 | Auth Module | Register/Login JWT, guards, hiérarchie exceptions domaine | 1, 2 | Register → JWT, route protégée sans token → 401 |
| 4 | Game Module | Valider le pattern DI Clean Architecture sur un module simple | 3 | `POST /api/v1/games` admin → 201, user → 403 |
| 5 | Tournament Module | CRUD + join, logique métier dans les entités domaine | 4 | Double join → 409, tournoi plein → 422 |
| 6 | Player Module | Endpoints read-only, mapper sans champ `password` | 5 | `GET /api/v1/players/1` → `password` absent |
| 7 | Match Module | Soumettre un résultat, valider le format du score | 6 | `POST /api/v1/matches/:id/result` → 200, score invalide → 400 |
| 8 | Hardening & Audit | Audit Clean Architecture, zéro lint, exceptions centralisées | 7 | `grep -r "@nestjs" src/domain src/application` → rien |
| 9 | Docker | Deux environnements dev/prod fonctionnels, multi-stage | 8 | `docker-compose -f docker/docker-compose.prod.yml up` → app répond |
| 10 | Tests d'intégration | Couvrir toutes les routes (succès + erreurs métier) | 9 | `pnpm test:e2e` → tous verts |
| 11 | README | Documentation exhaustive installation/utilisation | 10 | README relu, toutes les commandes fonctionnent |
| B1 | WebSockets | Notifications temps réel sur changement de statut tournoi | 8 | Client Socket.IO reçoit `tournament.status_changed` |
| B2 | Brackets | Génération automatique bracket élimination directe | 5 | `POST /tournaments/:id/start` → matches round 1 créés |
| B3 | Statistiques | Win rate, classements globaux, historique par joueur | 7 | `GET /api/v1/players/:id/stats` → `{ winRate, totalMatches }` |
| B4 | Swagger | Documentation OpenAPI complète avec exemples | 2 | `GET /api/docs` → UI Swagger accessible |
| B5 | Tests unitaires | Un `.spec.ts` par use-case, mocks des interfaces | Chaque step | `pnpm test` → couverture ≥ 80% |

---

## Détail des étapes

---

### Step 0 — Bootstrap & Config Hardening

**Objectif :** Activer TypeScript strict, ESLint durci, path aliases, fichiers d'environnement.

**Fichiers à créer :**
```
.env.dev
.env.prod
docker/                          (dossier vide pour l'instant)
```

**Fichiers à modifier :**
```
tsconfig.json
tsconfig.build.json
eslint.config.mjs
package.json
.gitignore
```

**Dépendances :** aucune.

**Critères de validation :**
```bash
pnpm build          # zéro erreur TypeScript
pnpm lint           # zéro erreur ESLint
pnpm test           # AppController spec passe
```

**Points de vigilance :**
- `"strict": true` remplace tous les flags partiels (`strictNullChecks`, `strictBindCallApply`, etc.). Supprimer les doublons.
- Les path aliases `@domain/*` etc. doivent être déclarés dans **deux** endroits : `tsconfig.json` (compilation) ET `package.json > jest > moduleNameMapper` (tests). L'oublier dans Jest casse les tests sans casser le build.
- `pnpm add -D tsconfig-paths` est requis pour que ts-node résolve les aliases en dehors de Jest.
- Ne pas committer `.env.dev` ni `.env.prod` — vérifier `.gitignore`.

---

### Step 1 — Database Module + TypeORM

**Objectif :** Connexion PostgreSQL via TypeORM, 4 entités, table de jointure, migration initiale.

**Fichiers à créer :**
```
src/infrastructure/database/typeorm.config.ts
src/infrastructure/database/database.module.ts
src/infrastructure/config/app.config.ts
src/infrastructure/config/env.validation.ts
src/infrastructure/repositories/player/player.typeorm-entity.ts
src/infrastructure/repositories/tournament/tournament.typeorm-entity.ts
src/infrastructure/repositories/match/match.typeorm-entity.ts
src/infrastructure/repositories/game/game.typeorm-entity.ts
docker/docker-compose.dev.yml
.env.dev                         (déjà créé en Step 0, compléter)
```

**Fichiers à modifier :**
```
src/app.module.ts                (import DatabaseModule + ConfigModule)
package.json                     (scripts migration:generate, migration:run, migration:revert)
```

**Dépendances :** Step 0.

**Critères de validation :**
```bash
# Lancer la BDD
docker-compose -f docker/docker-compose.dev.yml up -d db

# Générer la migration initiale
pnpm migration:generate -- -n InitialSchema

# Appliquer la migration
pnpm migration:run

# Vérifier les tables en BDD (5 tables attendues)
docker exec <container> psql -U tournament -d tournament -c "\dt"
# → players, games, tournaments, tournament_players, matches
```

**Points de vigilance :**
- `synchronize: false` dans TOUS les contextes (DatabaseModule + AppDataSource CLI). Un seul `true` suffit à corrompre le schéma en dev.
- `typeorm.config.ts` (pour le CLI) doit utiliser `process.env` directement — le DI NestJS n'est pas disponible lors de l'exécution des migrations en shell.
- `AppDataSource` doit être un export nommé (pas default) pour que le CLI le trouve.
- La `DATABASE_URL` dans le `docker-compose.dev.yml` doit pointer vers le service `db` (hostname), pas vers `localhost`.

---

### Step 2 — Infrastructure partagée

**Objectif :** Enveloppe réponse unifiée, exception filter global, ValidationPipe strict.

**Fichiers à créer :**
```
src/infrastructure/http/interceptors/response-envelope.interceptor.ts
src/infrastructure/http/filters/http-exception.filter.ts
src/infrastructure/http/pipes/validation.pipe.ts
```

**Fichiers à modifier :**
```
src/main.ts                      (useGlobalPipes, useGlobalInterceptors, useGlobalFilters, setGlobalPrefix)
```

**Dépendances :** Step 0.

**Critères de validation :**
```bash
pnpm start:dev

# Réponse succès
curl http://localhost:3000/api/v1
# → { "success": true, "data": "Hello World!", "timestamp": "..." }

# Réponse erreur 404
curl http://localhost:3000/api/v1/inexistant
# → { "success": false, "error": { "code": 404, "message": "..." }, "timestamp": "..." }

# Validation pipe — body invalide (après Step 3 pour avoir une route POST)
curl -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d '{}'
# → { "success": false, "error": { "code": 400, "message": ["..."] } }
```

**Points de vigilance :**
- `useGlobalPipes/Interceptors/Filters` dans `main.ts` sont **hors DI** : impossible d'y injecter des services. Garder ces classes stateless. Si un logger est nécessaire, utiliser `APP_INTERCEPTOR` / `APP_FILTER` dans `AppModule.providers`.
- `whitelist: true` sur `ValidationPipe` : propriétés inconnues silencieusement supprimées. Ajouter `forbidNonWhitelisted: true` pour retourner une erreur 400 à la place.
- `transform: true` + `enableImplicitConversion: true` : les `@Param('id')` déclarés `number` seront auto-castés. Attention aux effets de bord sur des types complexes.

---

### Step 3 — Auth Module

**Objectif :** `POST /auth/register` et `POST /auth/login` → JWT, guards, hiérarchie d'exceptions domaine.

**Fichiers à créer :**
```
src/domain/player/player.entity.ts
src/domain/player/player.repository.interface.ts
src/domain/player/value-objects/email.vo.ts
src/domain/shared/exceptions/domain.exception.ts
src/domain/shared/exceptions/not-found.exception.ts
src/domain/shared/exceptions/conflict.exception.ts
src/domain/shared/exceptions/business-rule.exception.ts
src/domain/shared/exceptions/forbidden.exception.ts
src/application/auth/dtos/register.dto.ts
src/application/auth/dtos/login.dto.ts
src/application/auth/use-cases/register.use-case.ts
src/application/auth/use-cases/login.use-case.ts
src/application/auth/ports/token.service.interface.ts
src/application/auth/ports/hash.service.interface.ts
src/infrastructure/auth/jwt.strategy.ts
src/infrastructure/auth/jwt-auth.guard.ts
src/infrastructure/auth/roles.guard.ts
src/infrastructure/auth/roles.decorator.ts
src/infrastructure/auth/jwt-token.service.ts
src/infrastructure/auth/bcrypt-hash.service.ts
src/infrastructure/auth/auth.module.ts
src/infrastructure/repositories/player/player.typeorm-repository.ts
src/presentation/auth/auth.controller.ts
src/presentation/auth/auth.module.ts
src/presentation/player/mappers/player.mapper.ts
```

**Fichiers à modifier :**
```
src/app.module.ts                (import AuthPresentationModule)
src/infrastructure/http/filters/http-exception.filter.ts  (mapper DomainException → HTTP)
```

**Dépendances :** Steps 1, 2.

**Critères de validation :**
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@test.com","password":"Secret1!"}'
# → { "success": true, "data": { "accessToken": "eyJ..." } }

# Email dupliqué → 409
curl -X POST http://localhost:3000/api/v1/auth/register \
  -d '{"username":"alice2","email":"alice@test.com","password":"Secret1!"}'
# → { "success": false, "error": { "code": 409 } }

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -d '{"email":"alice@test.com","password":"Secret1!"}'
# → { "success": true, "data": { "accessToken": "eyJ..." } }

# Route protégée sans token → 401
curl http://localhost:3000/api/v1/tournaments
# → { "success": false, "error": { "code": 401 } }

# Vérifier absence de @nestjs dans domain/application
grep -r "@nestjs" src/domain/       # → rien
grep -r "@nestjs" src/application/  # → rien
```

**Points de vigilance :**
- Les use-cases **ne doivent jamais** importer `ConflictException`, `NotFoundException` etc. de `@nestjs/common`. Lever des `ConflictDomainException`, `NotFoundDomainException` à la place, et les mapper vers HTTP dans `AllExceptionsFilter`.
- `bcrypt.hash` est async — ne pas utiliser la version sync dans NestJS (bloque l'event loop).
- Le `JwtStrategy.validate()` retourne l'objet `request.user` injecté dans les controllers. Typer cet objet explicitement (interface `AuthenticatedUser`) pour éviter les `any`.
- Ne pas stocker le JWT en base — il est stateless. La révocation n'est pas requise pour ce projet.

---

### Step 4 — Game Module

**Objectif :** `GET /games` public, `POST /games` admin — valider le pattern DI Clean Architecture complet.

**Fichiers à créer :**
```
src/domain/game/game.entity.ts
src/domain/game/game.repository.interface.ts
src/application/game/dtos/create-game.dto.ts
src/application/game/dtos/game-response.dto.ts
src/application/game/use-cases/list-games.use-case.ts
src/application/game/use-cases/create-game.use-case.ts
src/infrastructure/repositories/game/game.typeorm-repository.ts
src/presentation/game/game.controller.ts
src/presentation/game/mappers/game.mapper.ts
src/presentation/game/game.module.ts
```

**Fichiers à modifier :**
```
src/app.module.ts                (import GameModule)
```

**Dépendances :** Step 3.

**Critères de validation :**
```bash
# Liste publique
curl http://localhost:3000/api/v1/games
# → { "success": true, "data": [] }

# Création admin (isAdmin=true requis — seed ou UPDATE manuel en BDD)
curl -X POST http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Street Fighter 6","publisher":"Capcom","releaseDate":"2023-06-02","genre":"Fighting"}'
# → { "success": true, "data": { "id": "...", "name": "Street Fighter 6" } }

# User normal → 403
curl -X POST http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"name":"Test","publisher":"Test","releaseDate":"2023-01-01","genre":"Test"}'
# → { "success": false, "error": { "code": 403 } }
```

**Points de vigilance :**
- Le pattern DI avec `useFactory` et `inject: [GAME_REPOSITORY]` est la clé pour que les use-cases reçoivent l'**interface** (symbole), jamais la classe concrète TypeORM.
- `GAME_REPOSITORY` est un `Symbol` déclaré dans `domain/game/game.repository.interface.ts` — jamais dans infrastructure.
- `ParseUUIDPipe` sur les `:id` dès maintenant — l'habitude doit être prise avant les modules suivants.

---

### Step 5 — Tournament Module

**Objectif :** CRUD complet + `POST /tournaments/:id/join`, logique métier dans les entités domaine.

**Fichiers à créer :**
```
src/domain/tournament/tournament.entity.ts
src/domain/tournament/tournament-status.enum.ts
src/domain/tournament/tournament.repository.interface.ts
src/domain/tournament/value-objects/tournament-name.vo.ts
src/application/tournament/dtos/create-tournament.dto.ts
src/application/tournament/dtos/update-tournament.dto.ts
src/application/tournament/dtos/tournament-response.dto.ts
src/application/tournament/use-cases/create-tournament.use-case.ts
src/application/tournament/use-cases/get-tournament.use-case.ts
src/application/tournament/use-cases/list-tournaments.use-case.ts
src/application/tournament/use-cases/update-tournament.use-case.ts
src/application/tournament/use-cases/delete-tournament.use-case.ts
src/application/tournament/use-cases/join-tournament.use-case.ts
src/infrastructure/repositories/tournament/tournament.typeorm-repository.ts
src/presentation/tournament/tournament.controller.ts
src/presentation/tournament/mappers/tournament.mapper.ts
src/presentation/tournament/tournament.module.ts
```

**Fichiers à modifier :**
```
src/app.module.ts
```

**Dépendances :** Step 4.

**Critères de validation :**
```bash
# Créer un tournoi
curl -X POST http://localhost:3000/api/v1/tournaments \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Summer Cup","gameId":"<uuid>","maxPlayers":4,"startDate":"2026-07-01"}'
# → 201 avec id

# Join
curl -X POST http://localhost:3000/api/v1/tournaments/<id>/join \
  -H "Authorization: Bearer $TOKEN"
# → 200

# Double join → 409
curl -X POST http://localhost:3000/api/v1/tournaments/<id>/join \
  -H "Authorization: Bearer $TOKEN"
# → { "error": { "code": 409 } }

# UUID invalide → 400
curl http://localhost:3000/api/v1/tournaments/not-a-uuid
# → { "error": { "code": 400 } }
```

**Points de vigilance :**
- `canJoin()` et `start()` doivent être des méthodes de `Tournament` (domain entity), pas du use-case.
- `ITournamentRepository` doit exposer `countPlayers()` et `isPlayerEnrolled()` — évite de charger toute la relation en mémoire pour valider un join.
- `ParseUUIDPipe` sur **tous** les paramètres `:id` et `:tournamentId`.
- `GET /tournaments` est public : ne pas appliquer `JwtAuthGuard` au niveau de la classe, l'appliquer individuellement sur `POST`, `PUT`, `DELETE`, `JOIN`.

---

### Step 6 — Player Module

**Objectif :** `GET /players`, `GET /players/:id`, `GET /players/:id/tournaments` — read-only, `password` jamais exposé.

**Fichiers à créer :**
```
src/application/player/dtos/player-response.dto.ts
src/application/player/use-cases/list-players.use-case.ts
src/application/player/use-cases/get-player.use-case.ts
src/application/player/use-cases/get-player-tournaments.use-case.ts
src/presentation/player/player.controller.ts
src/presentation/player/mappers/player.mapper.ts
src/presentation/player/player.module.ts
```

**Fichiers à modifier :**
```
src/app.module.ts
src/infrastructure/repositories/player/player.typeorm-repository.ts  (ajouter findTournamentsByPlayerId)
```

**Dépendances :** Step 5.

**Critères de validation :**
```bash
curl http://localhost:3000/api/v1/players \
  -H "Authorization: Bearer $TOKEN"
# → data[] ne contient pas "password"

curl http://localhost:3000/api/v1/players/<id>
# → "password" ABSENT — vérifier avec : | grep password → rien

curl http://localhost:3000/api/v1/players/<id>/tournaments
# → liste des tournois du joueur
```

**Points de vigilance :**
- Utiliser un mapper explicite dans `presentation/player/mappers/player.mapper.ts` — ne pas se fier à `@Exclude()` + `ClassSerializerInterceptor` seul (coupling caché).
- `PlayerResponseDto` ne doit pas avoir de champ `password`, même en `undefined`.
- `GET /players/:id/tournaments` peut être implémenté directement dans `PlayerController` (pas besoin d'un module séparé Tournament ici).

---

### Step 7 — Match Module

**Objectif :** `GET /tournaments/:id/matches`, `POST /matches/:id/result` avec validation du score.

**Fichiers à créer :**
```
src/domain/match/match.entity.ts
src/domain/match/match-status.enum.ts
src/domain/match/match.repository.interface.ts
src/application/match/dtos/match-result.dto.ts
src/application/match/dtos/match-response.dto.ts
src/application/match/use-cases/list-tournament-matches.use-case.ts
src/application/match/use-cases/submit-match-result.use-case.ts
src/infrastructure/repositories/match/match.typeorm-repository.ts
src/presentation/match/match.controller.ts
src/presentation/match/mappers/match.mapper.ts
src/presentation/match/match.module.ts
```

**Fichiers à modifier :**
```
src/presentation/tournament/tournament.controller.ts  (ajouter GET :id/matches)
src/app.module.ts
```

**Dépendances :** Step 6.

**Critères de validation :**
```bash
# Lister les matches d'un tournoi
curl http://localhost:3000/api/v1/tournaments/<id>/matches \
  -H "Authorization: Bearer $TOKEN"
# → { "data": [] }

# Soumettre un résultat valide
curl -X POST http://localhost:3000/api/v1/matches/<id>/result \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"winnerId":"<uuid>","score":"3:1"}'
# → 200

# Score invalide → 400
curl -X POST http://localhost:3000/api/v1/matches/<id>/result \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"winnerId":"<uuid>","score":"trois-un"}'
# → { "error": { "code": 400 } }

# Match déjà terminé → 422
# (relancer la même requête)
# → { "error": { "code": 422 } }
```

**Points de vigilance :**
- `GET /tournaments/:id/matches` dans `TournamentController` (pas `MatchController`) pour éviter un import circulaire entre modules.
- Le `winnerId` doit obligatoirement être `player1Id` ou `player2Id` — vérifier dans le use-case, pas dans le DTO (c'est une règle métier, pas une règle de format).
- `MatchResultDto` valide le **format** (`"X:Y"` via `@Matches(/^\d+:\d+$/)`), le use-case valide la **cohérence** (winnerId appartient au match).

---

### Step 8 — Hardening & Audit

**Objectif :** Centraliser les exceptions, mapper tous les cas dans le filter, zéro lint, audit Clean Architecture.

**Fichiers à créer :**
```
(aucun nouveau fichier — ajustements uniquement)
```

**Fichiers à modifier :**
```
src/infrastructure/http/filters/http-exception.filter.ts  (mapper tous les DomainException)
src/domain/shared/exceptions/*.ts                          (compléter si manquant)
```

**Dépendances :** Steps 3–7.

**Critères de validation :**
```bash
# Audit Clean Architecture
grep -r "@nestjs" src/domain/        # → aucun résultat
grep -r "@nestjs" src/application/   # → aucun résultat

# Audit any
grep -rn ": any" src/                # → aucun résultat
grep -rn "as unknown" src/           # → aucun résultat

# Lint
pnpm lint                            # → zéro erreur

# Build
pnpm build                           # → zéro erreur, zéro warning

# Tous les cas d'erreur
# NotFoundDomainException    → 404
# ConflictDomainException    → 409
# ForbiddenDomainException   → 403
# BusinessRuleDomainException→ 422
# HttpException              → code natif
# Erreur inconnue            → 500
```

**Points de vigilance :**
- `@Catch()` sans argument capture **toutes** les exceptions non gérées — s'assurer que les erreurs TypeORM inattendues retournent 500 et non un message de stack trace en production.
- Le `AllExceptionsFilter` doit être enregistré **après** `ResponseEnvelopeInterceptor` dans `main.ts` (l'ordre des globals compte).
- Vérifier que `NODE_ENV=production` masque les détails d'erreur dans les réponses 500.

---

### Step 9 — Docker

**Objectif :** `docker-compose.dev.yml` (hot-reload) et `docker-compose.prod.yml` (image finale) fonctionnels.

**Fichiers à créer :**
```
docker/Dockerfile
docker/docker-compose.dev.yml        (compléter avec service app)
docker/docker-compose.prod.yml
docker/.env.example
```

**Dépendances :** Step 8.

**Critères de validation :**
```bash
# Dev
docker-compose -f docker/docker-compose.dev.yml up
curl http://localhost:3000/api/v1    # → réponse OK

# Prod (build multi-stage)
docker-compose -f docker/docker-compose.prod.yml up -d
curl http://localhost:3000/api/v1    # → réponse OK

# Vérifier taille image prod (doit être < 200MB)
docker images tournament_app

# Migrations en prod
docker-compose -f docker/docker-compose.prod.yml exec app node dist/... migration:run
```

**Points de vigilance :**
- Le stage `runner` ne doit contenir **que** `dist/`, `node_modules/` (prod uniquement) et `package.json`. Pas de `src/`, pas de `tsconfig*`, pas de `.env*`.
- `pnpm install --frozen-lockfile` dans le stage `builder` — garantit la reproductibilité.
- Le hostname de la BDD dans `docker-compose.prod.yml` est le nom du service (ex: `db`), pas `localhost`.
- Ajouter `healthcheck` sur le service `db` et `depends_on: db: condition: service_healthy` sur `app` pour éviter les race conditions au démarrage.

---

### Step 10 — Tests d'intégration

**Objectif :** 100% des routes couvertes en succès et en erreur, BDD réelle.

**Fichiers à créer :**
```
test/helpers/app-fixture.ts
test/helpers/db-cleaner.ts
test/auth.e2e-spec.ts
test/tournaments.e2e-spec.ts
test/players.e2e-spec.ts
test/matches.e2e-spec.ts
test/games.e2e-spec.ts
test/jest-e2e.json                   (modifier l'existant)
```

**Dépendances :** Step 9.

**Critères de validation :**
```bash
# Lancer une BDD de test
DATABASE_URL=postgresql://tournament:tournament@localhost:5433/tournament_test \
  docker-compose -f docker/docker-compose.dev.yml up -d db

pnpm test:e2e       # → tous verts, 0 failing

# Vérifier la couverture des routes
# Chaque route doit avoir au minimum :
# - 1 test de succès (2xx)
# - 1 test d'erreur métier (4xx)
# - 1 test de validation (body invalide → 400)
```

**Points de vigilance :**
- **Aucun mock de repository** — les tests d'intégration doivent toucher la vraie BDD.
- `db-cleaner.ts` doit faire `TRUNCATE ... CASCADE` dans le bon ordre (respecter les FK).
- Les tests doivent être **indépendants** — ne pas partager d'état entre `it()`.
- Créer un helper `getAuthToken(app, credentials)` réutilisable pour éviter de dupliquer la logique de login dans chaque spec.
- Lancer les migrations avant la suite de tests (`beforeAll`).

---

### Step 11 — README

**Objectif :** Documentation exhaustive permettant à n'importe qui de lancer le projet.

**Fichiers à créer/modifier :**
```
README.md
```

**Dépendances :** Step 10.

**Critères de validation :**
```bash
# Suivre le README depuis zéro sur une machine vierge :
# 1. Cloner le repo
# 2. Copier .env.example → .env.dev
# 3. docker-compose -f docker/docker-compose.dev.yml up
# 4. pnpm migration:run
# 5. curl http://localhost:3000/api/v1 → OK
# 6. pnpm test:e2e → tous verts
```

**Contenu obligatoire du README :**
- Prérequis (Node, pnpm, Docker)
- Variables d'environnement (tableau avec description de chaque clé)
- Lancement dev et prod
- Scripts disponibles (`pnpm build`, `pnpm test`, etc.)
- Tableau des routes avec méthode, auth requise, body exemple
- Exemples curl pour chaque route

---

### Bonus B1 — WebSockets

**Objectif :** Notifier les clients connectés lors de chaque changement de statut de tournoi.

**Fichiers à créer :**
```
src/infrastructure/websockets/tournament.gateway.ts
src/application/tournament/ports/notification.service.interface.ts
```

**Fichiers à modifier :**
```
src/application/tournament/use-cases/update-tournament.use-case.ts
src/presentation/tournament/tournament.module.ts
```

**Dépendances :** Step 8.

**Critères de validation :**
```bash
# Connecter un client Socket.IO
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:3000');
socket.on('tournament.status_changed', (data) => console.log(data));
"

# Dans une autre fenêtre, changer le statut d'un tournoi
curl -X PUT http://localhost:3000/api/v1/tournaments/<id> \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"in_progress"}'

# → le client reçoit { "tournamentId": "...", "status": "in_progress" }
```

**Points de vigilance :**
- Le gateway est dans `infrastructure/` — il implémente une interface port définie dans `application/` pour respecter la Dependency Rule.
- Le use-case reçoit `INotificationService` par injection, jamais `TournamentGateway` directement.

---

### Bonus B2 — Brackets

**Objectif :** Générer automatiquement les matches du round 1 (élimination directe) au démarrage d'un tournoi.

**Fichiers à créer :**
```
src/application/tournament/use-cases/start-tournament.use-case.ts
src/application/tournament/use-cases/generate-bracket.use-case.ts
```

**Fichiers à modifier :**
```
src/presentation/tournament/tournament.controller.ts  (POST /tournaments/:id/start)
src/presentation/tournament/tournament.module.ts
```

**Dépendances :** Step 5.

**Critères de validation :**
```bash
# 4 joueurs inscrits, démarrer le tournoi
curl -X POST http://localhost:3000/api/v1/tournaments/<id>/start \
  -H "Authorization: Bearer $TOKEN"
# → 200

# Vérifier les matches créés
curl http://localhost:3000/api/v1/tournaments/<id>/matches \
  -H "Authorization: Bearer $TOKEN"
# → 2 matches (round 1), statut "pending"
```

**Points de vigilance :**
- Nombre de joueurs doit être une puissance de 2 pour l'élimination directe — retourner 422 sinon (ou compléter avec des "bye").
- Le tournoi doit être en statut `pending` pour démarrer — `tournament.start()` dans l'entité domaine lève une exception sinon.

---

### Bonus B3 — Statistiques avancées

**Objectif :** Win rate, total matches, classement global par joueur.

**Fichiers à créer :**
```
src/application/player/use-cases/get-player-stats.use-case.ts
src/application/player/use-cases/get-global-rankings.use-case.ts
src/application/player/dtos/player-stats.dto.ts
```

**Fichiers à modifier :**
```
src/presentation/player/player.controller.ts         (GET /players/:id/stats, GET /players/rankings)
src/infrastructure/repositories/player/player.typeorm-repository.ts
```

**Dépendances :** Step 7.

**Critères de validation :**
```bash
curl http://localhost:3000/api/v1/players/<id>/stats \
  -H "Authorization: Bearer $TOKEN"
# → { "totalMatches": 5, "wins": 3, "losses": 2, "winRate": 0.6 }

curl http://localhost:3000/api/v1/players/rankings \
  -H "Authorization: Bearer $TOKEN"
# → tableau trié par winRate décroissant
```

---

### Bonus B4 — Swagger / OpenAPI

**Objectif :** Documentation interactive sur `/api/docs` avec exemples de requêtes/réponses.

**Fichiers à modifier :**
```
src/main.ts                          (setup Swagger)
src/application/*/dtos/*.dto.ts      (ajouter @ApiProperty)
src/presentation/*/controllers/*.ts  (ajouter @ApiTags, @ApiBearerAuth, @ApiResponse)
```

**Dépendances :** Step 2 (peut être ajouté en parallèle des steps suivants).

**Critères de validation :**
```bash
pnpm start:dev
# Ouvrir http://localhost:3000/api/docs dans le navigateur
# → UI Swagger visible avec toutes les routes documentées
# → Chaque route a au moins un exemple de réponse 2xx et un 4xx
# → Le bouton "Authorize" permet de tester les routes protégées
```

---

### Bonus B5 — Tests unitaires

**Objectif :** Un `.spec.ts` par use-case, mocks des interfaces de repository.

**Fichiers à créer (un par use-case) :**
```
src/application/auth/use-cases/register.use-case.spec.ts
src/application/auth/use-cases/login.use-case.spec.ts
src/application/tournament/use-cases/create-tournament.use-case.spec.ts
src/application/tournament/use-cases/join-tournament.use-case.spec.ts
src/application/match/use-cases/submit-match-result.use-case.spec.ts
src/application/game/use-cases/create-game.use-case.spec.ts
src/application/player/use-cases/get-player.use-case.spec.ts
# ... (un par use-case)
```

**Dépendances :** chaque step correspondant.

**Critères de validation :**
```bash
pnpm test --coverage
# → chaque use-case couvert à ≥ 80%
# → cas nominaux ET cas d'erreur testés
```

**Points de vigilance :**
- Mocker les **interfaces** (`IPlayerRepository`), pas les classes TypeORM.
- Les use-cases ne dépendent que d'interfaces — les tests ne doivent pas avoir besoin de TypeORM du tout.
- Tester spécifiquement les invariants domaine : `canJoin()` false → exception levée, match déjà `COMPLETED` → exception levée.