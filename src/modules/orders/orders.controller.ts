import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './order.entity';
import { OrdersService } from './orders.service';

@Controller('webhook/orders')
export class WebhookOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Query('status') status?: string) {
    if (status && !Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException('Invalid status');
    }
    return this.ordersService.findAll(status as OrderStatus | undefined);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}

@Controller('queue')
export class QueueController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('metrics')
  getMetrics() {
    return this.ordersService.getQueueMetrics();
  }
}
