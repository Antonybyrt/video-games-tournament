import request from 'supertest';
import { createTestApp, TestApp } from './setup/test-app.factory';

describe('Auth (e2e)', () => {
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

  describe('POST /auth/register', () => {
    it('creates a player and returns an access token (201)', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'alice',
          email: 'alice@example.com',
          password: 'Password1',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.body.data.accessToken.length).toBeGreaterThan(20);
    });

    it('rejects an invalid email (400)', async () => {
      await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'bob',
          email: 'not-an-email',
          password: 'Password1',
        })
        .expect(400);
    });

    it('rejects a weak password (400)', async () => {
      await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'carol',
          email: 'carol@example.com',
          password: 'weak',
        })
        .expect(400);
    });

    it('rejects unknown fields (forbidNonWhitelisted)', async () => {
      await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'dave',
          email: 'dave@example.com',
          password: 'Password1',
          isAdmin: true,
        })
        .expect(400);
    });

    it('returns a conflict when email is already registered', async () => {
      const payload = {
        username: 'eve',
        email: 'eve@example.com',
        password: 'Password1',
      };
      await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(payload)
        .expect(201);

      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...payload, username: 'eve2' });

      expect([400, 409]).toContain(res.status);
    });
  });

  describe('POST /auth/login', () => {
    const credentials = {
      username: 'frank',
      email: 'frank@example.com',
      password: 'Password1',
    };

    beforeEach(async () => {
      await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(credentials)
        .expect(201);
    });

    it('returns an access token on valid credentials (200)', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: credentials.email, password: credentials.password })
        .expect(200);

      expect(typeof res.body.data.accessToken).toBe('string');
    });

    it('rejects a wrong password', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: credentials.email, password: 'WrongPassword1' });
      expect([401, 422]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('rejects an unknown email', async () => {
      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@example.com', password: 'Password1' });
      expect([401, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });
});
