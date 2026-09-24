import assert from "node:assert/strict";
import test from "node:test";
import { calculateLandedCost, calculateSavings } from "../src/lib/procurement-calculations.ts";

test("normaliza preço de saco e calcula custo posto por kg", () => {
  const result = calculateLandedCost({
    quotedQuantity: 500,
    purchaseUnitPrice: 750,
    unitsPerPurchaseUnit: 25,
    freightCost: 800,
    taxPercent: 4,
    taxAmount: 0,
    otherCost: 200,
    discountAmount: 500
  });
  assert.equal(result.normalizedUnitCost, 30);
  assert.equal(result.merchandiseTotal, 15000);
  assert.equal(result.calculatedTax, 600);
  assert.equal(result.landedTotal, 16100);
  assert.equal(result.landedUnitCost, 32.2);
});

test("mantém custo posto pendente quando o frete não foi informado", () => {
  const result = calculateLandedCost({
    quotedQuantity: 1000,
    purchaseUnitPrice: 0.8,
    unitsPerPurchaseUnit: 1,
    freightCost: null,
    taxPercent: 0,
    taxAmount: 0,
    otherCost: 0,
    discountAmount: 0
  });
  assert.equal(result.normalizedUnitCost, 0.8);
  assert.equal(result.landedTotal, null);
  assert.equal(result.landedUnitCost, null);
});

test("calcula economia negociada somente quando houve redução", () => {
  assert.equal(calculateSavings(35, 32, 500), 1500);
  assert.equal(calculateSavings(30, 32, 500), 0);
  assert.equal(calculateSavings(null, 32, 500), 0);
});
