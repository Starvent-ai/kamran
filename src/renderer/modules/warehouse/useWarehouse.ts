import { createStore } from "@/state/createStore";
import { inventoryActions, useInventory } from "@/modules/inventory/useInventory";
import { supplierActions, useSuppliers } from "@/modules/suppliers/useSuppliers";
import type {
  DefectiveStockEntry,
  PaymentMethod,
  StockReservation,
  StockReturnEntry,
  StockTransfer,
  StocktakeEntry,
  Warehouse,
  WarehouseStock
} from "@shared/types";
import { generateId } from "@/lib/id";

export const CENTRAL_WAREHOUSE_ID = "wh-central";

interface WarehouseState {
  warehouses: Warehouse[];
  stock: WarehouseStock[];
  transfers: StockTransfer[];
  stocktakes: StocktakeEntry[];
  reservations: StockReservation[];
  defective: DefectiveStockEntry[];
  returns: StockReturnEntry[];
}

const seedWarehouses: Warehouse[] = [
  { id: CENTRAL_WAREHOUSE_ID, name: "انبار مرکزی", address: "" },
  { id: "wh-2", name: "انبار شعبهٔ دوم", address: "" }
];

const warehouseStore = createStore<WarehouseState>(
  {
    warehouses: seedWarehouses,
    stock: [],
    transfers: [],
    stocktakes: [],
    reservations: [],
    defective: [],
    returns: []
  },
  "data-warehouse"
);

function createWarehouse(name: string, address: string): void {
  const warehouse: Warehouse = { id: generateId("wh"), name, address };
  warehouseStore.setState((prev) => ({ ...prev, warehouses: [...prev.warehouses, warehouse] }));
}

function getStockQuantity(warehouseId: string, itemId: string): number {
  if (warehouseId === CENTRAL_WAREHOUSE_ID) {
    return inventoryActions.getState().items.find((i) => i.id === itemId)?.quantity ?? 0;
  }
  const state = warehouseStore.getState();
  return state.stock.find((s) => s.warehouseId === warehouseId && s.itemId === itemId)?.quantity ?? 0;
}

function setNonCentralStock(warehouseId: string, itemId: string, quantity: number): void {
  warehouseStore.setState((prev) => {
    const exists = prev.stock.some((s) => s.warehouseId === warehouseId && s.itemId === itemId);
    const nextStock = exists
      ? prev.stock.map((s) =>
          s.warehouseId === warehouseId && s.itemId === itemId ? { ...s, quantity: Math.max(0, quantity) } : s
        )
      : [...prev.stock, { warehouseId, itemId, quantity: Math.max(0, quantity) }];
    return { ...prev, stock: nextStock };
  });
}

function adjustStock(warehouseId: string, itemId: string, delta: number): void {
  if (warehouseId === CENTRAL_WAREHOUSE_ID) {
    inventoryActions.adjustQuantity(itemId, delta);
  } else {
    setNonCentralStock(warehouseId, itemId, getStockQuantity(warehouseId, itemId) + delta);
  }
}

interface ReceivePurchaseInput {
  warehouseId: string;
  itemId: string;
  quantity: number;
  /** "خرید از" — always the selected supplier's own record, never free
   *  text, so this can't drift from the supplier's actual name/debt. */
  supplierId: string;
  unitPrice: number;
  paid: boolean;
  paymentMethod?: PaymentMethod;
}

/** Records a purchase received into a warehouse: increases stock there and
 *  books the purchase against the chosen supplier (balance + accounting),
 *  reusing suppliers' own recordPurchase so there's only one place that
 *  logic lives. */
function receivePurchase(input: ReceivePurchaseInput): { ok: boolean; error?: string } {
  if (input.quantity <= 0) {
    return { ok: false, error: "تعداد باید بزرگ‌تر از صفر باشد." };
  }
  const item = inventoryActions.getState().items.find((i) => i.id === input.itemId);
  if (!item) {
    return { ok: false, error: "کالای انتخاب‌شده یافت نشد." };
  }
  const supplier = supplierActions.getState().suppliers.find((s) => s.id === input.supplierId);
  if (!supplier) {
    return { ok: false, error: "تأمین‌کننده انتخاب‌شده یافت نشد." };
  }

  adjustStock(input.warehouseId, input.itemId, input.quantity);
  supplierActions.recordPurchase({
    supplierId: input.supplierId,
    itemDescription: `${item.name} × ${input.quantity} عدد`,
    amount: input.unitPrice * input.quantity,
    paid: input.paid,
    paymentMethod: input.paymentMethod
  });

  return { ok: true };
}

interface TransferInput {
  itemId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
}

function transferStock(input: TransferInput): { ok: boolean; error?: string } {
  if (input.fromWarehouseId === input.toWarehouseId) return { ok: false, error: "مبدأ و مقصد یکسان است" };
  if (input.quantity <= 0) return { ok: false, error: "تعداد باید بیشتر از صفر باشد" };
  const available = getStockQuantity(input.fromWarehouseId, input.itemId);
  if (available < input.quantity) return { ok: false, error: "موجودی انبار مبدأ کافی نیست" };

  adjustStock(input.fromWarehouseId, input.itemId, -input.quantity);
  adjustStock(input.toWarehouseId, input.itemId, input.quantity);

  const transfer: StockTransfer = {
    ...input,
    id: generateId("trf"),
    date: new Date().toISOString().slice(0, 10)
  };
  warehouseStore.setState((prev) => ({ ...prev, transfers: [...prev.transfers, transfer] }));
  return { ok: true };
}

interface StocktakeInput {
  warehouseId: string;
  itemId: string;
  countedQuantity: number;
  note: string;
}

function recordStocktake(input: StocktakeInput): void {
  const systemQuantity = getStockQuantity(input.warehouseId, input.itemId);
  const difference = input.countedQuantity - systemQuantity;

  if (input.warehouseId === CENTRAL_WAREHOUSE_ID) {
    inventoryActions.adjustQuantity(input.itemId, difference);
  } else {
    setNonCentralStock(input.warehouseId, input.itemId, input.countedQuantity);
  }

  const entry: StocktakeEntry = {
    ...input,
    id: generateId("stk"),
    systemQuantity,
    difference,
    date: new Date().toISOString().slice(0, 10)
  };
  warehouseStore.setState((prev) => ({ ...prev, stocktakes: [...prev.stocktakes, entry] }));
}

interface ReservationInput {
  itemId: string;
  warehouseId: string;
  customerName: string;
  quantity: number;
}

function createReservation(input: ReservationInput): void {
  const reservation: StockReservation = {
    ...input,
    id: generateId("rsv"),
    status: "رزرو شده",
    createdAt: new Date().toISOString()
  };
  warehouseStore.setState((prev) => ({ ...prev, reservations: [...prev.reservations, reservation] }));
}

function updateReservation(reservationId: string, updates: { customerName: string; quantity: number }): void {
  warehouseStore.setState((prev) => ({
    ...prev,
    reservations: prev.reservations.map((r) => (r.id === reservationId ? { ...r, ...updates } : r))
  }));
}

function deleteReservation(reservationId: string): void {
  warehouseStore.setState((prev) => ({
    ...prev,
    reservations: prev.reservations.filter((r) => r.id !== reservationId)
  }));
}

function updateReservationStatus(reservationId: string, status: StockReservation["status"]): void {
  warehouseStore.setState((prev) => ({
    ...prev,
    reservations: prev.reservations.map((r) => (r.id === reservationId ? { ...r, status } : r))
  }));
}

interface DefectiveInput {
  itemId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
}

function recordDefective(input: DefectiveInput): void {
  adjustStock(input.warehouseId, input.itemId, -input.quantity);
  const entry: DefectiveStockEntry = {
    ...input,
    id: generateId("def"),
    date: new Date().toISOString().slice(0, 10)
  };
  warehouseStore.setState((prev) => ({ ...prev, defective: [...prev.defective, entry] }));
}

interface ReturnInput {
  itemId: string;
  quantity: number;
  reason: string;
  refunded: boolean;
}

function recordReturn(input: ReturnInput): void {
  // Returned goods go back to the central warehouse by default.
  inventoryActions.adjustQuantity(input.itemId, input.quantity);
  const entry: StockReturnEntry = {
    ...input,
    id: generateId("ret"),
    date: new Date().toISOString().slice(0, 10)
  };
  warehouseStore.setState((prev) => ({ ...prev, returns: [...prev.returns, entry] }));
}

export function useWarehouse() {
  const state = warehouseStore.useStore();
  // Subscribed (not a one-off snapshot) so this view re-renders whenever
  // central-warehouse stock changes from any module, e.g. a sale in Sales.
  const { items: inventoryItems } = useInventory();
  const { suppliers } = useSuppliers();

  return {
    warehouses: state.warehouses,
    stock: state.stock,
    transfers: state.transfers,
    stocktakes: state.stocktakes,
    reservations: state.reservations,
    defective: state.defective,
    returns: state.returns,
    inventoryItems,
    suppliers,
    getStockQuantity,
    createWarehouse,
    transferStock,
    recordStocktake,
    createReservation,
    updateReservation,
    deleteReservation,
    updateReservationStatus,
    recordDefective,
    recordReturn,
    receivePurchase
  };
}

export const warehouseActions = {
  createWarehouse,
  transferStock,
  recordStocktake,
  createReservation,
  updateReservation,
  deleteReservation,
  updateReservationStatus,
  recordDefective,
  recordReturn,
  receivePurchase,
  getStockQuantity,
  getState: warehouseStore.getState
};
