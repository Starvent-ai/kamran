import { describe, expect, it } from "vitest";
import { computeCalculatorResult } from "@/modules/calculator/calculatorMath";

describe("computeCalculatorResult", () => {
  it("computes profit and profit percent from purchase/sale price", () => {
    const r = computeCalculatorResult({
      purchasePrice: 1000000,
      salePrice: 1200000,
      discountType: "amount",
      discountValue: 0,
      taxPercent: 0,
      installmentCount: 1
    });
    expect(r.grossProfit).toBe(200000);
    expect(r.profitPercent).toBeCloseTo(20, 5);
  });

  it("applies a fixed-amount discount before tax", () => {
    const r = computeCalculatorResult({
      purchasePrice: 0,
      salePrice: 1000000,
      discountType: "amount",
      discountValue: 100000,
      taxPercent: 10,
      installmentCount: 1
    });
    expect(r.discountAmount).toBe(100000);
    expect(r.priceAfterDiscount).toBe(900000);
    expect(r.taxAmount).toBe(90000);
    expect(r.finalPrice).toBe(990000);
  });

  it("applies a percent discount relative to the sale price", () => {
    const r = computeCalculatorResult({
      purchasePrice: 0,
      salePrice: 1000000,
      discountType: "percent",
      discountValue: 10,
      taxPercent: 0,
      installmentCount: 1
    });
    expect(r.discountAmount).toBe(100000);
    expect(r.finalPrice).toBe(900000);
  });

  it("never lets the discounted price go negative", () => {
    const r = computeCalculatorResult({
      purchasePrice: 0,
      salePrice: 100000,
      discountType: "amount",
      discountValue: 500000,
      taxPercent: 0,
      installmentCount: 1
    });
    expect(r.priceAfterDiscount).toBe(0);
  });

  it("splits the final price evenly across installments", () => {
    const r = computeCalculatorResult({
      purchasePrice: 0,
      salePrice: 1000000,
      discountType: "amount",
      discountValue: 0,
      taxPercent: 0,
      installmentCount: 4
    });
    expect(r.perInstallment).toBe(250000);
  });

  it("treats zero or invalid installment counts as a single installment", () => {
    const r = computeCalculatorResult({
      purchasePrice: 0,
      salePrice: 500000,
      discountType: "amount",
      discountValue: 0,
      taxPercent: 0,
      installmentCount: 0
    });
    expect(r.installments).toBe(1);
    expect(r.perInstallment).toBe(500000);
  });
});
