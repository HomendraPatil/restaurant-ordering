import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuRepository } from './menu.repository';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';

@Module({
  controllers: [MenuController],
  providers: [MenuService, MenuRepository, JwtAuthGuard, RolesGuard],
  exports: [MenuService],
})
export class MenuModule {}
