import { describe, expect, it } from "vitest";
import { getNextDueDate } from "@/modules/installments/useInstallments";
import { getContentSuggestionForHour } from "@/lib/contentSuggestion";
import type { InstallmentContract } from "@shared/types";

function makeContract(overrides: Partial<InstallmentContract> = {}): InstallmentContract {
  return {
    id: "con-test",
    companyId: null,
    customerName: "تست",
    itemDescription: "تست",
    totalAmount: 1000000,
    downPayment: 0,
    installmentCount: 5,
    monthlyAmount: 200000,
    startDate: "2026-01-15",
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

describe("getNextDueDate", () => {
  it("returns startDate + 1 month when nothing has been paid yet", () => {
    const contract = makeContract({ startDate: "2026-01-15" });
    const due = getNextDueDate(contract, 0);
    expect(due?.getFullYear()).toBe(2026);
    expect(due?.getMonth()).toBe(1); // February (0-indexed)
    expect(due?.getDate()).toBe(15);
  });

  it("advances one month per installment already paid", () => {
    const contract = makeContract({ startDate: "2026-01-15" });
    const due = getNextDueDate(contract, 3);
    expect(due?.getMonth()).toBe(4); // May
  });

  it("returns null once the contract is no longer در جریان", () => {
    const contract = makeContract({ status: "تسویه شده" });
    expect(getNextDueDate(contract, 0)).toBeNull();
  });
});

describe("getContentSuggestionForHour", () => {
  it("returns a suggestion inside a defined slot", () => {
    expect(getContentSuggestionForHour(18)?.contentType).toContain("احساسی");
  });

  it("returns null outside all defined slots", () => {
    expect(getContentSuggestionForHour(3)).toBeNull();
  });
});
