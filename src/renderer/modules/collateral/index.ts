import { pluginRegistry } from "@/plugins/pluginRegistry";
import { Collateral } from "./Collateral";

pluginRegistry.register({
  id: "collateral",
  label: "مدیریت ضمانت",
  icon: "🛡",
  order: 7,
  group: "مالی",
  component: Collateral
});
