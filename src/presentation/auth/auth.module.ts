import { Module } from '@nestjs/common';
import { AuthInfrastructureModule } from '../../infrastructure/auth/auth.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [AuthInfrastructureModule],
  controllers: [AuthController],
  exports: [AuthInfrastructureModule],
})
export class AuthPresentationModule {}
