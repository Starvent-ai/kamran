import { describe, expect, it } from "vitest";
import { repairActions } from "@/modules/repairs/useRepairs";

describe("repairs", () => {
  it("creates a ticket with دریافت شده status regardless of what's passed in", () => {
    repairActions.createTicket({
      deviceModel: "تست موبایل",
      imei: "000",
      serialNumber: "SN-TEST",
      devicePassword: "",
      faultDescription: "تست خرابی",
      accessoriesReceived: "",
      priority: "عادی",
      technician: "تکنسین تست",
      customerId: null,
      customerName: "مشتری تست",
      deliveryDate: "2026-08-20",
      depositAmount: 0,
      mobilePhone: "",
      landlinePhone: "",
      nationalId: ""
    });

    const tickets = repairActions.getState().tickets;
    const created = tickets[tickets.length - 1];
    expect(created.status).toBe("دریافت شده");
    expect(created.partsUsed).toBe("");
    expect(created.laborFee).toBe(0);
  });

  it("records parts used and labor fee via updatePartsAndLabor without touching other fields", () => {
    repairActions.createTicket({
      deviceModel: "تست قطعات",
      imei: "111",
      serialNumber: "SN-PARTS",
      devicePassword: "",
      faultDescription: "تست",
      accessoriesReceived: "",
      priority: "عادی",
      technician: "تکنسین",
      customerId: null,
      customerName: "مشتری",
      deliveryDate: "2026-08-20",
      depositAmount: 0,
      mobilePhone: "",
      landlinePhone: "",
      nationalId: ""
    });
    const tickets = repairActions.getState().tickets;
    const created = tickets[tickets.length - 1];

    repairActions.updatePartsAndLabor(created.id, "باتری جدید", 200000);
    const updated = repairActions.getState().tickets.find((t) => t.id === created.id)!;
    expect(updated.partsUsed).toBe("باتری جدید");
    expect(updated.laborFee).toBe(200000);
    expect(updated.deviceModel).toBe("تست قطعات");
  });

  it("stores the receipt fields (deposit, phones, national ID) added for the printed repair receipt", () => {
    repairActions.createTicket({
      deviceModel: "تست رسید",
      imei: "333",
      serialNumber: "SN-RECEIPT",
      devicePassword: "",
      faultDescription: "تست",
      accessoriesReceived: "",
      priority: "عادی",
      technician: "تکنسین",
      customerId: null,
      customerName: "مشتری رسید",
      deliveryDate: "2026-08-20",
      depositAmount: 300000,
      mobilePhone: "09120000000",
      landlinePhone: "02100000000",
      nationalId: "1234567890"
    });

    const tickets = repairActions.getState().tickets;
    const created2 = tickets[tickets.length - 1];
    expect(created2.depositAmount).toBe(300000);
    expect(created2.mobilePhone).toBe("09120000000");
    expect(created2.landlinePhone).toBe("02100000000");
    expect(created2.nationalId).toBe("1234567890");
  });
});
