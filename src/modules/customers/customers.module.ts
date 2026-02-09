import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerController } from './customers.controler';
import { CustomerEntity } from './customer.entity';
import { CustomerService } from './customers.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity])],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
