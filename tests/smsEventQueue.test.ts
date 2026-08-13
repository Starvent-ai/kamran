import { describe, expect, it } from "vitest";
import { smsEventQueueActions } from "@/modules/notifications/useSmsEventQueue";
import { customerActions } from "@/modules/customers/useCustomers";
import { repairActions } from "@/modules/repairs/useRepairs";

describe("SMS event queue", () => {
  it("ignores an event with no phone number — nothing to text", () => {
    const before = smsEventQueueActions.getState().events.length;
    smsEventQueueActions.queueEvent({ eventLabel: "تست", phone: "", customerName: "تست", category: "خوشامدگویی" });
    expect(smsEventQueueActions.getState().events.length).toBe(before);
  });

  it("queues an event and it shows up as pending until handled", () => {
    smsEventQueueActions.queueEvent({
      eventLabel: "رویداد تست",
      phone: "09121111111",
      customerName: "مشتری تست",
      category: "خوشامدگویی"
    });
    const events = smsEventQueueActions.getState().events;
    const last = events[0]; // newest first
    expect(last.handled).toBe(false);

    smsEventQueueActions.markHandled(last.id);
    const updated = smsEventQueueActions.getState().events.find((e) => e.id === last.id);
    expect(updated?.handled).toBe(true);
    // Handled events are kept (for history), not deleted.
    expect(smsEventQueueActions.getState().events.some((e) => e.id === last.id)).toBe(true);
  });

  it("registering a new customer with a phone automatically queues a welcome event", () => {
    const before = smsEventQueueActions.getState().events.length;
    customerActions.addCustomer({ fullName: "مشتری رویداد تست", phone: "09122222222", loyaltyTier: "عادی" });
    const events = smsEventQueueActions.getState().events;
    expect(events.length).toBe(before + 1);
    expect(events[0].category).toBe("خوشامدگویی");
    expect(events[0].phone).toBe("09122222222");
  });

  it("marking a repair completed (with a linked customer) queues a دستگاه آماده event", () => {
    customerActions.addCustomer({ fullName: "مشتری تعمیر رویداد", phone: "09123333333", loyaltyTier: "عادی" });
    const customer = customerActions.getState().customers.find((c) => c.phone === "09123333333")!;

    repairActions.createTicket({
      deviceModel: "دستگاه تست رویداد",
      imei: "",
      serialNumber: "",
      devicePassword: "",
      faultDescription: "تست",
      accessoriesReceived: "",
      priority: "عادی",
      technician: "",
      customerId: customer.id,
      customerName: customer.fullName,
      deliveryDate: "2026-08-10",
      depositAmount: 0,
      mobilePhone: "",
      landlinePhone: "",
      nationalId: ""
    });
    const tickets = repairActions.getState().tickets;
    const ticket = tickets[tickets.length - 1];

    const before = smsEventQueueActions.getState().events.length;
    repairActions.updateStatus(ticket.id, "تکمیل شده");

    const events = smsEventQueueActions.getState().events;
    expect(events.length).toBe(before + 1);
    expect(events[0].category).toBe("دستگاه آماده");
    expect(events[0].phone).toBe("09123333333");
  });
});
