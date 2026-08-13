import { pluginRegistry } from "@/plugins/pluginRegistry";
import { Sales } from "./Sales";

pluginRegistry.register({
  id: "sales",
  label: "فروش",
  icon: "◈",
  order: 1,
  group: "عملیات روزانه",
  component: Sales
});
