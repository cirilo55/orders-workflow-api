import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { CustomerService } from './customers.service';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async findAll() {
    return this.customerService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const customer = await this.customerService.findOne(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }
}
