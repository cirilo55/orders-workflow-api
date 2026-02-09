import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderEntity, OrderStatus } from './order.entity';
import {
  calculateOrderTotal,
  getRatesForCurrency,
  toConvertedPrices,
} from '../../helpers/exchangeRates';
import { lookupCep } from '../../helpers/cep';
import { validateSkus } from '../../helpers/sku';
import { CustomerEntity } from '../customers/customer.entity';

@Injectable()
export class OrdersService {
  private readonly processingQueue: string[] = [];
  private readonly maxAttempts = 3;
  private readonly baseDelayMs = 200;

  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customersRepository: Repository<CustomerEntity>,
  ) {}

  async create(dto: CreateOrderDto): Promise<OrderEntity> {
    const existing: OrderEntity | null = await this.ordersRepository.findOne({
      where: { idempotency_key: dto.idempotency_key },
    });

    if (existing) {
      throw new BadRequestException('Existing order with same key found');
    }

    const customerInput = dto.customer;
    let customer = await this.customersRepository.findOne({
      where: { email: customerInput.email },
    });
    let shouldSaveCustomer = false;

    if (!customer) {
      customer = this.customersRepository.create({
        email: customerInput.email,
        name: customerInput.name,
      });
      shouldSaveCustomer = true;
    } else if (customer.name !== customerInput.name) {
      customer = this.customersRepository.merge(customer, {
        name: customerInput.name,
      });
      shouldSaveCustomer = true;
    }

    if (customerInput.cep) {
      const address = await lookupCep(customerInput.cep);
      if (!address) {
        throw new BadRequestException('Invalid CEP');
      }
      customer = this.customersRepository.merge(customer, {
        cep: address.cep,
        state: address.state,
        city: address.city,
        street: address.street,
      });
      shouldSaveCustomer = true;
    } else if (
      customer.cep &&
      (!customer.state || !customer.city || !customer.street)
    ) {
      const address = await lookupCep(customer.cep);
      if (!address) {
        throw new BadRequestException('Invalid CEP');
      }
      customer = this.customersRepository.merge(customer, {
        cep: address.cep,
        state: address.state,
        city: address.city,
        street: address.street,
      });
      shouldSaveCustomer = true;
    }

    if (shouldSaveCustomer) {
      customer = await this.customersRepository.save(customer);
    }

    const skuResult = validateSkus(dto.items.map((item) => item.sku));
    if (!skuResult.valid) {
      const preview = skuResult.invalidSkus.slice(0, 5).join(', ');
      throw new BadRequestException(`Invalid SKU(s): ${preview}`);
    }

    const total = calculateOrderTotal(dto.items);
    let converted_prices: OrderEntity['converted_prices'] = null;
    let status = OrderStatus.Received;
    let dlq_payload: OrderEntity['dlq_payload'] = null;

    try {
      const rates = await this.retry(async () => {
        const result = await getRatesForCurrency(dto.currency, new Map());
        if (!result) {
          throw new Error('Exchange rates unavailable');
        }
        return result;
      });

      converted_prices = toConvertedPrices(total, dto.currency, rates);
    } catch (err: unknown) {
      status = OrderStatus.Failed;
      dlq_payload = {
        reason: err instanceof Error ? err.message : 'Unknown error',
        attempts: this.maxAttempts,
        currency: dto.currency,
        order_id: dto.order_id,
        idempotency_key: dto.idempotency_key,
        at: new Date().toISOString(),
      };
    }

    const order: OrderEntity = this.ordersRepository.create({
      order_id: dto.order_id,
      customer_id: customer.id,
      customer,
      items: dto.items,
      currency: dto.currency,
      idempotency_key: dto.idempotency_key,
      status,
      total_price: total,
      converted_prices,
      dlq_payload,
    });

    const saved = await this.ordersRepository.save(order);
    this.processingQueue.push(saved.id);

    return saved;
  }

  async findAll(status?: OrderStatus): Promise<OrderEntity[]> {
    const where = status ? { status } : undefined;
    return this.ordersRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<OrderEntity | null> {
    return this.ordersRepository.findOne({ where: { id } });
  }

  getQueueMetrics() {
    return {
      pending: this.processingQueue.length,
    };
  }

  private async retry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < this.maxAttempts) {
          const delayMs = this.baseDelayMs * 2 ** (attempt - 1);
          await this.delay(delayMs);
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Retry failed');
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
