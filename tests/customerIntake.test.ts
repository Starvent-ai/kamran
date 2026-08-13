import { describe, expect, it } from "vitest";
import { incomingCaptureActions } from "@/modules/notifications/useIncomingCaptures";
import { customerIntakeActions } from "@/state/customerIntakeStore";
import { customerActions } from "@/modules/customers/useCustomers";
import { navigationActions } from "@/state/navigationStore";

describe("phone capture -> new customer intake", () => {
  it("requests a new-customer form and navigates to Customers for an unrecognized number", () => {
    customerIntakeActions.getState(); // sanity: store is reachable

    incomingCaptureActions.addCapture("09309999999", "دستگاه (کیبورد)");

    expect(customerIntakeActions.getState().pendingPhone).toBe("09309999999");
    expect(navigationActions.getState().activeId).toBe("customers");
  });

  it("does NOT request a new-customer form when the number matches an existing customer", () => {
    customerActions.addCustomer({ fullName: "مشتری موجود", phone: "09301111111", loyaltyTier: "عادی" });
    customerIntakeActions.clearPendingPhone();
    navigationActions.goTo("dashboard");

    incomingCaptureActions.addCapture("09301111111", "دستگاه (کیبورد)");

    expect(customerIntakeActions.getState().pendingPhone).toBeNull();
    expect(navigationActions.getState().activeId).toBe("dashboard");
  });

  it("clearing the pending phone resets it to null", () => {
    incomingCaptureActions.addCapture("09308888888", "دستگاه (کیبورد)");
    expect(customerIntakeActions.getState().pendingPhone).not.toBeNull();

    customerIntakeActions.clearPendingPhone();
    expect(customerIntakeActions.getState().pendingPhone).toBeNull();
  });
});
