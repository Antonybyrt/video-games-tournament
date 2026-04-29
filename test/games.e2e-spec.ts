import request from 'supertest';
import { registerUser } from './setup/auth.helper';
import { createTestApp, TestApp } from './setup/test-app.factory';

describe('Games (e2e)', () => {
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

  describe('GET /games', () => {
    it('returns an empty array when there are no games', async () => {
      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/games')
        .expect(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('POST /games', () => {
    const validPayload = {
      name: 'Street Fighter 6',
      publisher: 'Capcom',
      releaseDate: '2023-06-02',
      genre: 'Fighting',
    };

    it('rejects unauthenticated requests (401)', async () => {
      await request(testApp.app.getHttpServer())
        .post('/api/v1/games')
        .send(validPayload)
        .expect(401);
    });

    it('rejects authenticated non-admin users (403)', async () => {
      const user = await registerUser(testApp);
      await request(testApp.app.getHttpServer())
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(validPayload)
        .expect(403);
    });

    it('creates a game when called by an admin (201)', async () => {
      const admin = await registerUser(testApp, { isAdmin: true });
      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send(validPayload)
        .expect(201);

      expect(res.body.data).toMatchObject({
        name: 'Street Fighter 6',
        publisher: 'Capcom',
        genre: 'Fighting',
      });
      expect(res.body.data.id).toBeDefined();
    });

    it('rejects invalid payloads (400)', async () => {
      const admin = await registerUser(testApp, { isAdmin: true });
      await request(testApp.app.getHttpServer())
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: '', publisher: '', releaseDate: 'not-a-date', genre: '' })
        .expect(400);
    });

    it('lists the game after creation', async () => {
      const admin = await registerUser(testApp, { isAdmin: true });
      await request(testApp.app.getHttpServer())
        .post('/api/v1/games')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send(validPayload)
        .expect(201);

      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/games')
        .expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Street Fighter 6');
    });
  });
});
