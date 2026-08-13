import { pluginRegistry } from "@/plugins/pluginRegistry";
import { Printing } from "./Printing";

pluginRegistry.register({
  id: "printing",
  label: "چاپ",
  icon: "🖨",
  order: 12,
  group: "ابزارها",
  component: Printing
});
