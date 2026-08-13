import { describe, expect, it } from "vitest";
import { customerActions } from "@/modules/customers/useCustomers";

describe("customers edit/delete", () => {
  it("updates a customer's fields in place", () => {
    customerActions.addCustomer({ fullName: "تست ویرایش", phone: "09120000000", loyaltyTier: "عادی" });
    const list = customerActions.getState().customers;
    const created = list[list.length - 1];

    customerActions.updateCustomer(created.id, { fullName: "نام جدید", loyaltyTier: "طلایی" });

    const updated = customerActions.getState().customers.find((c) => c.id === created.id);
    expect(updated?.fullName).toBe("نام جدید");
    expect(updated?.loyaltyTier).toBe("طلایی");
    expect(updated?.phone).toBe("09120000000");
  });

  it("removes a customer entirely on delete", () => {
    customerActions.addCustomer({ fullName: "تست حذف", phone: "09121111111", loyaltyTier: "عادی" });
    const list = customerActions.getState().customers;
    const created = list[list.length - 1];

    customerActions.deleteCustomer(created.id);

    expect(customerActions.getState().customers.find((c) => c.id === created.id)).toBeUndefined();
  });
});
