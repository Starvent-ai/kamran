import { describe, expect, it } from "vitest";
import { installmentActions } from "@/modules/installments/useInstallments";

describe("installments", () => {
  it("computes the per-installment amount from (total - down payment) / count", () => {
    installmentActions.createContract({
      companyId: null,
      customerName: "مشتری تست",
      itemDescription: "گوشی تست",
      totalAmount: 12000000,
      downPayment: 2000000,
      installmentCount: 5,
      startDate: "2026-08-01",
      guaranteeNote: "",
      checkSerialNumber: "",
      registeredWithAcceptor: false
    });

    const contracts = installmentActions.getState().contracts;
    const created = contracts[contracts.length - 1];
    expect(created.monthlyAmount).toBe(2000000);
    expect(created.status).toBe("در جریان");
  });

  it("marks a contract as تسویه شده once every installment is paid", () => {
    installmentActions.createContract({
      companyId: null,
      customerName: "مشتری دو قسطی",
      itemDescription: "قاب تست",
      totalAmount: 200000,
      downPayment: 0,
      installmentCount: 2,
      startDate: "2026-08-01",
      guaranteeNote: "",
      checkSerialNumber: "",
      registeredWithAcceptor: false
    });

    const contracts = installmentActions.getState().contracts;
    const created = contracts[contracts.length - 1];

    installmentActions.recordPayment(created.id, 100000);
    expect(installmentActions.getState().contracts.find((c) => c.id === created.id)?.status).toBe("در جریان");

    installmentActions.recordPayment(created.id, 100000);
    expect(installmentActions.getState().contracts.find((c) => c.id === created.id)?.status).toBe("تسویه شده");
    expect(installmentActions.paidInstallmentCount(created.id)).toBe(2);
  });

  it("applies a fee percent to the remaining balance before splitting into installments", () => {
    installmentActions.createContract({
      companyId: null,
      customerName: "مشتری کارمزدی",
      itemDescription: "گوشی تست کارمزد",
      totalAmount: 10000000,
      downPayment: 1000000,
      installmentCount: 3,
      startDate: "2026-08-01",
      guaranteeNote: "",
      checkSerialNumber: "",
      registeredWithAcceptor: false,
      feePercent: 10
    });

    const contracts = installmentActions.getState().contracts;
    const created = contracts[contracts.length - 1];
    // remaining = 10,000,000 - 1,000,000 = 9,000,000; fee 10% = 900,000
    expect(created.feeAmount).toBe(900000);
    expect(created.monthlyAmount).toBe(3300000);
  });

  it("defaults the fee percent to 0 (no change) when not provided", () => {
    installmentActions.createContract({
      companyId: null,
      customerName: "مشتری بدون کارمزد",
      itemDescription: "قاب تست بدون کارمزد",
      totalAmount: 500000,
      downPayment: 0,
      installmentCount: 5,
      startDate: "2026-08-01",
      guaranteeNote: "",
      checkSerialNumber: "",
      registeredWithAcceptor: false
    });

    const contracts = installmentActions.getState().contracts;
    const created = contracts[contracts.length - 1];
    expect(created.feePercent).toBe(0);
    expect(created.feeAmount).toBe(0);
    expect(created.monthlyAmount).toBe(100000);
  });
});
