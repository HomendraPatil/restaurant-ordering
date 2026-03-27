import { Module, Global } from '@nestjs/common';
import { OrderGateway } from './order.gateway';

@Global()
@Module({
  providers: [OrderGateway],
  exports: [OrderGateway],
})
export class EventsModule {}