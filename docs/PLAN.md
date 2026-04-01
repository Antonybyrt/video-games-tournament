# NestJS Tournament Management API — Plan de réalisation complet

## Table des matières

1. [Grading Map](#1-grading-map)
2. [Pre-flight : tsconfig & ESLint](#2-pre-flight--tsconfig--eslint)
3. [Architecture des dossiers](#3-architecture-des-dossiers)
4. [Installation des dépendances](#4-installation-des-dépendances)
5. [Modèle de données TypeORM](#5-modèle-de-données-typeorm)
6. [Étapes de développement](#6-étapes-de-développement)
7. [Stratégie Docker](#7-stratégie-docker)
8. [Stratégie de tests](#8-stratégie-de-tests)
9. [Roadmap des bonus](#9-roadmap-des-bonus)
10. [Pièges courants](#10-pièges-courants)

---

## 1. Grading Map

| Exigence | Points | Étape |
|---|---|---|
| TypeScript strict mode | obligatoire | Step 0 |
| NestJS modules / controllers / services | obligatoire | Steps 2–7 |
| PostgreSQL + TypeORM | obligatoire | Step 1 |
| class-validator + DTOs | obligatoire | Steps 2–7 |
| JWT + Passport Guards | obligatoire | Step 3 |
| Interceptors (enveloppe réponse unifiée) | obligatoire | Step 2 |
| Pipes (validation / transformation) | obligatoire | Step 2 |
| Docker dev + prod | obligatoire | Step 9 |
| Tests d'intégration toutes routes | obligatoire | Step 10 |
| README exhaustif | obligatoire | Step 11 |
| Zéro erreur ESLint | obligatoire | continu |
| WebSockets +1pt | bonus | Step B1 |
| Système de brackets +1.5pt | bonus | Step B2 |
| Statistiques avancées +1pt | bonus | Step B3 |
| Swagger/OpenAPI +1pt | bonus | Step B4 |
| Tests unitaires +0.5pt/module | bonus | Step B5 |

---

## 2. Pre-flight : tsconfig & ESLint

### `tsconfig.json` — remplacer `compilerOptions` par :

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": {
      "@domain/*":         ["src/domain/*"],
      "@application/*":   ["src/application/*"],
      "@infrastructure/*":["src/infrastructure/*"],
      "@presentation/*":  ["src/presentation/*"]
    },
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

> **Pitfall :** Les path aliases Jest nécessitent `moduleNameMapper` dans `package.json` + `tsconfig-paths/register` dans `ts-node`. Sans ça, le build passe mais les tests échouent.

### `eslint.config.mjs` — règles à ajouter/durcir :

```js
rules: {
  '@typescript-eslint/no-explicit-any':      'error',   // était 'off'
  '@typescript-eslint/no-floating-promises': 'error',   // était 'warn'
  '@typescript-eslint/no-unsafe-argument':   'error',
  'no-restricted-imports': ['error', {
    patterns: [
      { group: ['**/infrastructure/**'], message: 'Domain/Application ne doit pas importer depuis Infrastructure.' },
      { group: ['**/presentation/**'],   message: 'Seule la Presentation importe depuis Presentation.' }
    ]
  }],
  'prettier/prettier': ['error', { endOfLine: 'auto' }]
}
```

### `package.json` — ajouter dans `jest` :

```json
"moduleNameMapper": {
  "@domain/(.*)":         "<rootDir>/domain/$1",
  "@application/(.*)":   "<rootDir>/application/$1",
  "@infrastructure/(.*)":"<rootDir>/infrastructure/$1",
  "@presentation/(.*)":  "<rootDir>/presentation/$1"
}
```

### `package.json` — ajouter dans `scripts` :

```json
"migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/infrastructure/database/typeorm.config.ts",
"migration:run":      "typeorm-ts-node-commonjs migration:run      -d src/infrastructure/database/typeorm.config.ts",
"migration:revert":   "typeorm-ts-node-commonjs migration:revert   -d src/infrastructure/database/typeorm.config.ts"
```

---

## 3. Architecture des dossiers

```
tournament/
├── src/
│   │
│   ├── domain/                              # Couche 1 — Zéro dépendance framework
│   │   ├── tournament/
│   │   │   ├── tournament.entity.ts
│   │   │   ├── tournament-status.enum.ts
│   │   │   ├── tournament.repository.interface.ts
│   │   │   └── value-objects/
│   │   │       └── tournament-name.vo.ts
│   │   ├── player/
│   │   │   ├── player.entity.ts
│   │   │   ├── player.repository.interface.ts
│   │   │   └── value-objects/
│   │   │       └── email.vo.ts
│   │   ├── match/
│   │   │   ├── match.entity.ts
│   │   │   ├── match-status.enum.ts
│   │   │   └── match.repository.interface.ts
│   │   ├── game/
│   │   │   ├── game.entity.ts
│   │   │   └── game.repository.interface.ts
│   │   └── shared/
│   │       ├── entity.base.ts
│   │       ├── repository.interface.ts
│   │       └── exceptions/
│   │           ├── domain.exception.ts
│   │           ├── not-found.exception.ts
│   │           ├── conflict.exception.ts
│   │           ├── business-rule.exception.ts
│   │           └── forbidden.exception.ts
│   │
│   ├── application/                         # Couche 2 — Use cases, DTOs, ports
│   │   ├── auth/
│   │   │   ├── use-cases/
│   │   │   │   ├── register.use-case.ts
│   │   │   │   └── login.use-case.ts
│   │   │   ├── dtos/
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── login.dto.ts
│   │   │   └── ports/
│   │   │       └── token.service.interface.ts
│   │   ├── tournament/
│   │   │   ├── use-cases/
│   │   │   │   ├── create-tournament.use-case.ts
│   │   │   │   ├── get-tournament.use-case.ts
│   │   │   │   ├── list-tournaments.use-case.ts
│   │   │   │   ├── update-tournament.use-case.ts
│   │   │   │   ├── delete-tournament.use-case.ts
│   │   │   │   └── join-tournament.use-case.ts
│   │   │   └── dtos/
│   │   │       ├── create-tournament.dto.ts
│   │   │       └── update-tournament.dto.ts
│   │   ├── player/
│   │   │   ├── use-cases/
│   │   │   │   ├── list-players.use-case.ts
│   │   │   │   ├── get-player.use-case.ts
│   │   │   │   └── get-player-tournaments.use-case.ts
│   │   │   └── dtos/
│   │   │       └── player-response.dto.ts
│   │   ├── match/
│   │   │   ├── use-cases/
│   │   │   │   ├── list-tournament-matches.use-case.ts
│   │   │   │   └── submit-match-result.use-case.ts
│   │   │   └── dtos/
│   │   │       └── match-result.dto.ts
│   │   └── game/
│   │       ├── use-cases/
│   │       │   ├── list-games.use-case.ts
│   │       │   └── create-game.use-case.ts
│   │       └── dtos/
│   │           └── create-game.dto.ts
│   │
│   ├── infrastructure/                      # Couche 3 — Framework, BDD, externe
│   │   ├── database/
│   │   │   ├── typeorm.config.ts
│   │   │   ├── database.module.ts
│   │   │   └── migrations/
│   │   ├── repositories/
│   │   │   ├── tournament/
│   │   │   │   ├── tournament.typeorm-entity.ts
│   │   │   │   └── tournament.typeorm-repository.ts
│   │   │   ├── player/
│   │   │   │   ├── player.typeorm-entity.ts
│   │   │   │   └── player.typeorm-repository.ts
│   │   │   ├── match/
│   │   │   │   ├── match.typeorm-entity.ts
│   │   │   │   └── match.typeorm-repository.ts
│   │   │   └── game/
│   │   │       ├── game.typeorm-entity.ts
│   │   │       └── game.typeorm-repository.ts
│   │   ├── auth/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── jwt-token.service.ts
│   │   │   └── auth.module.ts
│   │   ├── http/
│   │   │   ├── interceptors/
│   │   │   │   ├── response-envelope.interceptor.ts
│   │   │   │   └── http-exception.filter.ts
│   │   │   └── pipes/
│   │   │       └── validation.pipe.ts
│   │   └── config/
│   │       ├── app.config.ts
│   │       └── env.validation.ts
│   │
│   ├── presentation/                        # Couche 4 — Controllers + mappers
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.module.ts
│   │   ├── tournament/
│   │   │   ├── tournament.controller.ts
│   │   │   ├── mappers/tournament.mapper.ts
│   │   │   └── tournament.module.ts
│   │   ├── player/
│   │   │   ├── player.controller.ts
│   │   │   ├── mappers/player.mapper.ts
│   │   │   └── player.module.ts
│   │   ├── match/
│   │   │   ├── match.controller.ts
│   │   │   ├── mappers/match.mapper.ts
│   │   │   └── match.module.ts
│   │   └── game/
│   │       ├── game.controller.ts
│   │       ├── mappers/game.mapper.ts
│   │       └── game.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
│   ├── helpers/
│   │   ├── app-fixture.ts
│   │   └── db-cleaner.ts
│   ├── auth.e2e-spec.ts
│   ├── tournaments.e2e-spec.ts
│   ├── players.e2e-spec.ts
│   ├── matches.e2e-spec.ts
│   ├── games.e2e-spec.ts
│   └── jest-e2e.json
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   └── .env.example
│
├── docs/
│   └── PLAN.md
├── .env.dev
├── .env.prod
└── README.md
```

### Règle de dépendance (Dependency Rule)

```
Domain          ← aucune dépendance externe (@nestjs/* interdit)
Application     → Domain uniquement (@nestjs/* interdit)
Infrastructure  → Application + Domain
Presentation    → Application + Infrastructure (tokens DI uniquement)
```

Vérification à tout moment :
```bash
grep -r "@nestjs" src/domain/        # doit retourner rien
grep -r "@nestjs" src/application/   # doit retourner rien
```

---

## 4. Installation des dépendances

```bash
# Base de données
pnpm add @nestjs/typeorm typeorm pg
pnpm add @nestjs/config joi

# Auth
pnpm add @nestjs/passport passport passport-jwt @nestjs/jwt
pnpm add -D @types/passport-jwt

# Validation
pnpm add class-validator class-transformer

# Hashing
pnpm add bcrypt
pnpm add -D @types/bcrypt

# Bonus — WebSockets
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io

# Bonus — Swagger
pnpm add @nestjs/swagger swagger-ui-express

# Path aliases pour TypeScript
pnpm add -D tsconfig-paths
```

---

## 5. Modèle de données TypeORM

### Schéma des tables

```
players
  id           UUID        PK
  username     VARCHAR(50) UNIQUE NOT NULL
  email        VARCHAR     UNIQUE NOT NULL
  password     VARCHAR     NOT NULL         (hash bcrypt)
  avatar       VARCHAR     NULLABLE
  isAdmin      BOOLEAN     DEFAULT false
  createdAt    TIMESTAMPTZ DEFAULT now()

games
  id           UUID        PK
  name         VARCHAR     UNIQUE NOT NULL
  publisher    VARCHAR     NOT NULL
  releaseDate  DATE        NOT NULL
  genre        VARCHAR(50) NOT NULL

tournaments
  id           UUID        PK
  name         VARCHAR(100) NOT NULL
  status       ENUM(pending, in_progress, completed) DEFAULT pending
  maxPlayers   INT         NOT NULL
  startDate    TIMESTAMPTZ NOT NULL
  createdAt    TIMESTAMPTZ DEFAULT now()
  game_id      UUID        FK → games NOT NULL

tournament_players  [table de jointure]
  player_id     UUID  FK → players
  tournament_id UUID  FK → tournaments
  PRIMARY KEY (player_id, tournament_id)

matches
  id            UUID  PK
  status        ENUM(pending, in_progress, completed) DEFAULT pending
  round         INT   NOT NULL
  score         VARCHAR NULLABLE          (format "X:Y")
  tournament_id UUID  FK → tournaments CASCADE
  player1_id    UUID  FK → players
  player2_id    UUID  FK → players
  winner_id     UUID  FK → players NULLABLE
```

### Index

```sql
CREATE INDEX idx_tournaments_status    ON tournaments(status);
CREATE INDEX idx_tournaments_startdate ON tournaments(start_date);
CREATE INDEX idx_matches_tournament    ON matches(tournament_id);
CREATE INDEX idx_matches_round         ON matches(round);
CREATE UNIQUE INDEX idx_players_email    ON players(email);
CREATE UNIQUE INDEX idx_players_username ON players(username);
```

### Entités TypeORM (infrastructure layer)

```typescript
// player.typeorm-entity.ts
@Entity('players')
export class PlayerTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 50, unique: true }) username: string;
  @Column({ unique: true }) email: string;
  @Column() password: string;
  @Column({ nullable: true }) avatar: string | null;
  @Column({ default: false }) isAdmin: boolean;
  @CreateDateColumn() createdAt: Date;

  @ManyToMany(() => TournamentTypeormEntity, t => t.players)
  @JoinTable({
    name: 'tournament_players',
    joinColumn:        { name: 'player_id',     referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tournament_id', referencedColumnName: 'id' },
  })
  tournaments: TournamentTypeormEntity[];
}

// tournament.typeorm-entity.ts
@Entity('tournaments')
export class TournamentTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 100 }) name: string;
  @Column({ type: 'enum', enum: TournamentStatus, default: TournamentStatus.PENDING }) status: TournamentStatus;
  @Column() maxPlayers: number;
  @Column({ type: 'timestamptz' }) startDate: Date;
  @CreateDateColumn() createdAt: Date;
  @ManyToOne(() => GameTypeormEntity, { eager: false, nullable: false })
  @JoinColumn({ name: 'game_id' }) game: GameTypeormEntity;
  @Column({ name: 'game_id' }) gameId: string;
  @ManyToMany(() => PlayerTypeormEntity, p => p.tournaments) players: PlayerTypeormEntity[];
  @OneToMany(() => MatchTypeormEntity, m => m.tournament) matches: MatchTypeormEntity[];
}

// match.typeorm-entity.ts
@Entity('matches')
export class MatchTypeormEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'enum', enum: MatchStatus, default: MatchStatus.PENDING }) status: MatchStatus;
  @Column() round: number;
  @Column({ nullable: true }) score: string | null;
  @Column({ name: 'tournament_id' }) tournamentId: string;
  @ManyToOne(() => TournamentTypeormEntity, t => t.matches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournament_id' }) tournament: TournamentTypeormEntity;
  @Column({ name: 'player1_id' }) player1Id: string;
  @ManyToOne(() => PlayerTypeormEntity) @JoinColumn({ name: 'player1_id' }) player1: PlayerTypeormEntity;
  @Column({ name: 'player2_id' }) player2Id: string;
  @ManyToOne(() => PlayerTypeormEntity) @JoinColumn({ name: 'player2_id' }) player2: PlayerTypeormEntity;
  @Column({ name: 'winner_id', nullable: true }) winnerId: string | null;
  @ManyToOne(() => PlayerTypeormEntity, { nullable: true }) @JoinColumn({ name: 'winner_id' }) winner: PlayerTypeormEntity | null;
}
```

### Entités domaine (domain layer — sans décorateurs)

```typescript
// tournament.entity.ts
export class Tournament {
  constructor(
    public readonly id: string,
    public name: string,
    public gameId: string,
    public maxPlayers: number,
    public startDate: Date,
    public status: TournamentStatus,
    public readonly createdAt: Date,
  ) {}

  canJoin(currentPlayerCount: number): boolean {
    return this.status === TournamentStatus.PENDING
      && currentPlayerCount < this.maxPlayers;
  }

  start(): void {
    if (this.status !== TournamentStatus.PENDING)
      throw new BusinessRuleDomainException('Tournament can only start from PENDING state');
    this.status = TournamentStatus.IN_PROGRESS;
  }
}
```

---

## 6. Étapes de développement

---

### Step 0 — Bootstrap & Config Hardening

**Objectif :** Strict TypeScript, ESLint, path aliases, migrations prêtes.

**Fichiers à créer/modifier :**
- `tsconfig.json` — strict mode + paths aliases
- `eslint.config.mjs` — règles durcies
- `package.json` — moduleNameMapper Jest + scripts migration
- `.env.dev`, `.env.prod` — `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`
- `.gitignore` — inclure `.env.dev`, `.env.prod`

**Critères de validation :**
```bash
pnpm build   # zéro erreur
pnpm lint    # zéro erreur
pnpm test    # spec AppController passe
```

**Pitfall :** `tsconfig-paths` doit être enregistré dans ts-node ET dans Jest sinon les alias `@domain/*` cassent les tests.

---

### Step 1 — Database Module + TypeORM

**Objectif :** Connexion PostgreSQL, 4 entités TypeORM, première migration.

**Fichiers à créer :**
- `src/infrastructure/database/typeorm.config.ts` — `DataSource` pour CLI migrations
- `src/infrastructure/database/database.module.ts` — `TypeOrmModule.forRootAsync`
- `src/infrastructure/config/env.validation.ts` — validation Joi au démarrage
- `src/infrastructure/repositories/{player,tournament,match,game}/*.typeorm-entity.ts`
- `docker/docker-compose.dev.yml` — service `db` uniquement pour cette étape

**Fichiers à modifier :**
- `src/app.module.ts` — import `DatabaseModule`, `ConfigModule`

**Contenu clé `typeorm.config.ts` :**
```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../repositories/**/*.typeorm-entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,   // JAMAIS true
});
```

**Critères de validation :**
```bash
docker-compose -f docker/docker-compose.dev.yml up -d db
pnpm migration:generate -- -n InitialSchema
pnpm migration:run
# Vérifier : 5 tables présentes en BDD (players, games, tournaments, tournament_players, matches)
```

**Pitfall :** `synchronize: true` peut DROP silencieusement des colonnes. Toujours `false` + migrations.

---

### Step 2 — Infrastructure partagée (Interceptors, Pipes, Filters)

**Objectif :** Enveloppe de réponse unifiée avant d'écrire toute logique métier.

**Fichiers à créer :**
- `src/infrastructure/http/interceptors/response-envelope.interceptor.ts`
- `src/infrastructure/http/interceptors/http-exception.filter.ts`
- `src/infrastructure/http/pipes/validation.pipe.ts`

**Fichiers à modifier :**
- `src/main.ts` — globals + prefix `api/v1`

**Format réponse succès :**
```json
{ "success": true, "data": { ... }, "timestamp": "2026-04-01T00:00:00.000Z" }
```

**Format réponse erreur :**
```json
{ "success": false, "error": { "code": 404, "message": "Not found" }, "timestamp": "..." }
```

**`main.ts` final :**
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
}));
app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
app.useGlobalFilters(new AllExceptionsFilter());
app.setGlobalPrefix('api/v1');
```

**Pitfall :** Les globals `useGlobal*` dans `main.ts` n'ont pas accès au DI. Garder interceptors/filters stateless. Si un service est nécessaire, utiliser `APP_INTERCEPTOR` / `APP_FILTER` dans `AppModule.providers`.

**Critères de validation :**
```bash
curl http://localhost:3000/api/v1           # { success: true, data: "Hello World!", timestamp: "..." }
curl http://localhost:3000/api/v1/inexistant # { success: false, error: { code: 404, ... } }
```

---

### Step 3 — Auth Module

**Objectif :** Register/Login avec JWT, guards sur routes protégées.

**Fichiers à créer :**
- `src/domain/player/player.entity.ts`
- `src/domain/player/player.repository.interface.ts`
- `src/domain/player/value-objects/email.vo.ts`
- `src/domain/shared/exceptions/{domain,not-found,conflict,business-rule,forbidden}.exception.ts`
- `src/application/auth/dtos/{register,login}.dto.ts`
- `src/application/auth/use-cases/{register,login}.use-case.ts`
- `src/application/auth/ports/token.service.interface.ts`
- `src/infrastructure/auth/{jwt.strategy,jwt-auth.guard,roles.guard,roles.decorator,jwt-token.service,auth.module}.ts`
- `src/infrastructure/repositories/player/{player.typeorm-entity,player.typeorm-repository}.ts`
- `src/presentation/auth/{auth.controller,auth.module}.ts`

**DTO Register :**
```typescript
export class RegisterDto {
  @IsString() @MinLength(3) @MaxLength(50) username: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;
  @IsOptional() @IsUrl() avatar?: string;
}
```

**Hiérarchie d'exceptions domaine :**
```typescript
// domain.exception.ts
export abstract class DomainException extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
// ConflictDomainException, NotFoundDomainException, etc. étendent DomainException
```

**Pitfall CRITIQUE :** Les use-cases ne doivent **jamais** importer `ConflictException` de `@nestjs/common`. Utiliser les exceptions domaine et les mapper dans `AllExceptionsFilter` ou dans le controller.

**JWT Strategy :**
```typescript
validate(payload: { sub: string; email: string; isAdmin: boolean }) {
  return { id: payload.sub, email: payload.email, isAdmin: payload.isAdmin };
}
```

**Critères de validation :**
```bash
curl -X POST .../api/v1/auth/register -d '{"username":"alice","email":"alice@test.com","password":"Secret1!"}'
# → { success: true, data: { accessToken: "..." } }
curl .../api/v1/tournaments   # → 401 sans token
```

---

### Step 4 — Game Module

**Objectif :** `GET /games` (public), `POST /games` (admin). Établit le pattern DI Clean Architecture.

**Fichiers à créer :**
- `src/domain/game/{game.entity,game.repository.interface}.ts`
- `src/application/game/dtos/create-game.dto.ts`
- `src/application/game/use-cases/{list-games,create-game}.use-case.ts`
- `src/infrastructure/repositories/game/{game.typeorm-entity,game.typeorm-repository}.ts`
- `src/presentation/game/{game.controller,game.module}.ts`
- `src/presentation/game/mappers/game.mapper.ts`

**Pattern DI (réutiliser dans tous les modules) :**
```typescript
// game.module.ts
providers: [
  { provide: GAME_REPOSITORY, useClass: GameTypeormRepository },
  {
    provide: ListGamesUseCase,
    useFactory: (repo: IGameRepository) => new ListGamesUseCase(repo),
    inject: [GAME_REPOSITORY],
  },
  {
    provide: CreateGameUseCase,
    useFactory: (repo: IGameRepository) => new CreateGameUseCase(repo),
    inject: [GAME_REPOSITORY],
  },
]
```

**Critères de validation :**
```bash
curl .../api/v1/games                                     # 200 public
curl -X POST .../api/v1/games -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"SF6","publisher":"Capcom","releaseDate":"2023-06-02","genre":"Fighting"}'
curl -X POST .../api/v1/games -H "Authorization: Bearer $USER_TOKEN" # → 403
```

---

### Step 5 — Tournament Module

**Objectif :** CRUD complet + `POST /tournaments/:id/join`. Module le plus dense en logique métier.

**Fichiers à créer :**
- `src/domain/tournament/{tournament.entity,tournament-status.enum,tournament.repository.interface}.ts`
- `src/domain/tournament/value-objects/tournament-name.vo.ts`
- `src/application/tournament/dtos/{create,update}-tournament.dto.ts`
- `src/application/tournament/use-cases/{create,get,list,update,delete,join}-tournament.use-case.ts`
- `src/infrastructure/repositories/tournament/{tournament.typeorm-entity,tournament.typeorm-repository}.ts`
- `src/presentation/tournament/{tournament.controller,tournament.module}.ts`
- `src/presentation/tournament/mappers/tournament.mapper.ts`

**`ITournamentRepository` — méthodes requises :**
```typescript
findById(id: string): Promise<Tournament | null>;
findAll(status?: TournamentStatus): Promise<Tournament[]>;
save(t: Tournament): Promise<Tournament>;
update(id: string, partial: Partial<Tournament>): Promise<Tournament>;
delete(id: string): Promise<void>;
addPlayer(tournamentId: string, playerId: string): Promise<void>;
countPlayers(tournamentId: string): Promise<number>;
isPlayerEnrolled(tournamentId: string, playerId: string): Promise<boolean>;
```

**Routes controller :**
```typescript
@Get()           listAll()                                         // public
@Post()          @UseGuards(JwtAuthGuard) create(...)
@Get(':id')      findOne(@Param('id', ParseUUIDPipe) id)           // ParseUUIDPipe obligatoire
@Put(':id')      @UseGuards(JwtAuthGuard) update(...)
@Delete(':id')   @UseGuards(JwtAuthGuard) remove(...)
@Post(':id/join')@UseGuards(JwtAuthGuard) join(...)
```

**Critères de validation :**
```bash
# Double join → 409
# Tournoi plein → 422
# `:id` non-UUID → 400 (ParseUUIDPipe)
```

---

### Step 6 — Player Module

**Objectif :** `GET /players`, `GET /players/:id`, `GET /players/:id/tournaments`. Read-only.

**Pitfall CRITIQUE :** Ne jamais exposer `password` dans les réponses. Utiliser un mapper explicite, pas `@Exclude()` seul.

```typescript
// player.mapper.ts
static toResponseDto(player: Player): PlayerResponseDto {
  return { id: player.id, username: player.username, email: player.email,
           avatar: player.avatar ?? null, createdAt: player.createdAt };
  // password absent délibérément
}
```

**Critères de validation :**
```bash
curl .../api/v1/players/1  # → password ABSENT de la réponse
```

---

### Step 7 — Match Module

**Objectif :** `GET /tournaments/:id/matches`, `POST /matches/:id/result`.

**`match-result.dto.ts` :**
```typescript
export class MatchResultDto {
  @IsUUID() winnerId: string;
  @IsString() @Matches(/^\d+:\d+$/, { message: 'Format: "X:Y"' }) score: string;
}
```

**Règles métier dans le use-case :**
- Match déjà `COMPLETED` → 422
- `winnerId` différent de `player1Id` et `player2Id` → 422
- Match non trouvé → 404

**Note routing :** `GET /tournaments/:id/matches` dans `TournamentController` (délégué à `ListTournamentMatchesUseCase`) évite les imports circulaires entre modules.

---

### Step 8 — Exceptions & Hardening

**Objectif :** Centraliser les exceptions domaine, audit complet Clean Architecture, zéro lint.

**Mapping dans `AllExceptionsFilter` :**
```typescript
if (exception instanceof NotFoundDomainException)       { status = 404; }
if (exception instanceof ConflictDomainException)       { status = 409; }
if (exception instanceof ForbiddenDomainException)      { status = 403; }
if (exception instanceof BusinessRuleDomainException)   { status = 422; }
```

**Critères de validation :**
```bash
grep -r "@nestjs" src/domain/        # rien
grep -r "@nestjs" src/application/   # rien
pnpm lint                            # zéro erreur
pnpm build                           # zéro erreur
```

---

### Step 9 — Docker

**Objectif :** Deux environnements Docker distincts et fonctionnels.

**`Dockerfile` multi-stage :**
```dockerfile
# Stage 1 — builder
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2 — runner (production)
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
EXPOSE 3000
CMD ["node", "dist/main"]
```

**`docker-compose.dev.yml` :**
- Service `app` : volume source monté, `pnpm start:dev` (hot-reload)
- Service `db` : PostgreSQL 16, volume persistant

**`docker-compose.prod.yml` :**
- Service `app` : image multi-stage finale, `restart: always`
- Service `db` : health check, `restart: always`
- Variables d'env via `.env.prod` (jamais committé)

**Variables d'environnement :**
```
DATABASE_URL=postgresql://user:pass@db:5432/tournament
JWT_SECRET=<min 32 chars>
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development|production
```

---

### Step 10 — Tests d'intégration

**Objectif :** 100% des routes couvertes (succès + erreurs métier).

**`app-fixture.ts` :**
```typescript
// TestingModule partagé, DB de test réelle (pas de mocks)
export async function createTestApp() {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = module.createNestApplication();
  // appliquer les mêmes globals que main.ts
  await app.init();
  return app;
}
```

**`db-cleaner.ts` :**
```typescript
// Appelé dans beforeEach/afterEach
await dataSource.query('TRUNCATE players, games, tournaments, matches CASCADE');
```

**Couverture route par route :**

| Route | Tests |
|---|---|
| POST /auth/register | succès, email dupliqué → 409, validation → 400 |
| POST /auth/login | succès, mauvais mot de passe → 401 |
| GET /tournaments | liste vide, liste avec données |
| POST /tournaments | succès, non authentifié → 401 |
| GET /tournaments/:id | trouvé, non trouvé → 404, UUID invalide → 400 |
| POST /tournaments/:id/join | succès, double join → 409, tournoi plein → 422 |
| GET /players | liste |
| GET /players/:id | trouvé, non trouvé → 404 |
| GET /players/:id/tournaments | liste |
| GET /tournaments/:id/matches | liste |
| POST /matches/:id/result | succès, winnerId invalide → 422 |
| GET /games | liste |
| POST /games | admin OK, user → 403, non auth → 401 |

---

### Step 11 — README

**Contenu obligatoire :**
- Prérequis (Docker, Node, pnpm)
- Installation (`pnpm install`)
- Variables d'environnement (tableau)
- Lancement dev (`docker-compose -f docker/docker-compose.dev.yml up`)
- Migrations (`pnpm migration:run`)
- Lancement prod
- Liste des routes avec méthode, auth requise, exemple curl
- Lancement des tests

---

## 7. Stratégie Docker

### Structure

```
docker/
├── Dockerfile                 # Multi-stage (builder + runner)
├── docker-compose.dev.yml     # app (hot-reload) + db
├── docker-compose.prod.yml    # app (image prod) + db + health checks
└── .env.example               # Template à copier
```

### Commandes

```bash
# Dev
docker-compose -f docker/docker-compose.dev.yml up

# Prod
docker-compose -f docker/docker-compose.prod.yml up -d

# Migrations (en dev)
docker-compose -f docker/docker-compose.dev.yml exec app pnpm migration:run
```

---

## 8. Stratégie de tests

### Tests d'intégration (obligatoires)
- DB réelle — **aucun mock de repository**
- `TRUNCATE ... CASCADE` entre chaque test
- Assertions sur l'enveloppe : `{ success, data|error, timestamp }`
- Tester les status HTTP ET le contenu de `data`

### Tests unitaires (bonus +0.5pt/module)
- Un `.spec.ts` par use-case
- Mock des **interfaces** de repository (pas des classes TypeORM)
- Tester les invariants domaine : `canJoin()`, `start()`, double-join, score invalide

```typescript
// Exemple : join-tournament.use-case.spec.ts
const mockRepo: jest.Mocked<ITournamentRepository> = {
  findById: jest.fn(),
  countPlayers: jest.fn(),
  isPlayerEnrolled: jest.fn(),
  addPlayer: jest.fn(),
  // ...
};
```

---

## 9. Roadmap des bonus

| Bonus | Après step | Implémentation |
|---|---|---|
| **B4 Swagger (+1pt)** | Step 2 | `@nestjs/swagger`, décorer DTOs + controllers au fil des steps. Enregistrer dans `main.ts` |
| **B5 Tests unitaires (+0.5pt/module)** | Chaque step | Créer `.spec.ts` immédiatement après chaque use-case |
| **B1 WebSockets (+1pt)** | Step 8 | Gateway dans `infrastructure/websockets/tournament.gateway.ts`. Émettre `tournament.status_changed` lors des transitions de statut dans `update-tournament.use-case.ts` |
| **B2 Brackets (+1.5pt)** | Step 8 | `generate-bracket.use-case.ts` dans `application/tournament/`. Algorithme élimination directe : `Math.ceil(log2(playerCount))` rounds, génération des matches round 1 au démarrage du tournoi |
| **B3 Stats avancées (+1pt)** | Step 7+ | Use-cases `get-player-stats`, `global-rankings` dans `application/player/`. Queries TypeORM avec `GROUP BY`, `COUNT`, win rate = wins/total_matches |

### Détail Bracket (B2)

```typescript
// generate-bracket.use-case.ts
generateBracket(players: Player[]): Match[] {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const matches: Match[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push(createMatch(shuffled[i], shuffled[i + 1], round: 1));
  }
  return matches;
}
```

### Détail WebSocket (B1)

```typescript
// tournament.gateway.ts (infrastructure)
@WebSocketGateway({ cors: true })
export class TournamentGateway {
  @WebSocketServer() server: Server;

  notifyStatusChange(tournamentId: string, status: TournamentStatus) {
    this.server.emit('tournament.status_changed', { tournamentId, status });
  }
}
```

Appeler `gateway.notifyStatusChange()` depuis `update-tournament.use-case.ts` via une interface port (pour respecter la Dependency Rule).

---

## 10. Pièges courants

| Piège | Conséquence | Solution |
|---|---|---|
| `@nestjs/*` dans domain/application | Viole Clean Architecture | `no-restricted-imports` ESLint |
| `synchronize: true` | DROP silencieux de colonnes | Toujours `false` + migrations CLI |
| `useGlobalPipes` hors DI | Impossible d'injecter des services | Garder stateless OU `APP_PIPE` dans AppModule |
| `ParseUUIDPipe` oublié | Erreur DB cryptique au lieu de 400 | Sur **tous** les `:id` UUID |
| `password` en réponse | Faille de sécurité évidente | Mapper explicite dans presentation layer |
| Import circulaire entre modules | Crash au démarrage | `GET /tournaments/:id/matches` dans TournamentController, délégué à MatchUseCase |
| Path aliases non configurés dans Jest | Tests cassés même si build OK | `moduleNameMapper` + `tsconfig-paths/register` |
| ConflictException dans use-case | `@nestjs/common` dans application layer | Exceptions domaine + mapping dans filter |
