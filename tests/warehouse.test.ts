import { describe, expect, it } from "vitest";
import { CENTRAL_WAREHOUSE_ID, warehouseActions } from "@/modules/warehouse/useWarehouse";
import { inventoryActions } from "@/modules/inventory/useInventory";
import { supplierActions } from "@/modules/suppliers/useSuppliers";

describe("warehouse", () => {
  it("rejects a transfer larger than available stock", () => {
    const [firstItem] = inventoryActions.getState().items;
    const result = warehouseActions.transferStock({
      itemId: firstItem.id,
      fromWarehouseId: CENTRAL_WAREHOUSE_ID,
      toWarehouseId: "wh-2",
      quantity: firstItem.quantity + 1000
    });
    expect(result.ok).toBe(false);
  });

  it("moves stock from the central warehouse into a secondary warehouse", () => {
    const [firstItem] = inventoryActions.getState().items;
    const startingCentral = firstItem.quantity;
    const startingSecondary = warehouseActions.getStockQuantity("wh-2", firstItem.id);

    const result = warehouseActions.transferStock({
      itemId: firstItem.id,
      fromWarehouseId: CENTRAL_WAREHOUSE_ID,
      toWarehouseId: "wh-2",
      quantity: 1
    });

    expect(result.ok).toBe(true);
    expect(warehouseActions.getStockQuantity(CENTRAL_WAREHOUSE_ID, firstItem.id)).toBe(startingCentral - 1);
    expect(warehouseActions.getStockQuantity("wh-2", firstItem.id)).toBe(startingSecondary + 1);
  });

  it("applies a stocktake difference to the counted warehouse", () => {
    const [firstItem] = inventoryActions.getState().items;
    const systemQuantity = warehouseActions.getStockQuantity(CENTRAL_WAREHOUSE_ID, firstItem.id);

    warehouseActions.recordStocktake({
      warehouseId: CENTRAL_WAREHOUSE_ID,
      itemId: firstItem.id,
      countedQuantity: systemQuantity + 2,
      note: "شمارش تست"
    });

    expect(warehouseActions.getStockQuantity(CENTRAL_WAREHOUSE_ID, firstItem.id)).toBe(systemQuantity + 2);
  });

  it("records a defective-stock entry and reduces stock accordingly", () => {
    const [firstItem] = inventoryActions.getState().items;
    const before = warehouseActions.getStockQuantity(CENTRAL_WAREHOUSE_ID, firstItem.id);

    warehouseActions.recordDefective({
      itemId: firstItem.id,
      warehouseId: CENTRAL_WAREHOUSE_ID,
      quantity: 1,
      reason: "شکستگی تست"
    });

    expect(warehouseActions.getStockQuantity(CENTRAL_WAREHOUSE_ID, firstItem.id)).toBe(before - 1);
  });

  it("returns increase central warehouse stock", () => {
    const [firstItem] = inventoryActions.getState().items;
    const before = warehouseActions.getStockQuantity(CENTRAL_WAREHOUSE_ID, firstItem.id);

    warehouseActions.recordReturn({
      itemId: firstItem.id,
      quantity: 1,
      reason: "مرجوعی تست",
      refunded: true
    });

    expect(warehouseActions.getStockQuantity(CENTRAL_WAREHOUSE_ID, firstItem.id)).toBe(before + 1);
  });

  it("receivePurchase increases warehouse stock and books the purchase against the chosen supplier", () => {
    const [firstItem] = inventoryActions.getState().items;
    const [firstSupplier] = supplierActions.getState().suppliers;
    const stockBefore = warehouseActions.getStockQuantity(CENTRAL_WAREHOUSE_ID, firstItem.id);
    const balanceBefore = firstSupplier.balance;

    const result = warehouseActions.receivePurchase({
      warehouseId: CENTRAL_WAREHOUSE_ID,
      itemId: firstItem.id,
      quantity: 5,
      supplierId: firstSupplier.id,
      unitPrice: 100000,
      paid: false
    });

    expect(result.ok).toBe(true);
    expect(warehouseActions.getStockQuantity(CENTRAL_WAREHOUSE_ID, firstItem.id)).toBe(stockBefore + 5);
    const updatedSupplier = supplierActions.getState().suppliers.find((s) => s.id === firstSupplier.id)!;
    // Unpaid (نسیه) purchase — the amount is added to what's owed to the supplier.
    expect(updatedSupplier.balance).toBe(balanceBefore + 500000);
  });

  it("receivePurchase rejects an unknown supplier", () => {
    const [firstItem] = inventoryActions.getState().items;
    const result = warehouseActions.receivePurchase({
      warehouseId: CENTRAL_WAREHOUSE_ID,
      itemId: firstItem.id,
      quantity: 1,
      supplierId: "does-not-exist",
      unitPrice: 10000,
      paid: true
    });
    expect(result.ok).toBe(false);
  });

  it("updateReservation changes customer name and quantity without affecting warehouse stock", () => {
    const [firstItem] = inventoryActions.getState().items;
    warehouseActions.createReservation({ itemId: firstItem.id, warehouseId: CENTRAL_WAREHOUSE_ID, customerName: "مشتری اول", quantity: 2 });
    const created = warehouseActions.getState().reservations[warehouseActions.getState().reservations.length - 1];
    const stockBefore = warehouseActions.getStockQuantity(CENTRAL_WAREHOUSE_ID, firstItem.id);

    warehouseActions.updateReservation(created.id, { customerName: "مشتری دوم", quantity: 5 });
    const updated = warehouseActions.getState().reservations.find((r) => r.id === created.id)!;
    expect(updated.customerName).toBe("مشتری دوم");
    expect(updated.quantity).toBe(5);
    expect(warehouseActions.getStockQuantity(CENTRAL_WAREHOUSE_ID, firstItem.id)).toBe(stockBefore);
  });

  it("deleteReservation removes the record entirely", () => {
    const [firstItem] = inventoryActions.getState().items;
    warehouseActions.createReservation({ itemId: firstItem.id, warehouseId: CENTRAL_WAREHOUSE_ID, customerName: "مشتری حذفی", quantity: 1 });
    const created = warehouseActions.getState().reservations[warehouseActions.getState().reservations.length - 1];

    warehouseActions.deleteReservation(created.id);
    expect(warehouseActions.getState().reservations.find((r) => r.id === created.id)).toBeUndefined();
  });
});
