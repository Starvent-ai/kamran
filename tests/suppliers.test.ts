import { describe, expect, it } from "vitest";
import { supplierActions } from "@/modules/suppliers/useSuppliers";

describe("suppliers", () => {
  it("increases supplier balance for an unpaid (credit) purchase", () => {
    const [firstSupplier] = supplierActions.getState().suppliers;
    const startingBalance = firstSupplier.balance;

    supplierActions.recordPurchase({
      supplierId: firstSupplier.id,
      itemDescription: "قطعه تست",
      amount: 300000,
      paid: false
    });

    const updated = supplierActions.getState().suppliers.find((s) => s.id === firstSupplier.id);
    expect(updated?.balance).toBe(startingBalance + 300000);
  });

  it("does not change balance for a paid purchase", () => {
    const [firstSupplier] = supplierActions.getState().suppliers;
    const startingBalance = firstSupplier.balance;

    supplierActions.recordPurchase({
      supplierId: firstSupplier.id,
      itemDescription: "قطعه نقدی تست",
      amount: 150000,
      paid: true
    });

    const updated = supplierActions.getState().suppliers.find((s) => s.id === firstSupplier.id);
    expect(updated?.balance).toBe(startingBalance);
  });

  it("reduces balance when a settlement is recorded", () => {
    const [firstSupplier] = supplierActions.getState().suppliers;
    const startingBalance = firstSupplier.balance;

    supplierActions.settleBalance(firstSupplier.id, 100000);

    const updated = supplierActions.getState().suppliers.find((s) => s.id === firstSupplier.id);
    expect(updated?.balance).toBe(startingBalance - 100000);
  });
});
