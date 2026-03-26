import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from '../common/repositories/user.repository';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, JwtAuthGuard, RolesGuard],
  exports: [UserService],
})
export class UserModule {}
