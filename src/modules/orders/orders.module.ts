import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OrdersController,
  QueueController,
  WebhookOrdersController,
} from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderEntity } from './order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  controllers: [OrdersController, WebhookOrdersController, QueueController],
  providers: [OrdersService],
})
export class OrdersModule {}
