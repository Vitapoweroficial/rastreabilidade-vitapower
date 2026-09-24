export type LandedCostInput = {
  quotedQuantity: number;
  purchaseUnitPrice: number;
  unitsPerPurchaseUnit: number;
  freightCost: number | null;
  taxPercent: number;
  taxAmount: number;
  otherCost: number;
  discountAmount: number;
};

export type LandedCostResult = {
  normalizedUnitCost: number;
  merchandiseTotal: number;
  calculatedTax: number;
  landedTotal: number | null;
  landedUnitCost: number | null;
};

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

export function calculateLandedCost(input: LandedCostInput): LandedCostResult {
  const quotedQuantity = Math.max(0, Number(input.quotedQuantity) || 0);
  const unitsPerPurchaseUnit = Math.max(0.000001, Number(input.unitsPerPurchaseUnit) || 1);
  const purchaseUnitPrice = Math.max(0, Number(input.purchaseUnitPrice) || 0);
  const normalizedUnitCost = money(purchaseUnitPrice / unitsPerPurchaseUnit);
  const merchandiseTotal = money(normalizedUnitCost * quotedQuantity);
  const calculatedTax = money(
    merchandiseTotal * (Math.max(0, Number(input.taxPercent) || 0) / 100) +
      Math.max(0, Number(input.taxAmount) || 0)
  );

  if (input.freightCost === null) {
    return {
      normalizedUnitCost,
      merchandiseTotal,
      calculatedTax,
      landedTotal: null,
      landedUnitCost: null
    };
  }

  const landedTotal = money(
    merchandiseTotal +
      Math.max(0, Number(input.freightCost) || 0) +
      calculatedTax +
      Math.max(0, Number(input.otherCost) || 0) -
      Math.max(0, Number(input.discountAmount) || 0)
  );

  return {
    normalizedUnitCost,
    merchandiseTotal,
    calculatedTax,
    landedTotal,
    landedUnitCost: quotedQuantity > 0 ? money(landedTotal / quotedQuantity) : null
  };
}

export function calculateSavings(initialUnitPrice: number | null, finalUnitPrice: number, quantity: number) {
  if (initialUnitPrice === null || initialUnitPrice <= finalUnitPrice) return 0;
  return money((initialUnitPrice - finalUnitPrice) * Math.max(0, quantity));
}
