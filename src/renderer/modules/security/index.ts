import { pluginRegistry } from "@/plugins/pluginRegistry";
import { Security } from "./Security";

pluginRegistry.register({
  id: "security",
  label: "امنیت",
  icon: "🔒",
  order: 16,
  group: "سیستم",
  essential: true,
  component: Security
});
