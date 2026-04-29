# Docker — Environnements dev, build et prod

## Dev

### Prérequis

Créer un fichier `.env.dev` à la racine du projet à partir de `.env.template` :

```bash
cp .env.template .env.dev
# Remplir les valeurs (POSTGRES_PASSWORD, JWT_SECRET, etc.)
```

### Lancer le container

Depuis la racine du projet :

```bash
docker compose -f docker/docker-compose.dev.yml --env-file .env.dev up -d
```

### Démarrer l'API

Se connecter au container, installer pnpm et lancer le serveur :

```bash
docker exec -it tournament_app_dev sh
npm install -g pnpm
pnpm install
pnpm start:dev
```

L'API est accessible sur http://localhost:3000/api/v1

---

## Build — publier l'image sur GHCR

### 1. Se connecter à GitHub Container Registry

```bash
docker login ghcr.io -u <username> -p <token>
```

Le token doit avoir le scope `write:packages` (GitHub → Settings → Developer settings → Personal access tokens).

### 2. Ajuster le nom d'utilisateur

Dans `docker/docker-compose.build.yml` et `docker/docker-compose.prod.yml`, remplacer le champ `image` :

```yaml
image: ghcr.io/<username>/video-games-tournament/api:0.0.1
```

### 3. Builder et pusher

```bash
docker compose -f docker/docker-compose.build.yml build
docker compose -f docker/docker-compose.build.yml push
```

---

## Prod

### 1. Ajuster le nom d'utilisateur

Vérifier que le champ `image` dans `docker/docker-compose.prod.yml` correspond à l'image publiée lors du build.

### 2. Créer `.env.prod`

Créer le fichier `.env.prod` **à la racine du projet** :

```env
POSTGRES_DB=tournament
POSTGRES_USER=<user>
POSTGRES_PASSWORD=<mot_de_passe_fort>
DATABASE_URL=postgresql://<user>:<password>@tournament_db_prod:5432/tournament
JWT_SECRET=<secret_min_32_chars>
JWT_EXPIRES_IN=1h
NODE_ENV=production
PORT=3000
```

> ⚠️ Le hostname dans `DATABASE_URL` doit être `tournament_db_prod` (nom du container Docker), pas `localhost`.

### 3. Lancer

Depuis la racine du projet :

```bash
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod up -d
```

Au démarrage, le service `migrate` applique automatiquement les migrations avant
que `app` ne démarre. Les logs sont consultables avec :

```bash
docker logs tournament_migrate_prod
docker logs tournament_app_prod
```
