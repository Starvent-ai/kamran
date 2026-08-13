import { pluginRegistry } from "@/plugins/pluginRegistry";
import { WarehouseModule } from "./Warehouse";

pluginRegistry.register({
  id: "warehouse",
  label: "انبار پیشرفته",
  icon: "📦",
  order: 8,
  group: "کالا و انبار",
  component: WarehouseModule
});
