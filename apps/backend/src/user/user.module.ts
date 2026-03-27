import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { AddressController } from './address.controller';
import { UserService } from './user.service';
import { AddressService } from './address.service';
import { UserRepository } from '../common/repositories/user.repository';
import { AddressRepository } from './address.repository';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';

@Module({
  controllers: [UserController, AddressController],
  providers: [UserService, AddressService, UserRepository, AddressRepository, JwtAuthGuard, RolesGuard],
  exports: [UserService, AddressService],
})
export class UserModule {}
