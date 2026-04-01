import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginUseCase } from '../../application/auth/use-cases/login.use-case';
import { RegisterUseCase } from '../../application/auth/use-cases/register.use-case';
import { HASH_SERVICE } from '../../application/auth/ports/hash.service.interface';
import { PLAYER_REPOSITORY } from '../../domain/player/player.repository.interface';
import { TOKEN_SERVICE } from '../../application/auth/ports/token.service.interface';
import { PlayerTypeormEntity } from '../repositories/player/player.typeorm-entity';
import { PlayerTypeormRepository } from '../repositories/player/player.typeorm-repository';
import { BcryptHashService } from './bcrypt-hash.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { JwtTokenService } from './jwt-token.service';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayerTypeormEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>(
            'JWT_EXPIRES_IN',
          ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  providers: [
    { provide: PLAYER_REPOSITORY, useClass: PlayerTypeormRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: HASH_SERVICE, useClass: BcryptHashService },
    {
      provide: RegisterUseCase,
      useFactory: (
        repo: PlayerTypeormRepository,
        hash: BcryptHashService,
        token: JwtTokenService,
      ) => new RegisterUseCase(repo, hash, token),
      inject: [PLAYER_REPOSITORY, HASH_SERVICE, TOKEN_SERVICE],
    },
    {
      provide: LoginUseCase,
      useFactory: (
        repo: PlayerTypeormRepository,
        hash: BcryptHashService,
        token: JwtTokenService,
      ) => new LoginUseCase(repo, hash, token),
      inject: [PLAYER_REPOSITORY, HASH_SERVICE, TOKEN_SERVICE],
    },
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
    PLAYER_REPOSITORY,
    RegisterUseCase,
    LoginUseCase,
  ],
})
export class AuthInfrastructureModule {}
