import request from 'supertest';
import { registerUser } from './setup/auth.helper';
import { createTournament } from './setup/fixtures';
import { createTestApp, TestApp } from './setup/test-app.factory';

describe('Players (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(async () => {
    await testApp.cleanDatabase();
  });

  describe('GET /players', () => {
    it('returns the registered players', async () => {
      await registerUser(testApp, { username: 'alice' });
      await registerUser(testApp, { username: 'bob' });
      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/players')
        .expect(200);
      expect(res.body.data).toHaveLength(2);
      const usernames = res.body.data.map(
        (p: { username: string }) => p.username,
      );
      expect(usernames).toEqual(expect.arrayContaining(['alice', 'bob']));
    });

    it('does not leak passwords', async () => {
      await registerUser(testApp);
      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/players')
        .expect(200);
      expect(res.body.data[0]).not.toHaveProperty('password');
    });
  });

  describe('GET /players/:id', () => {
    it('returns the player profile', async () => {
      const player = await registerUser(testApp, { username: 'charlie' });
      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/players/${player.playerId}`)
        .expect(200);
      expect(res.body.data.username).toBe('charlie');
    });

    it('returns 404 for an unknown id', async () => {
      await request(testApp.app.getHttpServer())
        .get('/api/v1/players/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('returns 400 for a malformed UUID', async () => {
      await request(testApp.app.getHttpServer())
        .get('/api/v1/players/not-uuid')
        .expect(400);
    });
  });

  describe('GET /players/:id/tournaments', () => {
    it('returns tournaments the player joined', async () => {
      const tournament = await createTournament(testApp);
      const player = await registerUser(testApp);

      await request(testApp.app.getHttpServer())
        .post(`/api/v1/tournaments/${tournament.id}/join`)
        .set('Authorization', `Bearer ${player.accessToken}`)
        .expect(201);

      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/players/${player.playerId}/tournaments`)
        .expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(tournament.id);
    });

    it('returns an empty list for a player with no tournaments', async () => {
      const player = await registerUser(testApp);
      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/players/${player.playerId}/tournaments`)
        .expect(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /players/:id/stats', () => {
    it('returns zero stats for a player without matches', async () => {
      const player = await registerUser(testApp);
      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/players/${player.playerId}/stats`)
        .expect(200);
      expect(res.body.data).toMatchObject({
        playerId: player.playerId,
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
      });
    });
  });

  describe('GET /players/rankings', () => {
    it('returns global rankings (empty when no matches)', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/players/rankings')
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
