import { pluginRegistry } from "@/plugins/pluginRegistry";
import { Notifications } from "./Notifications";

pluginRegistry.register({
  id: "notifications",
  label: "پیامک و اطلاع‌رسانی",
  icon: "✉",
  order: 13,
  group: "ابزارها",
  component: Notifications
});
