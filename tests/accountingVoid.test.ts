import { describe, expect, it } from "vitest";
import { accountingActions } from "@/modules/accounting/useAccounting";

describe("accounting void (no hard delete anywhere)", () => {
  it("a voided transaction stays in the list but is excluded from totals", () => {
    accountingActions.recordTransaction({
      type: "درآمد",
      account: "صندوق",
      category: "فروش",
      amount: 300000,
      description: "فروش برای تست ابطال"
    });
    const transactions = accountingActions.getState().transactions;
    const created = transactions[transactions.length - 1];

    const before = accountingActions.getState();
    const cashBeforeVoid = before.transactions
      .filter((t) => !t.voided && t.account === "صندوق")
      .reduce((sum, t) => sum + (t.type === "درآمد" ? t.amount : -t.amount), 0);

    accountingActions.voidTransaction(created.id);

    const after = accountingActions.getState();
    // Record still exists — voiding is the ONLY reversal mechanism, never a delete.
    expect(after.transactions.find((t) => t.id === created.id)).toBeDefined();
    expect(after.transactions.find((t) => t.id === created.id)?.voided).toBe(true);

    const cashAfterVoid = after.transactions
      .filter((t) => !t.voided && t.account === "صندوق")
      .reduce((sum, t) => sum + (t.type === "درآمد" ? t.amount : -t.amount), 0);
    expect(cashAfterVoid).toBe(cashBeforeVoid - 300000);
  });
});
