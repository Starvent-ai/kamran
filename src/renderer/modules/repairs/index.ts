import { pluginRegistry } from "@/plugins/pluginRegistry";
import { Repairs } from "./Repairs";

pluginRegistry.register({
  id: "repairs",
  label: "تعمیرات",
  icon: "🛠",
  order: 2,
  group: "عملیات روزانه",
  component: Repairs
});
