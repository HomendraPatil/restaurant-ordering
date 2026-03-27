import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { OrderModule } from '../order/order.module';
import { OrderGateway } from '../events/order.gateway';

@Module({
  imports: [OrderModule],
  controllers: [AdminController],
  providers: [AdminService, OrderGateway],
  exports: [AdminService],
})
export class AdminModule {}
