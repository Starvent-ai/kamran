import { describe, expect, it } from "vitest";
import { printRequestActions } from "@/state/printRequestStore";

describe("printRequestStore", () => {
  it("holds the requested sale id until it is cleared", () => {
    printRequestActions.requestInvoicePrint("sale-123");
    expect(printRequestActions.getState().pendingSaleId).toBe("sale-123");

    printRequestActions.clearPendingSaleId();
    expect(printRequestActions.getState().pendingSaleId).toBeNull();
  });

  it("holds the requested reservation id until it is cleared, independently of the sale channel", () => {
    printRequestActions.requestInvoicePrint("sale-abc");
    printRequestActions.requestReservationPrint("rsv-123");
    expect(printRequestActions.getState().pendingReservationId).toBe("rsv-123");
    expect(printRequestActions.getState().pendingSaleId).toBe("sale-abc");

    printRequestActions.clearPendingReservationId();
    expect(printRequestActions.getState().pendingReservationId).toBeNull();
    expect(printRequestActions.getState().pendingSaleId).toBe("sale-abc");
  });
});
