import { createStore } from "@/state/createStore";
import type { PaymentMethod, SaleChannel, SaleRecord } from "@shared/types";
import { inventoryActions } from "@/modules/inventory/useInventory";
import { customerActions } from "@/modules/customers/useCustomers";
import { accountingActions } from "@/modules/accounting/useAccounting";
import { generateId } from "@/lib/id";

interface SalesState {
  sales: SaleRecord[];
}

const salesStore = createStore<SalesState>({ sales: [] }, "data-sales");

interface RecordSaleInput {
  itemId: string;
  customerId: string | null;
  quantity: number;
  channel: SaleChannel;
  paymentMethod: PaymentMethod;
}

/** Records a sale and keeps inventory + customer purchase counts in sync. */
function recordSale(input: RecordSaleInput): { ok: true; saleId: string } | { ok: false; error: string } {
  const item = inventoryActions.getState().items.find((i) => i.id === input.itemId);
  if (!item) {
    return { ok: false, error: "کالای انتخاب‌شده یافت نشد." };
  }
  if (input.quantity <= 0) {
    return { ok: false, error: "تعداد باید بزرگ‌تر از صفر باشد." };
  }
  if (item.quantity < input.quantity) {
    return { ok: false, error: `موجودی کافی نیست. موجودی فعلی: ${item.quantity}` };
  }

  const total = item.salePrice * input.quantity;
  const record: SaleRecord = {
    id: generateId("sale"),
    itemId: item.id,
    itemName: item.name,
    customerId: input.customerId,
    quantity: input.quantity,
    unitPrice: item.salePrice,
    total,
    channel: input.channel,
    paymentMethod: input.paymentMethod,
    createdAt: new Date().toISOString()
  };

  salesStore.setState((prev) => ({ sales: [...prev.sales, record] }));
  inventoryActions.adjustQuantity(item.id, -input.quantity);
  if (input.customerId) {
    customerActions.incrementPurchases(input.customerId);
  }
  accountingActions.recordTransaction({
    type: "درآمد",
    account: "صندوق",
    category: "فروش",
    paymentMethod: input.paymentMethod,
    amount: total,
    description: `فروش ${item.name} × ${input.quantity} (${input.channel})`
  });

  return { ok: true, saleId: record.id };
}

export function useSales() {
  const state = salesStore.useStore();
  return { sales: state.sales, recordSale };
}

export const salesActions = { recordSale, getState: salesStore.getState };
