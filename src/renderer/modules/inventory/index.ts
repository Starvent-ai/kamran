import { pluginRegistry } from "@/plugins/pluginRegistry";
import { Inventory } from "./Inventory";

pluginRegistry.register({
  id: "inventory",
  label: "مدیریت کالا",
  icon: "▤",
  order: 4,
  group: "کالا و انبار",
  component: Inventory
});
