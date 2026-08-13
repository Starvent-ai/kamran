import { pluginRegistry } from "@/plugins/pluginRegistry";
import { Dashboard } from "./Dashboard";

pluginRegistry.register({
  id: "dashboard",
  label: "داشبورد",
  icon: "◧",
  order: 0,
  group: "عملیات روزانه",
  essential: true,
  component: Dashboard
});
