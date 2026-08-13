import { describe, expect, it } from "vitest";
import { salesActions } from "@/modules/sales/useSales";
import { inventoryActions } from "@/modules/inventory/useInventory";

describe("recordSale", () => {
  it("rejects a sale for an unknown item", () => {
    const result = salesActions.recordSale({ itemId: "does-not-exist", customerId: null, quantity: 1 ,
      channel: "حضوری",
      paymentMethod: "نقد"});
    expect(result.ok).toBe(false);
  });

  it("rejects a non-positive quantity", () => {
    const [firstItem] = inventoryActions.getState().items;
    const result = salesActions.recordSale({ itemId: firstItem.id, customerId: null, quantity: 0 ,
      channel: "حضوری",
      paymentMethod: "نقد"});
    expect(result.ok).toBe(false);
  });

  it("rejects a sale that exceeds available stock", () => {
    const [firstItem] = inventoryActions.getState().items;
    const result = salesActions.recordSale({
      itemId: firstItem.id,
      customerId: null,
      quantity: firstItem.quantity + 1000
    ,
      channel: "حضوری",
      paymentMethod: "نقد"});
    expect(result.ok).toBe(false);
  });

  it("records a valid sale and decrements inventory quantity", () => {
    const [firstItem] = inventoryActions.getState().items;
    const startingQuantity = firstItem.quantity;

    const result = salesActions.recordSale({ itemId: firstItem.id, customerId: null, quantity: 1 ,
      channel: "حضوری",
      paymentMethod: "نقد"});
    expect(result.ok).toBe(true);

    const updatedItem = inventoryActions
      .getState()
      .items.find((i) => i.id === firstItem.id);
    expect(updatedItem?.quantity).toBe(startingQuantity - 1);

    const sales = salesActions.getState().sales;
    expect(sales[sales.length - 1]?.itemId).toBe(firstItem.id);
  });
});
