import request from 'supertest';
import { createTestApp, TestApp } from './setup/test-app.factory';

describe('App (e2e smoke test)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('boots the app and responds to GET /api/v1', () => {
    return request(testApp.app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBe('Hello World!');
      });
  });
});
