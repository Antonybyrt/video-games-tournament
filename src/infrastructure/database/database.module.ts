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
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        entities: [
          PlayerTypeormEntity,
          TournamentTypeormEntity,
          MatchTypeormEntity,
          GameTypeormEntity,
        ],
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}