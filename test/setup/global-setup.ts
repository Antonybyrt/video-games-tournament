import { execSync } from 'child_process';
import { resolve } from 'path';

const composeFile = resolve(
  __dirname,
  '..',
  '..',
  'docker',
  'docker-compose.test.yml',
);

export default async function globalSetup(): Promise<void> {
  execSync(`docker compose -f "${composeFile}" up -d --wait`, {
    stdio: 'inherit',
  });
}
