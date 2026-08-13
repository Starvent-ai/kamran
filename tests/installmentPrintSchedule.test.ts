import { describe, expect, it } from "vitest";
import { buildInstallmentSchedule } from "@/modules/printing/Printing";
import type { InstallmentContract } from "@shared/types";

function makeContract(overrides: Partial<InstallmentContract> = {}): InstallmentContract {
  return {
    id: "con-print-test",
    companyId: null,
    customerName: "مشتری تست",
    itemDescription: "گوشی تست",
    totalAmount: 1000000,
    downPayment: 200000,
    installmentCount: 4,
    monthlyAmount: 200000,
    startDate: "2026-01-10",
    guaranteeNote: "",
    status: "در جریان",
    createdAt: new Date().toISOString(),
    feePercent: 0,
    feeAmount: 0,
    checkSerialNumber: "",
    registeredWithAcceptor: false,
    ...overrides
  };
}

describe("buildInstallmentSchedule", () => {
  it("produces one row per installment, each one month after the last", () => {
    const contract = makeContract({ installmentCount: 4, startDate: "2026-01-10" });
    const schedule = buildInstallmentSchedule(contract, 0);

    expect(schedule.length).toBe(4);
    expect(schedule.map((r) => r.installmentNumber)).toEqual([1, 2, 3, 4]);
    expect(schedule[0].dueDate.getMonth()).toBe(1); // February
    expect(schedule[3].dueDate.getMonth()).toBe(4); // May
    expect(schedule.every((r) => r.dueDate.getDate() === 10)).toBe(true);
  });

  it("marks exactly the paid installments (in order) as paid", () => {
    const contract = makeContract({ installmentCount: 4 });
    const schedule = buildInstallmentSchedule(contract, 2);

    expect(schedule.filter((r) => r.paid).map((r) => r.installmentNumber)).toEqual([1, 2]);
    expect(schedule.filter((r) => !r.paid).map((r) => r.installmentNumber)).toEqual([3, 4]);
  });

  it("uses the contract's monthly amount for every row", () => {
    const contract = makeContract({ monthlyAmount: 350000 });
    const schedule = buildInstallmentSchedule(contract, 0);
    expect(schedule.every((r) => r.amount === 350000)).toBe(true);
  });
});
