import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { LoginScreen } from "@/components/LoginScreen";
import { pluginRegistry } from "@/plugins/pluginRegistry";
import { useNavigation } from "@/state/navigationStore";
import { useUsers } from "@/modules/security/useUsers";
import { usePluginPreferences } from "@/state/pluginPreferences";

const SUBTITLES: Record<string, string> = {
  dashboard: "نمای کلی فروش، موجودی و مشتریان",
  inventory: "افزودن و مدیریت کالاهای انبار",
  "live-prices": "قیمت لحظه‌ای موبایل و تبلت از سایت مرجع",
  sales: "ثبت سریع فروش و مشاهدهٔ تاریخچه",
  customers: "مدیریت باشگاه مشتریان",
  repairs: "ثبت و پیگیری دستگاه‌های در حال تعمیر",
  suppliers: "مدیریت تأمین‌کنندگان و بدهی/بستانکاری",
  accounting: "صندوق، بانک، هزینه‌ها، درآمدها و چک‌ها",
  calculator: "محاسبهٔ سود، تخفیف، مالیات و اقساط با چاپ مستقیم",
  warehouse: "چند انبار، انتقال، انبارگردانی، رزرو، معیوب و مرجوعی",
  installments: "شرکت‌های طرف قرارداد، پرونده و پیگیری اقساط",
  collateral: "چک، طلا، سفته و ضامن با هشدار سررسید",
  printing: "چاپ فاکتور فروش و رسید تعمیر با سربرگ فروشگاه",
  security: "مدیریت کاربران، سطح دسترسی و لاگ فعالیت",
  notifications: "دریافت شماره از دستگاه، ارسال پیامک و یادآوری‌های خودکار",
  settings: "پیکربندی هوش مصنوعی و برنامه",
  "ai-suggestions-example": "نمونهٔ افزونهٔ مستقل"
};

export function App(): JSX.Element {
  const { users, currentUser, canAccess } = useUsers();
  const { isDisabled } = usePluginPreferences();
  const allPlugins = pluginRegistry.getAll().filter((p) => p.essential || !isDisabled(p.id));

  // A shop that hasn't created any accounts yet still opens straight into
  // the app — nobody should ever be locked out of a fresh install before
  // they've had a chance to create the first مدیر account from داخل
  // امنیت. The gate only turns on once at least one account exists.
  const gateActive = users.length > 0;
  const isLoggedIn = !gateActive || Boolean(currentUser);

  const plugins = !gateActive || !currentUser ? allPlugins : allPlugins.filter((p) => canAccess(currentUser.role, p.id));

  const { activeId, goTo } = useNavigation();
  const resolvedActiveId = plugins.some((p) => p.id === activeId) ? activeId : plugins[0]?.id || "";

  const activePlugin = pluginRegistry.get(resolvedActiveId) ?? plugins[0];

  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [activePlugin?.id]);

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  if (!activePlugin) {
    return (
      <div className="empty-state">
        {gateActive && currentUser
          ? "نقش شما به هیچ بخشی از برنامه دسترسی ندارد. با مدیر سیستم تماس بگیرید."
          : "هیچ ماژولی ثبت نشده است. لطفاً pluginRegistry را بررسی کنید."}
      </div>
    );
  }

  const ActiveComponent = activePlugin.component;

  return (
    <div className="app-shell">
      <div className="app-main">
        <TopBar title={activePlugin.label} subtitle={SUBTITLES[activePlugin.id]} />
        <div className="app-content" ref={contentRef}>
          <ActiveComponent />
        </div>
      </div>
      <Sidebar activeId={activePlugin.id} plugins={plugins} onSelect={goTo} />
    </div>
  );
}
