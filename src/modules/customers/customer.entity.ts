import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrderEntity } from '../orders/order.entity';

@Entity({ name: 'customers' })
export class CustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  cep: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  street: string;

  @OneToMany(() => OrderEntity, 'customer')
  orders: OrderEntity[];
}
