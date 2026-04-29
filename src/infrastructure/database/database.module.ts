import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameTypeormEntity } from '../repositories/game/game.typeorm-entity';
import { MatchTypeormEntity } from '../repositories/match/match.typeorm-entity';
import { PlayerTypeormEntity } from '../repositories/player/player.typeorm-entity';
import { TournamentTypeormEntity } from '../repositories/tournament/tournament.typeorm-entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.get<string>('NODE_ENV');
        const isDev = env === 'development';
        const isTest = env === 'test';
        return {
          type: 'postgres' as const,
          url: config.getOrThrow<string>('DATABASE_URL'),
          entities: [
            PlayerTypeormEntity,
            TournamentTypeormEntity,
            MatchTypeormEntity,
            GameTypeormEntity,
          ],
          migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
          synchronize: isDev || isTest,
          autoLoadEntities: isDev || isTest,
          dropSchema: isTest,
          logging: isDev,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
