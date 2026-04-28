import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from './infrastructure/config/app.config';
import { envValidationSchema } from './infrastructure/config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthPresentationModule } from './presentation/auth/auth.module';
import { GameModule } from './presentation/game/game.module';
import { MatchModule } from './presentation/match/match.module';
import { PlayerModule } from './presentation/player/player.module';
import { TournamentModule } from './presentation/tournament/tournament.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev',
      load: [appConfig],
      validationSchema: envValidationSchema,
    }),
    DatabaseModule,
    AuthPresentationModule,
    GameModule,
    MatchModule,
    TournamentModule,
    PlayerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
