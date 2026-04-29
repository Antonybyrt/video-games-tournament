import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:3000/api/v1';
const DB_CONTAINER = 'tournament_db_dev';
const DB_USER = 'gaetan';
const DB_NAME = 'tournament';

const green = (s: string) => `\x1b[32m✓ ${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m✗ ${s}\x1b[0m`;

function ok(msg: string) { console.log(green(msg)); }
function fail(msg: string): never {
  console.error(red(msg));
  process.exit(1);
}

interface ApiResponse<T = unknown> {
  status: number;
  data: T;
}

async function api<T = unknown>(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json();
  return { status: res.status, data: (json as { data: T }).data };
}

function jwtSub(token: string): string {
  const payload = Buffer.from(token.split('.')[1], 'base64').toString('utf-8');
  return (JSON.parse(payload) as { sub: string }).sub;
}

function sql(query: string) {
  execSync(
    `docker exec ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -c "${query}"`,
    { stdio: 'ignore' },
  );
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const ADMIN_EMAIL = 'admin@cycle.test';
  const ADMIN_PASS = 'Admin1234';

  // ─── 1. Admin ──────────────────────────────────────────────────────────────
  console.log('\n=== Setup admin ===');

  await api('POST', '/auth/register', {
    body: { username: 'cycleadmin', email: ADMIN_EMAIL, password: ADMIN_PASS },
  }).catch(() => undefined);

  sql(`UPDATE players SET \\"isAdmin\\" = true WHERE email = '${ADMIN_EMAIL}';`);
  ok('admin elevated');

  const adminLogin = await api<{ accessToken: string }>('POST', '/auth/login', {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASS },
  });
  if (adminLogin.status !== 200) fail(`admin login (${adminLogin.status})`);
  const adminToken = (adminLogin.data as { accessToken: string }).accessToken;
  ok('admin logged in');

  // ─── 2. Register 12 players ────────────────────────────────────────────────
  console.log('\n=== Register 12 players ===');

  const playerIds: string[] = [];
  const playerTokens: string[] = [];

  for (let i = 1; i <= 12; i++) {
    const email = `player${i}@cycle.test`;
    const password = 'Player1234';
    const username = `cycleplayer${i}`;

    const reg = await api('POST', '/auth/register', {
      body: { username, email, password },
    });
    if (reg.status !== 201 && reg.status !== 409)
      fail(`register player${i} (${reg.status})`);

    const login = await api<{ accessToken: string }>('POST', '/auth/login', {
      body: { email, password },
    });
    if (login.status !== 200) fail(`login player${i} (${login.status})`);

    const token = (login.data as { accessToken: string }).accessToken;
    playerTokens.push(token);
    playerIds.push(jwtSub(token));

    const label = reg.status === 409 ? 'already exists' : 'registered';
    ok(`player${i} ${label} (${playerIds[i - 1]})`);
  }

  // ─── 3. Game + Tournament ──────────────────────────────────────────────────
  console.log('\n=== Create game & tournament ===');

  const run = Date.now();

  const gameRes = await api<{ id: string }>('POST', '/games', {
    token: adminToken,
    body: { name: `Cycle Game ${run}`, publisher: 'Test', releaseDate: '2024-01-01', genre: 'FPS' },
  });
  if (gameRes.status !== 201) fail(`create game (${gameRes.status})`);
  const gameId = (gameRes.data as { id: string }).id;
  ok(`game created (${gameId})`);

  const tRes = await api<{ id: string }>('POST', '/tournaments', {
    token: adminToken,
    body: { name: `Full Cycle Cup ${run}`, gameId, maxPlayers: 12, startDate: '2026-08-01T10:00:00.000Z' },
  });
  if (tRes.status !== 201) fail(`create tournament (${tRes.status})`);
  const tournamentId = (tRes.data as { id: string }).id;
  ok(`tournament created (${tournamentId})`);

  // ─── 4. Players join ───────────────────────────────────────────────────────
  console.log('\n=== Players join tournament ===');

  for (let i = 0; i < 12; i++) {
    const res = await api('POST', `/tournaments/${tournamentId}/join`, {
      token: playerTokens[i],
    });
    if (res.status !== 201) fail(`player${i + 1} join (${res.status})`);
    ok(`player${i + 1} joined`);
  }

  // ─── 5. Bracket rounds ─────────────────────────────────────────────────────
  console.log('\n=== Tournament bracket ===');

  let round = 0;
  while (true) {
    round++;
    console.log(`\n--- Round ${round} ---`);

    const startRes = await api<Array<{ id: string; status: string; player1Id: string }>>('POST', `/tournaments/${tournamentId}/start`, {
      token: adminToken,
    });
    if (startRes.status !== 201) fail(`start round ${round} (${startRes.status})`);

    const matches = startRes.data as Array<{ id: string; status: string; player1Id: string }>;
    const pending = matches.filter((m) => m.status === 'pending');

    if (pending.length === 0) {
      ok('Tournament completed — no more matches');
      break;
    }

    for (const match of pending) {
      const res = await api('POST', `/matches/${match.id}/result`, {
        token: adminToken,
        body: { winnerId: match.player1Id, score: '3:1' },
      });
      if (res.status !== 200) fail(`submit result ${match.id} (${res.status})`);
      ok(`match ${match.id} → winner ${match.player1Id}`);
    }
  }

  // ─── 6. Stats & Rankings ───────────────────────────────────────────────────
  console.log('\n=== Stats & Rankings ===');

  const rankRes = await api<unknown[]>('GET', '/players/rankings');
  if (rankRes.status !== 200) fail(`rankings (${rankRes.status})`);
  console.log(JSON.stringify((rankRes.data as unknown[]).slice(0, 3), null, 2));
  ok('rankings OK');

  const statsRes = await api('GET', `/players/${playerIds[0]}/stats`);
  if (statsRes.status !== 200) fail(`player1 stats (${statsRes.status})`);
  console.log(JSON.stringify(statsRes.data, null, 2));
  ok('player1 stats OK');

  console.log(`\n\x1b[32m=== Full cycle completed successfully ===\x1b[0m`);
}

main().catch((err: unknown) => {
  console.error(red(String(err)));
  process.exit(1);
});
