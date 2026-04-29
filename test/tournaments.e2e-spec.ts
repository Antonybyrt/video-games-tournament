import request from 'supertest';
import { registerUser } from './setup/auth.helper';
import { createGame, createTournament } from './setup/fixtures';
import { createTestApp, TestApp } from './setup/test-app.factory';

describe('Tournaments (e2e)', () => {
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

  describe('POST /tournaments', () => {
    it('rejects unauthenticated requests (401)', async () => {
      const game = await createGame(testApp);
      await request(testApp.app.getHttpServer())
        .post('/api/v1/tournaments')
        .send({
          name: 'My Tournament',
          gameId: game.id,
          maxPlayers: 4,
          startDate: '2025-12-31',
        })
        .expect(401);
    });

    it('creates a tournament when authenticated (201)', async () => {
      const user = await registerUser(testApp);
      const game = await createGame(testApp);
      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/tournaments')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          name: 'My Tournament',
          gameId: game.id,
          maxPlayers: 8,
          startDate: '2025-12-31',
        })
        .expect(201);

      expect(res.body.data).toMatchObject({
        name: 'My Tournament',
        maxPlayers: 8,
        status: 'pending',
      });
    });

    it('rejects an invalid payload (400)', async () => {
      const user = await registerUser(testApp);
      await request(testApp.app.getHttpServer())
        .post('/api/v1/tournaments')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          name: 'X',
          gameId: 'not-a-uuid',
          maxPlayers: 1,
          startDate: 'invalid',
        })
        .expect(400);
    });
  });

  describe('GET /tournaments', () => {
    it('lists all tournaments', async () => {
      await createTournament(testApp);
      await createTournament(testApp);
      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/tournaments')
        .expect(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('filters by status', async () => {
      await createTournament(testApp);
      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/tournaments?status=pending')
        .expect(200);
      expect(res.body.data).toHaveLength(1);

      const empty = await request(testApp.app.getHttpServer())
        .get('/api/v1/tournaments?status=completed')
        .expect(200);
      expect(empty.body.data).toHaveLength(0);
    });

    it('rejects an invalid status value (400)', async () => {
      await request(testApp.app.getHttpServer())
        .get('/api/v1/tournaments?status=foobar')
        .expect(400);
    });
  });

  describe('GET /tournaments/:id', () => {
    it('returns tournament details', async () => {
      const tournament = await createTournament(testApp);
      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/tournaments/${tournament.id}`)
        .expect(200);
      expect(res.body.data.id).toBe(tournament.id);
    });

    it('returns 404 for an unknown id', async () => {
      await request(testApp.app.getHttpServer())
        .get('/api/v1/tournaments/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('returns 400 for a malformed UUID', async () => {
      await request(testApp.app.getHttpServer())
        .get('/api/v1/tournaments/not-a-uuid')
        .expect(400);
    });
  });

  describe('PUT /tournaments/:id', () => {
    it('updates an existing tournament when authenticated', async () => {
      const tournament = await createTournament(testApp);
      const res = await request(testApp.app.getHttpServer())
        .put(`/api/v1/tournaments/${tournament.id}`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .send({ name: 'Updated Tournament' })
        .expect(200);
      expect(res.body.data.name).toBe('Updated Tournament');
    });

    it('rejects unauthenticated update (401)', async () => {
      const tournament = await createTournament(testApp);
      await request(testApp.app.getHttpServer())
        .put(`/api/v1/tournaments/${tournament.id}`)
        .send({ name: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /tournaments/:id', () => {
    it('deletes a tournament', async () => {
      const tournament = await createTournament(testApp);
      await request(testApp.app.getHttpServer())
        .delete(`/api/v1/tournaments/${tournament.id}`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .expect(200);

      await request(testApp.app.getHttpServer())
        .get(`/api/v1/tournaments/${tournament.id}`)
        .expect(404);
    });

    it('rejects unauthenticated delete (401)', async () => {
      const tournament = await createTournament(testApp);
      await request(testApp.app.getHttpServer())
        .delete(`/api/v1/tournaments/${tournament.id}`)
        .expect(401);
    });
  });

  describe('POST /tournaments/:id/join', () => {
    it('joins a tournament as authenticated player', async () => {
      const tournament = await createTournament(testApp, { maxPlayers: 4 });
      const player = await registerUser(testApp);
      const res = await request(testApp.app.getHttpServer())
        .post(`/api/v1/tournaments/${tournament.id}/join`)
        .set('Authorization', `Bearer ${player.accessToken}`)
        .expect(201);
      expect(res.body.data.joined).toBe(true);
    });

    it('rejects unauthenticated join (401)', async () => {
      const tournament = await createTournament(testApp);
      await request(testApp.app.getHttpServer())
        .post(`/api/v1/tournaments/${tournament.id}/join`)
        .expect(401);
    });

    it('rejects joining a full tournament', async () => {
      const tournament = await createTournament(testApp, { maxPlayers: 2 });
      const p1 = await registerUser(testApp);
      const p2 = await registerUser(testApp);
      const p3 = await registerUser(testApp);
      await request(testApp.app.getHttpServer())
        .post(`/api/v1/tournaments/${tournament.id}/join`)
        .set('Authorization', `Bearer ${p1.accessToken}`)
        .expect(201);
      await request(testApp.app.getHttpServer())
        .post(`/api/v1/tournaments/${tournament.id}/join`)
        .set('Authorization', `Bearer ${p2.accessToken}`)
        .expect(201);
      const res = await request(testApp.app.getHttpServer())
        .post(`/api/v1/tournaments/${tournament.id}/join`)
        .set('Authorization', `Bearer ${p3.accessToken}`);
      expect([400, 409, 422]).toContain(res.status);
    });
  });

  describe('PUT /tournaments/:id — start (status: in_progress)', () => {
    it('generates bracket matches when tournament starts', async () => {
      const tournament = await createTournament(testApp, { maxPlayers: 4 });
      for (let i = 0; i < 4; i++) {
        const p = await registerUser(testApp);
        await request(testApp.app.getHttpServer())
          .post(`/api/v1/tournaments/${tournament.id}/join`)
          .set('Authorization', `Bearer ${p.accessToken}`)
          .expect(201);
      }

      const res = await request(testApp.app.getHttpServer())
        .put(`/api/v1/tournaments/${tournament.id}`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(res.body.data.status).toBe('in_progress');
    });

    it('rejects starting with fewer than 2 players (422)', async () => {
      const tournament = await createTournament(testApp, { maxPlayers: 4 });
      await request(testApp.app.getHttpServer())
        .put(`/api/v1/tournaments/${tournament.id}`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .send({ status: 'in_progress' })
        .expect(422);
    });

    it('rejects starting an already started tournament (422)', async () => {
      const tournament = await createTournament(testApp, { maxPlayers: 4 });
      for (let i = 0; i < 4; i++) {
        const p = await registerUser(testApp);
        await request(testApp.app.getHttpServer())
          .post(`/api/v1/tournaments/${tournament.id}/join`)
          .set('Authorization', `Bearer ${p.accessToken}`)
          .expect(201);
      }
      await request(testApp.app.getHttpServer())
        .put(`/api/v1/tournaments/${tournament.id}`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      // Second attempt must fail
      await request(testApp.app.getHttpServer())
        .put(`/api/v1/tournaments/${tournament.id}`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .send({ status: 'in_progress' })
        .expect(422);
    });
  });

  describe('PUT /tournaments/:id — complete (status: completed)', () => {
    it('rejects completing a tournament with unresolved matches (422)', async () => {
      const tournament = await createTournament(testApp, { maxPlayers: 4 });
      for (let i = 0; i < 4; i++) {
        const p = await registerUser(testApp);
        await request(testApp.app.getHttpServer())
          .post(`/api/v1/tournaments/${tournament.id}/join`)
          .set('Authorization', `Bearer ${p.accessToken}`)
          .expect(201);
      }
      await request(testApp.app.getHttpServer())
        .put(`/api/v1/tournaments/${tournament.id}`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      // Try to complete without resolving any match
      await request(testApp.app.getHttpServer())
        .put(`/api/v1/tournaments/${tournament.id}`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .send({ status: 'completed' })
        .expect(422);
    });
  });

  describe('GET /tournaments/:id/matches', () => {
    it('returns matches for a tournament (empty before start)', async () => {
      const tournament = await createTournament(testApp);
      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/tournaments/${tournament.id}/matches`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .expect(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns matches after tournament starts', async () => {
      const tournament = await createTournament(testApp, { maxPlayers: 4 });
      for (let i = 0; i < 4; i++) {
        const p = await registerUser(testApp);
        await request(testApp.app.getHttpServer())
          .post(`/api/v1/tournaments/${tournament.id}/join`)
          .set('Authorization', `Bearer ${p.accessToken}`)
          .expect(201);
      }
      await request(testApp.app.getHttpServer())
        .put(`/api/v1/tournaments/${tournament.id}`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/tournaments/${tournament.id}/matches`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('round');
      expect(res.body.data[0]).toHaveProperty('player1Id');
      expect(res.body.data[0]).toHaveProperty('player2Id');
    });

    it('rejects unauthenticated requests (401)', async () => {
      const tournament = await createTournament(testApp);
      await request(testApp.app.getHttpServer())
        .get(`/api/v1/tournaments/${tournament.id}/matches`)
        .expect(401);
    });
  });

  describe('GET /tournaments/:id/bracket', () => {
    it('returns an empty bracket before the tournament starts', async () => {
      const tournament = await createTournament(testApp);
      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/tournaments/${tournament.id}/bracket`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .expect(200);

      expect(res.body.data).toMatchObject({
        tournamentId: tournament.id,
        totalRounds: 0,
        rounds: [],
        finalWinnerId: null,
      });
    });

    it('returns rounds with matches after the tournament starts', async () => {
      const tournament = await createTournament(testApp, { maxPlayers: 4 });
      for (let i = 0; i < 4; i++) {
        const p = await registerUser(testApp);
        await request(testApp.app.getHttpServer())
          .post(`/api/v1/tournaments/${tournament.id}/join`)
          .set('Authorization', `Bearer ${p.accessToken}`)
          .expect(201);
      }
      await request(testApp.app.getHttpServer())
        .put(`/api/v1/tournaments/${tournament.id}`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/tournaments/${tournament.id}/bracket`)
        .set('Authorization', `Bearer ${tournament.ownerToken}`)
        .expect(200);

      const bracket = res.body.data;
      expect(bracket.tournamentId).toBe(tournament.id);
      expect(bracket.totalRounds).toBeGreaterThan(0);
      expect(bracket.rounds[0].round).toBe(1);
      expect(bracket.rounds[0].matches.length).toBeGreaterThan(0);
      const firstMatch = bracket.rounds[0].matches[0];
      expect(firstMatch).toHaveProperty('id');
      expect(firstMatch).toHaveProperty('player1Id');
      expect(firstMatch).toHaveProperty('player2Id');
      expect(firstMatch).toHaveProperty('isBye');
      expect(firstMatch).toHaveProperty('status');
      expect(firstMatch).toHaveProperty('score');
      expect(firstMatch).toHaveProperty('winnerId');
      expect(bracket.finalWinnerId).toBeNull();
    });

    it('returns 404 for an unknown tournament', async () => {
      const user = await registerUser(testApp);
      await request(testApp.app.getHttpServer())
        .get('/api/v1/tournaments/00000000-0000-0000-0000-000000000000/bracket')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(404);
    });

    it('rejects unauthenticated requests (401)', async () => {
      const tournament = await createTournament(testApp);
      await request(testApp.app.getHttpServer())
        .get(`/api/v1/tournaments/${tournament.id}/bracket`)
        .expect(401);
    });
  });
});
