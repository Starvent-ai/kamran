export interface AppInfo {
  version: string;
  platform: NodeJS.Platform;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  lowStockThreshold: number;
}

export type LoyaltyTier = "عادی" | "نقره‌ای" | "طلایی" | "ویژه";

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  loyaltyTier: LoyaltyTier;
  totalPurchases: number;
  /** Full date of birth, stored as a Gregorian ISO date string
   *  ("YYYY-MM-DD") like every other date in the app — entered via a
   *  Jalali year/month/day picker and converted on save. Used for the
   *  yearly birthday-SMS reminder (which compares just the month/day
   *  part, derived from this) and to know the customer's actual age. */
  birthday?: string;
}

export interface SaleRecord {
  id: string;
  itemId: string;
  itemName: string;
  customerId: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  channel: SaleChannel;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
}

export interface MobilePriceSourceConfig {
  url: string;
  itemSelector: string;
  nameSelector: string;
  priceSelector: string;
  refreshMinutes: number;
}

export interface MobilePriceItem {
  name: string;
  price: number;
}

export interface MobilePriceListResult {
  items: MobilePriceItem[];
  updatedAt: string | null;
  error: string | null;
}

export type RepairStatus =
  | "دریافت شده"
  | "در حال تعمیر"
  | "منتظر قطعه"
  | "تکمیل شده"
  | "تحویل داده شده";

export type RepairPriority = "عادی" | "فوری" | "بحرانی";

export const REPAIR_STATUSES: RepairStatus[] = [
  "دریافت شده",
  "در حال تعمیر",
  "منتظر قطعه",
  "تکمیل شده",
  "تحویل داده شده"
];

export const REPAIR_PRIORITIES: RepairPriority[] = ["عادی", "فوری", "بحرانی"];

export interface RepairTicket {
  id: string;
  deviceModel: string;
  imei: string;
  serialNumber: string;
  /** Device unlock password/pattern — shown once here for the technician's
   *  reference; kept out of any printed receipt or log output. */
  devicePassword: string;
  faultDescription: string;
  accessoriesReceived: string;
  partsUsed: string;
  laborFee: number;
  /** بیعانه — amount collected up front when the device is dropped off. */
  depositAmount: number;
  /** 11-digit mobile number, printed on the repair receipt. */
  mobilePhone: string;
  /** Optional landline, printed on the repair receipt. */
  landlinePhone: string;
  /** National ID, used only in the receipt's acknowledgment clause the
   *  customer signs — never shown anywhere else in the app. */
  nationalId: string;
  status: RepairStatus;
  priority: RepairPriority;
  technician: string;
  customerId: string | null;
  customerName: string;
  /** ISO date string (yyyy-mm-dd), estimated delivery date. */
  deliveryDate: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  contractNotes: string;
  /** Positive: shop owes the supplier. Negative: supplier owes the shop. */
  balance: number;
  rating: number;
  createdAt: string;
}

export interface SupplierPurchase {
  id: string;
  supplierId: string;
  itemDescription: string;
  amount: number;
  date: string;
  paid: boolean;
  /** How it was paid, when paid is true — "نقد" as a harmless default for
   *  the credit (نسیه) case where no payment happened yet. */
  paymentMethod: PaymentMethod;
}

export type PaymentMethod = "نقد" | "کارت‌خوان (پوز)" | "انتقال وجه";

export type SaleChannel = "حضوری" | "اینستاگرام" | "تلگرام" | "واتساپ";

export type AccountingCategory = "فروش" | "خرید کالا" | "اجاره" | "حقوق" | "قبوض" | "سایر";

export interface CashTransaction {
  id: string;
  type: "درآمد" | "هزینه";
  account: "صندوق" | "بانک";
  category: AccountingCategory;
  /** How the money actually moved — نقد/پوز/انتقال وجه. Independent of
   *  `account` (which cash drawer it landed in): a card or transfer
   *  payment can still ultimately land in صندوق depending on the shop's
   *  own bookkeeping habits. */
  paymentMethod: PaymentMethod;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  /** The only way to reverse a mistaken transaction — it is never deleted,
   *  only voided, so the financial history stays intact and auditable. */
  voided: boolean;
}

export interface CheckRecord {
  id: string;
  direction: "دریافتنی" | "پرداختنی";
  payerOrPayee: string;
  amount: number;
  dueDate: string;
  status: "در جریان" | "وصول شده" | "برگشتی";
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
}

/** Stock levels for non-central warehouses. The existing InventoryItem.quantity
 *  field continues to represent stock in the central warehouse (wh-central) —
 *  this keeps the existing Inventory/Sales modules untouched. */
export interface WarehouseStock {
  warehouseId: string;
  itemId: string;
  quantity: number;
}

export interface StockTransfer {
  id: string;
  itemId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  date: string;
}

export interface StocktakeEntry {
  id: string;
  warehouseId: string;
  itemId: string;
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
  note: string;
  date: string;
}

export interface StockReservation {
  id: string;
  itemId: string;
  warehouseId: string;
  customerName: string;
  quantity: number;
  status: "رزرو شده" | "لغو شده" | "تحویل شده";
  createdAt: string;
}

export interface DefectiveStockEntry {
  id: string;
  itemId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
  date: string;
}

export interface StockReturnEntry {
  id: string;
  itemId: string;
  quantity: number;
  reason: string;
  refunded: boolean;
  date: string;
}

export interface InstallmentCompany {
  id: string;
  name: string;
  terms: string;
}

export type InstallmentContractStatus = "در جریان" | "تسویه شده" | "معوق";

export interface InstallmentContract {
  id: string;
  companyId: string | null;
  customerName: string;
  itemDescription: string;
  totalAmount: number;
  downPayment: number;
  installmentCount: number;
  monthlyAmount: number;
  startDate: string;
  status: InstallmentContractStatus;
  guaranteeNote: string;
  /** Serial number of the check(s) held for this contract, if any. */
  checkSerialNumber: string;
  /** Whether this contract has been registered in the installment
   *  company's own portal/desk ("کارتابل پذیرنده"). Only meaningful when
   *  the contract goes through a company (companyId is set), but kept as
   *  a plain boolean so it's simple to toggle either way. */
  registeredWithAcceptor: boolean;
  createdAt: string;
  /** Installment fee/interest percent applied to the remaining balance
   *  (totalAmount - downPayment) at the moment the contract was created —
   *  stored on the contract itself so it stays fixed even if the shop's
   *  default percent in Settings changes later. 0 means no fee. */
  feePercent: number;
  /** The fee amount in تومان that feePercent produced, already folded into
   *  monthlyAmount — kept separately just so it can be shown/printed. */
  feeAmount: number;
}

export interface InstallmentPayment {
  id: string;
  contractId: string;
  installmentNumber: number;
  amount: number;
  date: string;
}

export type CollateralType = "چک" | "طلا" | "سفته" | "ضامن" | "اعتباری" | "سایر";
export type CollateralStatus = "معتبر" | "بازگردانده شده" | "ضبط شده";

export interface CollateralRecord {
  id: string;
  type: CollateralType;
  relatedTo: string;
  description: string;
  guarantorName: string;
  /** Name of the buyer/customer the guarantee was taken from — shown
   *  alongside the guarantor's name since they're often different people
   *  (e.g. a friend or relative guarantees the buyer's installment sale). */
  buyerName: string;
  dueDate: string;
  status: CollateralStatus;
  /** Estimated value of the collateral in تومان — optional, only needed so
   *  that seizing it (status "ضبط شده") can be recorded in accounting. */
  amount: number;
  createdAt: string;
}

export type UserRole = "مدیر" | "صندوقدار" | "تکنسین" | "انباردار";

export interface AppUser {
  id: string;
  fullName: string;
  username: string;
  /** SHA-256 hex digest — the plain password is never stored or logged. */
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  userLabel: string;
  action: string;
  details: string;
  /** "info" for normal activity, "error" for caught application errors. */
  level: "info" | "error";
}

export type SmsTemplateCategory =
  | "خوشامدگویی"
  | "دستگاه آماده"
  | "کالا موجود شد"
  | "تبریک تولد"
  | "یادآوری قسط"
  | "یادآوری چک"
  | "کمپین تبلیغاتی"
  | "سایر";

export const SMS_TEMPLATE_CATEGORIES: SmsTemplateCategory[] = [
  "خوشامدگویی",
  "دستگاه آماده",
  "کالا موجود شد",
  "تبریک تولد",
  "یادآوری قسط",
  "یادآوری چک",
  "کمپین تبلیغاتی",
  "سایر"
];

export interface SmsTemplate {
  id: string;
  category: SmsTemplateCategory;
  title: string;
  /** May contain placeholders: {نام_مشتری} {نام_کالا} {مبلغ} {تاریخ} {نام_فروشگاه} */
  body: string;
  createdAt: string;
}

export interface SmsLogEntry {
  id: string;
  phone: string;
  message: string;
  status: "ارسال شد" | "ناموفق" | "شبیه‌سازی (بدون تنظیمات پنل)";
  errorDetail: string | null;
  templateId: string | null;
  createdAt: string;
}

export interface SmsGatewayParam {
  id: string;
  /** The field/query-param name the SMS panel expects, e.g. "apikey". */
  key: string;
  /** May contain placeholders: {phone} {message} {sender} {apikey} */
  valueTemplate: string;
}

export interface SmsGatewayConfig {
  endpoint: string;
  method: "GET" | "POST";
  apiKey: string;
  senderNumber: string;
  params: SmsGatewayParam[];
}

export interface IncomingPhoneCapture {
  id: string;
  phone: string;
  matchedCustomerId: string | null;
  source: "دستگاه (کیبورد)" | "شبکه";
  handled: boolean;
  receivedAt: string;
}

export interface PhoneCaptureConfig {
  networkListenerEnabled: boolean;
  port: number;
}
