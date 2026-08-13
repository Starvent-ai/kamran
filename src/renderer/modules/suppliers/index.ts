import { pluginRegistry } from "@/plugins/pluginRegistry";
import { Suppliers } from "./Suppliers";

pluginRegistry.register({
  id: "suppliers",
  label: "تأمین‌کنندگان",
  icon: "🚚",
  order: 9,
  group: "مالی",
  component: Suppliers
});
