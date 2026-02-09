import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { CustomerDto } from '../../customers/dto/customer.dto';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsInt()
  @Min(1)
  qty: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unit_price: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  order_id: string;

  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsIn(['BRL', 'USD', 'EUR'])
  currency: string;

  @IsString()
  @IsNotEmpty()
  idempotency_key: string;
}

export class ConvertedPrices {
  BRL: number | null;
  USD: number | null;
  EUR: number | null;
}
