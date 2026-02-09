import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import {
  CustomerDto,
  OrderItemDto,
  ConvertedPrices,
} from './dto/create-order.dto';

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

  @Column({ type: 'jsonb' })
  customer: CustomerDto;

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
