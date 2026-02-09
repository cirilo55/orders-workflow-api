import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { CustomerEntity } from '../customers/customer.entity';
import { OrderItemDto, ConvertedPrices } from './dto/create-order.dto';

export enum OrderStatus {
  Received = 'received',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed_enrichment',
}

@Entity({ name: 'orders' })
@Index(['idempotency_key'], { unique: true })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order_id: string;

  @Column({ name: 'customer_id' })
  customer_id: string;

  @ManyToOne(() => CustomerEntity, 'orders', {
    eager: true,
  })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity;

  @Column({ type: 'jsonb' })
  items: OrderItemDto[];

  @Column()
  currency: string;

  @Column({ type: 'numeric', nullable: true })
  total_price: number | null;

  @Column({ type: 'jsonb', nullable: true })
  converted_prices: ConvertedPrices | null;

  @Column()
  idempotency_key: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Received })
  status: OrderStatus;

  @Column({ type: 'jsonb', nullable: true })
  dlq_payload: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
