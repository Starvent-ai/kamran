import React from "react";
import ReactDOM from "react-dom/client";
import "@/plugins/loadCoreModules";
import { App } from "@/App";
import "@/styles/global.css";
import { activityLogActions } from "@/modules/security/useActivityLog";

window.addEventListener("error", (event) => {
  activityLogActions.logActivity("سیستم", "خطای برنامه", event.message, "error");
});
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
  activityLogActions.logActivity("سیستم", "خطای Promise", reason, "error");
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("عنصر ریشهٔ #root در index.html یافت نشد.");
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
