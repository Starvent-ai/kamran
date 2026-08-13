import { describe, expect, it } from "vitest";
import { inventoryActions } from "@/modules/inventory/useInventory";

describe("inventory edit/delete", () => {
  it("updates an item's fields in place", () => {
    inventoryActions.addItem({
      name: "کالای تست",
      category: "قاب",
      sku: "TEST-SKU-1",
      quantity: 5,
      purchasePrice: 1000,
      salePrice: 2000,
      lowStockThreshold: 1
    });
    const list = inventoryActions.getState().items;
    const created = list[list.length - 1];

    inventoryActions.updateItem(created.id, { name: "نام جدید", salePrice: 3000 });

    const updated = inventoryActions.getState().items.find((i) => i.id === created.id);
    expect(updated?.name).toBe("نام جدید");
    expect(updated?.salePrice).toBe(3000);
    expect(updated?.sku).toBe("TEST-SKU-1");
  });

  it("removes an item entirely on delete", () => {
    inventoryActions.addItem({
      name: "کالای حذفی",
      category: "قاب",
      sku: "TEST-SKU-2",
      quantity: 1,
      purchasePrice: 500,
      salePrice: 900,
      lowStockThreshold: 1
    });
    const list = inventoryActions.getState().items;
    const created = list[list.length - 1];

    inventoryActions.deleteItem(created.id);

    expect(inventoryActions.getState().items.find((i) => i.id === created.id)).toBeUndefined();
  });
});
