import { describe, expect, it } from "vitest";
import { salesActions } from "@/modules/sales/useSales";
import { inventoryActions } from "@/modules/inventory/useInventory";
import { supplierActions } from "@/modules/suppliers/useSuppliers";
import { repairActions } from "@/modules/repairs/useRepairs";
import { accountingActions } from "@/modules/accounting/useAccounting";
import { installmentActions } from "@/modules/installments/useInstallments";
import { collateralActions } from "@/modules/collateral/useCollateral";

describe("module chaining (single entry, auto-propagated)", () => {
  it("a sale automatically creates a matching accounting income entry", () => {
    const [item] = inventoryActions.getState().items;
    const before = accountingActions.getState().transactions.length;

    const result = salesActions.recordSale({ itemId: item.id, customerId: null, quantity: 1 ,
      channel: "حضوری",
      paymentMethod: "نقد"});
    expect(result.ok).toBe(true);

    const transactions = accountingActions.getState().transactions;
    expect(transactions.length).toBe(before + 1);
    const last = transactions[transactions.length - 1];
    expect(last.type).toBe("درآمد");
    expect(last.category).toBe("فروش");
    expect(last.amount).toBe(item.salePrice);
  });

  it("a cash supplier purchase immediately creates an accounting expense", () => {
    const [supplier] = supplierActions.getState().suppliers;
    const before = accountingActions.getState().transactions.length;

    supplierActions.recordPurchase({ supplierId: supplier.id, itemDescription: "تست", amount: 50000, paid: true });

    const transactions = accountingActions.getState().transactions;
    expect(transactions.length).toBe(before + 1);
    expect(transactions[transactions.length - 1].type).toBe("هزینه");
  });

  it("a credit (نسیه) supplier purchase does NOT create an expense until settled", () => {
    const [supplier] = supplierActions.getState().suppliers;
    const before = accountingActions.getState().transactions.length;

    supplierActions.recordPurchase({ supplierId: supplier.id, itemDescription: "نسیه تست", amount: 70000, paid: false });
    expect(accountingActions.getState().transactions.length).toBe(before);

    supplierActions.settleBalance(supplier.id, 70000);
    expect(accountingActions.getState().transactions.length).toBe(before + 1);
  });

  it("delivering a repair with a labor fee records income exactly once, even if delivered status is set twice", () => {
    repairActions.createTicket({
      deviceModel: "تست دستگاه",
      imei: "",
      serialNumber: "",
      devicePassword: "",
      faultDescription: "تست",
      accessoriesReceived: "",
      priority: "عادی",
      technician: "",
      customerId: null,
      customerName: "مشتری تست",
      deliveryDate: "2026-08-10",
      depositAmount: 0,
      mobilePhone: "",
      landlinePhone: "",
      nationalId: ""
    });
    const tickets = repairActions.getState().tickets;
    const ticket = tickets[tickets.length - 1];

    repairActions.updatePartsAndLabor(ticket.id, "باتری", 120000);

    const before = accountingActions.getState().transactions.length;
    repairActions.updateStatus(ticket.id, "تحویل داده شده");
    expect(accountingActions.getState().transactions.length).toBe(before + 1);

    // Setting the same status again must not double-count.
    repairActions.updateStatus(ticket.id, "تحویل داده شده");
    expect(accountingActions.getState().transactions.length).toBe(before + 1);
  });

  it("an installment contract's down payment and each payment are booked as income", () => {
    const before = accountingActions.getState().transactions.length;

    installmentActions.createContract({
      companyId: null,
      customerName: "مشتری زنجیره",
      itemDescription: "تست زنجیره",
      totalAmount: 1000000,
      downPayment: 300000,
      installmentCount: 2,
      startDate: "2026-08-01",
      guaranteeNote: "",
      checkSerialNumber: "",
      registeredWithAcceptor: false
    });
    expect(accountingActions.getState().transactions.length).toBe(before + 1);

    const contracts = installmentActions.getState().contracts;
    const created = contracts[contracts.length - 1];

    installmentActions.recordPayment(created.id, 350000);
    expect(accountingActions.getState().transactions.length).toBe(before + 2);

    const last = accountingActions.getState().transactions[accountingActions.getState().transactions.length - 1];
    expect(last.type).toBe("درآمد");
    expect(last.amount).toBe(350000);
  });

  it("seizing a collateral books income once; un-seizing it books an offsetting expense", () => {
    collateralActions.createCollateral({
      type: "چک",
      relatedTo: "پروندهٔ زنجیره",
      description: "چک زنجیره",
      guarantorName: "",
      buyerName: "",
      dueDate: "2026-09-01",
      amount: 400000
    });
    const records = collateralActions.getState().records;
    const created = records[records.length - 1];

    const before = accountingActions.getState().transactions.length;
    collateralActions.updateStatus(created.id, "ضبط شده");
    expect(accountingActions.getState().transactions.length).toBe(before + 1);
    let last = accountingActions.getState().transactions[accountingActions.getState().transactions.length - 1];
    expect(last.type).toBe("درآمد");
    expect(last.amount).toBe(400000);

    // Re-setting the same status again must not double-count.
    collateralActions.updateStatus(created.id, "ضبط شده");
    expect(accountingActions.getState().transactions.length).toBe(before + 1);

    // Correcting the seizure books an offsetting expense of the same amount.
    collateralActions.updateStatus(created.id, "بازگردانده شده");
    expect(accountingActions.getState().transactions.length).toBe(before + 2);
    last = accountingActions.getState().transactions[accountingActions.getState().transactions.length - 1];
    expect(last.type).toBe("هزینه");
    expect(last.amount).toBe(400000);
  });

  it("adding a new inventory item books a matching خرید کالا expense by default", () => {
    const before = accountingActions.getState().transactions.length;

    inventoryActions.addItem({
      name: "کالای زنجیره تست",
      category: "قاب",
      sku: "CHAIN-TEST-1",
      quantity: 3,
      purchasePrice: 100000,
      salePrice: 150000,
      lowStockThreshold: 1
    });

    expect(accountingActions.getState().transactions.length).toBe(before + 1);
    const last = accountingActions.getState().transactions[accountingActions.getState().transactions.length - 1];
    expect(last.type).toBe("هزینه");
    expect(last.category).toBe("خرید کالا");
    expect(last.amount).toBe(300000);
  });

  it("adding a new inventory item with recordAsPurchase=false does not touch accounting", () => {
    const before = accountingActions.getState().transactions.length;

    inventoryActions.addItem(
      {
        name: "کالای وارداتی کاتالوگ",
        category: "قاب",
        sku: "CHAIN-TEST-2",
        quantity: 10,
        purchasePrice: 50000,
        salePrice: 80000,
        lowStockThreshold: 1
      },
      false
    );

    expect(accountingActions.getState().transactions.length).toBe(before);
  });

  it("threads the chosen payment method into the accounting entry for a sale, an installment payment, and a supplier settlement", () => {
    // Sale
    const [item] = inventoryActions.getState().items;
    const saleResult = salesActions.recordSale({
      itemId: item.id,
      customerId: null,
      quantity: 1,
      channel: "اینستاگرام",
      paymentMethod: "کارت‌خوان (پوز)"
    });
    expect(saleResult.ok).toBe(true);
    let last = accountingActions.getState().transactions[accountingActions.getState().transactions.length - 1];
    expect(last.paymentMethod).toBe("کارت‌خوان (پوز)");

    // Installment payment
    installmentActions.createContract({
      companyId: null,
      customerName: "مشتری روش پرداخت",
      itemDescription: "تست روش پرداخت",
      totalAmount: 500000,
      downPayment: 0,
      installmentCount: 1,
      startDate: "2026-08-01",
      guaranteeNote: "",
      checkSerialNumber: "",
      registeredWithAcceptor: false
    });
    const contracts = installmentActions.getState().contracts;
    const contract = contracts[contracts.length - 1];
    installmentActions.recordPayment(contract.id, 500000, "انتقال وجه");
    last = accountingActions.getState().transactions[accountingActions.getState().transactions.length - 1];
    expect(last.paymentMethod).toBe("انتقال وجه");

    // Supplier settlement
    const [supplier] = supplierActions.getState().suppliers;
    supplierActions.recordPurchase({ supplierId: supplier.id, itemDescription: "قطعه تست روش پرداخت", amount: 200000, paid: false });
    supplierActions.settleBalance(supplier.id, 200000, "کارت‌خوان (پوز)");
    last = accountingActions.getState().transactions[accountingActions.getState().transactions.length - 1];
    expect(last.paymentMethod).toBe("کارت‌خوان (پوز)");
  });
});
