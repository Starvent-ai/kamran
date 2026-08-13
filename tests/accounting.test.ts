import { describe, expect, it } from "vitest";
import { accountingActions } from "@/modules/accounting/useAccounting";

describe("accounting", () => {
  it("tracks separate cash and bank balances", () => {
    const before = accountingActions.getState().transactions.length;

    accountingActions.recordTransaction({
      type: "درآمد",
      account: "صندوق",
      category: "فروش",
      amount: 500000,
      description: "فروش نقدی تست"
    });
    accountingActions.recordTransaction({
      type: "هزینه",
      account: "بانک",
      category: "قبوض",
      amount: 120000,
      description: "قبض برق تست"
    });

    const state = accountingActions.getState();
    expect(state.transactions.length).toBe(before + 2);
  });

  it("records a check with initial status در جریان and allows status updates", () => {
    accountingActions.recordCheck({
      direction: "دریافتنی",
      payerOrPayee: "مشتری تست",
      amount: 1000000,
      dueDate: "2026-09-01"
    });
    const checks = accountingActions.getState().checks;
    const lastCheck = checks[checks.length - 1];
    expect(lastCheck?.status).toBe("در جریان");

    accountingActions.updateCheckStatus(lastCheck!.id, "وصول شده");
    const updated = accountingActions.getState().checks.find((c) => c.id === lastCheck!.id);
    expect(updated?.status).toBe("وصول شده");
  });
});
