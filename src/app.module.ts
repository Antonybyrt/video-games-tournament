import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from './infrastructure/config/app.config';
import { envValidationSchema } from './infrastructure/config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthPresentationModule } from './presentation/auth/auth.module';
import { GameModule } from './presentation/game/game.module';
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
    TournamentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
