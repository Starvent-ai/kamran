export type DiscountType = "amount" | "percent";

export interface CalculatorInput {
  purchasePrice: number;
  salePrice: number;
  discountType: DiscountType;
  discountValue: number;
  taxPercent: number;
  installmentCount: number;
}

export interface CalculatorResult {
  grossProfit: number;
  profitPercent: number;
  discountAmount: number;
  priceAfterDiscount: number;
  taxAmount: number;
  finalPrice: number;
  perInstallment: number;
  installments: number;
}

export function computeCalculatorResult(input: CalculatorInput): CalculatorResult {
  const purchase = input.purchasePrice;
  const sale = input.salePrice;
  const installments = Math.max(1, Math.round(input.installmentCount) || 1);

  const grossProfit = sale - purchase;
  const profitPercent = purchase > 0 ? (grossProfit / purchase) * 100 : 0;

  const discountAmount =
    input.discountType === "percent" ? (sale * input.discountValue) / 100 : input.discountValue;
  const priceAfterDiscount = Math.max(0, sale - discountAmount);

  const taxAmount = (priceAfterDiscount * input.taxPercent) / 100;
  const finalPrice = priceAfterDiscount + taxAmount;
  const perInstallment = finalPrice / installments;

  return { grossProfit, profitPercent, discountAmount, priceAfterDiscount, taxAmount, finalPrice, perInstallment, installments };
}
