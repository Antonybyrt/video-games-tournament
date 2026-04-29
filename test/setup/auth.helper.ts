import request from 'supertest';
import { TestApp } from './test-app.factory';

export interface RegisteredUser {
  accessToken: string;
  playerId: string;
  username: string;
  email: string;
  password: string;
}

export interface RegisterOptions {
  username?: string;
  email?: string;
  password?: string;
  isAdmin?: boolean;
}

let counter = 0;

export async function registerUser(
  testApp: TestApp,
  options: RegisterOptions = {},
): Promise<RegisteredUser> {
  counter += 1;
  const username = options.username ?? `user${Date.now()}_${counter}`;
  const email = options.email ?? `${username}@example.com`;
  const password = options.password ?? 'Password1';

  const res = await request(testApp.app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ username, email, password });

  if (res.status !== 201) {
    throw new Error(
      `register failed: status=${res.status} body=${JSON.stringify(res.body)}`,
    );
  }

  const accessToken = res.body.data.accessToken as string;

  const player = await testApp.dataSource.query<{ id: string }[]>(
    'SELECT id FROM players WHERE email = $1',
    [email],
  );
  const playerId = player[0].id;

  if (options.isAdmin) {
    await testApp.dataSource.query(
      'UPDATE players SET "isAdmin" = true WHERE id = $1',
      [playerId],
    );
    const loginRes = await request(testApp.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });
    return {
      accessToken: loginRes.body.data.accessToken as string,
      playerId,
      username,
      email,
      password,
    };
  }

  return { accessToken, playerId, username, email, password };
}
