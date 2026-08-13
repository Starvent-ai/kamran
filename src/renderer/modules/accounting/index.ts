import { pluginRegistry } from "@/plugins/pluginRegistry";
import { Accounting } from "./Accounting";

pluginRegistry.register({
  id: "accounting",
  label: "حسابداری",
  icon: "💰",
  order: 10,
  group: "مالی",
  component: Accounting
});
