import request from 'supertest';
import { registerUser, RegisteredUser } from './auth.helper';
import { TestApp } from './test-app.factory';

export interface CreatedGame {
  id: string;
  name: string;
}

export async function createGame(
  testApp: TestApp,
  admin?: RegisteredUser,
  overrides: Partial<{
    name: string;
    publisher: string;
    releaseDate: string;
    genre: string;
  }> = {},
): Promise<CreatedGame> {
  const adminUser = admin ?? (await registerUser(testApp, { isAdmin: true }));
  const payload = {
    name: overrides.name ?? `Game ${Date.now()}-${Math.random()}`,
    publisher: overrides.publisher ?? 'Test Publisher',
    releaseDate: overrides.releaseDate ?? '2024-01-01',
    genre: overrides.genre ?? 'Action',
  };
  const res = await request(testApp.app.getHttpServer())
    .post('/api/v1/games')
    .set('Authorization', `Bearer ${adminUser.accessToken}`)
    .send(payload)
    .expect(201);
  return { id: res.body.data.id, name: res.body.data.name };
}

export interface CreatedTournament {
  id: string;
  ownerToken: string;
}

export async function createTournament(
  testApp: TestApp,
  options: {
    owner?: RegisteredUser;
    gameId?: string;
    maxPlayers?: number;
    name?: string;
    startDate?: string;
  } = {},
): Promise<CreatedTournament> {
  const owner = options.owner ?? (await registerUser(testApp));
  const gameId = options.gameId ?? (await createGame(testApp)).id;
  const res = await request(testApp.app.getHttpServer())
    .post('/api/v1/tournaments')
    .set('Authorization', `Bearer ${owner.accessToken}`)
    .send({
      name: options.name ?? `Tournament ${Date.now()}`,
      gameId,
      maxPlayers: options.maxPlayers ?? 4,
      startDate: options.startDate ?? '2025-12-31',
    })
    .expect(201);
  return { id: res.body.data.id, ownerToken: owner.accessToken };
}
