export type SkuValidationResult = {
  valid: boolean;
  invalidSkus: string[];
  source: 'local';
};

export function validateSkus(skus: string[]): SkuValidationResult {
  const normalized = Array.from(
    new Set(skus.map((s) => s.trim()).filter(Boolean)),
  );

  if (normalized.length === 0) {
    return { valid: true, invalidSkus: [], source: 'local' };
  }

  const skuPattern = /^[A-Z0-9_-]{3,32}$/;
  const invalid = normalized.filter((sku) => !skuPattern.test(sku));
  return { valid: invalid.length === 0, invalidSkus: invalid, source: 'local' };
}
