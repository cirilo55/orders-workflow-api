import { CreateOrderDto } from '../modules/orders/dto/create-order.dto';

export type ExchangeRates = {
  base: string;
  rates: { BRL: number | null; USD: number | null; EUR: number | null };
  provider: string;
  asOf: string;
};
export type ConvertedPrices = {
  BRL: number | null;
  USD: number | null;
  EUR: number | null;
};

export async function getExchangeRates(
  baseCurrency: string,
): Promise<ExchangeRates | null> {
  try {
    const base = baseCurrency.toUpperCase();
    const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(
      base,
    )}&to=BRL,USD,EUR`;

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      rates?: Record<string, number>;
      date?: string;
    };

    return {
      base,
      rates: {
        BRL: data.rates?.BRL ?? (base === 'BRL' ? 1 : null),
        USD: data.rates?.USD ?? (base === 'USD' ? 1 : null),
        EUR: data.rates?.EUR ?? (base === 'EUR' ? 1 : null),
      },
      provider: 'frankfurter.app',
      asOf: data.date ?? new Date().toISOString().slice(0, 10),
    };
  } catch {
    return null;
  }
}

export function toConvertedPrices(
  unitPrice: number,
  baseCurrency: string,
  exchange: ExchangeRates | null,
): ConvertedPrices {
  const base = baseCurrency.toUpperCase();
  const rates = exchange?.rates;

  const byRate = (rate: number | null | undefined) =>
    rate == null ? null : unitPrice * rate;

  return {
    BRL: base === 'BRL' ? unitPrice : byRate(rates?.BRL),
    USD: base === 'USD' ? unitPrice : byRate(rates?.USD),
    EUR: base === 'EUR' ? unitPrice : byRate(rates?.EUR),
  };
}

export function calculateOrderTotal(items: CreateOrderDto['items']): number {
  return items.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
}

export async function getRatesForCurrency(
  currency: string,
  cache: Map<string, ExchangeRates | null>,
): Promise<ExchangeRates | null> {
  const key = currency.toUpperCase();
  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }
  const rates = await getExchangeRates(key);
  cache.set(key, rates);
  return rates;
}
