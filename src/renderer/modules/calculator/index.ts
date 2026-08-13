import { pluginRegistry } from "@/plugins/pluginRegistry";
import { Calculator } from "./Calculator";

pluginRegistry.register({
  id: "calculator",
  label: "ماشین‌حساب",
  icon: "🧮",
  order: 11,
  group: "مالی",
  component: Calculator
});
