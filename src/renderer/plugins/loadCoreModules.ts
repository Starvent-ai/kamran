// Side-effect imports: each of these calls pluginRegistry.register(...)
// as soon as it loads. Adding a new module means adding one line here —
// the shell (App.tsx / Sidebar.tsx) never needs to change.
import "@/modules/dashboard";
import "@/modules/inventory";
import "@/modules/livePrices";
import "@/modules/sales";
import "@/modules/customers";
import "@/modules/repairs";
import "@/modules/suppliers";
import "@/modules/accounting";
import "@/modules/calculator";
import "@/modules/warehouse";
import "@/modules/installments";
import "@/modules/collateral";
import "@/modules/printing";
import "@/modules/security";
import "@/modules/notifications";
import "@/modules/settings";
import "@/plugins/examples/aiSuggestionsPlugin";
