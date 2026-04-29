import request from 'supertest';
import { registerUser, RegisteredUser } from './setup/auth.helper';
import { createTournament } from './setup/fixtures';
import { createTestApp, TestApp } from './setup/test-app.factory';

interface BracketSetup {
  tournamentId: string;
  ownerToken: string;
  matches: Array<{
    id: string;
    player1Id: string;
    player2Id: string;
  }>;
  players: RegisteredUser[];
}

async function setupStartedTournament(testApp: TestApp): Promise<BracketSetup> {
  const tournament = await createTournament(testApp, { maxPlayers: 4 });
  const players: RegisteredUser[] = [];
  for (let i = 0; i < 4; i++) {
    const p = await registerUser(testApp);
    players.push(p);
    await request(testApp.app.getHttpServer())
      .post(`/api/v1/tournaments/${tournament.id}/join`)
      .set('Authorization', `Bearer ${p.accessToken}`)
      .expect(201);
  }
  const startRes = await request(testApp.app.getHttpServer())
    .post(`/api/v1/tournaments/${tournament.id}/start`)
    .set('Authorization', `Bearer ${tournament.ownerToken}`)
    .expect(201);

  return {
    tournamentId: tournament.id,
    ownerToken: tournament.ownerToken,
    matches: startRes.body.data,
    players,
  };
}

describe('Matches (e2e)', () => {
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

  describe('POST /matches/:id/result', () => {
    it('rejects unauthenticated requests (401)', async () => {
      const setup = await setupStartedTournament(testApp);
      const match = setup.matches[0];
      await request(testApp.app.getHttpServer())
        .post(`/api/v1/matches/${match.id}/result`)
        .send({ winnerId: match.player1Id, score: '2:1' })
        .expect(401);
    });

    it('submits a valid result (200)', async () => {
      const setup = await setupStartedTournament(testApp);
      const match = setup.matches[0];
      const res = await request(testApp.app.getHttpServer())
        .post(`/api/v1/matches/${match.id}/result`)
        .set('Authorization', `Bearer ${setup.ownerToken}`)
        .send({ winnerId: match.player1Id, score: '2:1' })
        .expect(200);
      expect(res.body.data.winnerId).toBe(match.player1Id);
      expect(res.body.data.score).toBe('2:1');
      expect(res.body.data.status).toBe('completed');
    });

    it('rejects an invalid score format (400)', async () => {
      const setup = await setupStartedTournament(testApp);
      const match = setup.matches[0];
      await request(testApp.app.getHttpServer())
        .post(`/api/v1/matches/${match.id}/result`)
        .set('Authorization', `Bearer ${setup.ownerToken}`)
        .send({ winnerId: match.player1Id, score: 'not-a-score' })
        .expect(400);
    });

    it('rejects a winnerId that is not a UUID (400)', async () => {
      const setup = await setupStartedTournament(testApp);
      const match = setup.matches[0];
      await request(testApp.app.getHttpServer())
        .post(`/api/v1/matches/${match.id}/result`)
        .set('Authorization', `Bearer ${setup.ownerToken}`)
        .send({ winnerId: 'not-uuid', score: '2:1' })
        .expect(400);
    });

    it('rejects a winnerId that is not a participant of the match', async () => {
      const setup = await setupStartedTournament(testApp);
      const match = setup.matches[0];
      const stranger = await registerUser(testApp);
      const res = await request(testApp.app.getHttpServer())
        .post(`/api/v1/matches/${match.id}/result`)
        .set('Authorization', `Bearer ${setup.ownerToken}`)
        .send({ winnerId: stranger.playerId, score: '2:1' });
      expect([400, 422]).toContain(res.status);
    });

    it('returns 404 for an unknown match id', async () => {
      const setup = await setupStartedTournament(testApp);
      await request(testApp.app.getHttpServer())
        .post('/api/v1/matches/00000000-0000-0000-0000-000000000000/result')
        .set('Authorization', `Bearer ${setup.ownerToken}`)
        .send({ winnerId: setup.matches[0].player1Id, score: '2:1' })
        .expect(404);
    });
  });
});
