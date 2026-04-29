import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(__dirname, '..', '..', '.env.test') });
process.env.NODE_ENV = 'test';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/infrastructure/http/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from '../../src/infrastructure/http/interceptors/response-envelope.interceptor';
import { globalValidationPipe } from '../../src/infrastructure/http/pipes/validation.pipe';

export interface TestApp {
  app: INestApplication;
  dataSource: DataSource;
  cleanDatabase: () => Promise<void>;
  close: () => Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(globalValidationPipe);
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  const dataSource = app.get(DataSource);

  const cleanDatabase = async (): Promise<void> => {
    await dataSource.query(
      'TRUNCATE TABLE "matches", "tournament_players", "tournaments", "games", "players" RESTART IDENTITY CASCADE',
    );
  };

  const close = async (): Promise<void> => {
    await app.close();
  };

  return { app, dataSource, cleanDatabase, close };
}
