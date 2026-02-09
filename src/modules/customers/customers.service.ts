import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from './customer.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customersRepository: Repository<CustomerEntity>,
  ) {}

  async findAll(): Promise<CustomerEntity[]> {
    return this.customersRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<CustomerEntity | null> {
    return this.customersRepository.findOne({ where: { id } });
  }
}
