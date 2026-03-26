import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryRepository } from './category.repository';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository, JwtAuthGuard, RolesGuard],
  exports: [CategoryService],
})
export class CategoryModule {}
