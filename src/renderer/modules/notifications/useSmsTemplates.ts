import { createStore } from "@/state/createStore";
import type { SmsTemplate, SmsTemplateCategory } from "@shared/types";
import { generateId } from "@/lib/id";

interface TemplatesState {
  templates: SmsTemplate[];
}

function seedTemplate(category: SmsTemplateCategory, title: string, body: string, offsetMs: number): SmsTemplate {
  return { id: `tmpl-${category}`, category, title, body, createdAt: new Date(Date.now() - offsetMs).toISOString() };
}

const seedTemplates: SmsTemplate[] = [
  seedTemplate(
    "خوشامدگویی",
    "خوشامدگویی به مشتری جدید",
    "{نام_مشتری} عزیز، به جمع مشتریان {نام_فروشگاه} خوش آمدید! از همراهی شما سپاسگزاریم.",
    8000
  ),
  seedTemplate(
    "دستگاه آماده",
    "آماده شدن دستگاه",
    "{نام_مشتری} عزیز، دستگاه شما آماده تحویل است. لطفاً جهت دریافت به {نام_فروشگاه} مراجعه فرمایید.",
    7000
  ),
  seedTemplate(
    "کالا موجود شد",
    "موجود شدن کالای درخواستی",
    "{نام_مشتری} عزیز، کالای «{نام_کالا}» که درخواست داده بودید موجود شد. برای اطلاع بیشتر با {نام_فروشگاه} تماس بگیرید.",
    6000
  ),
  seedTemplate(
    "تبریک تولد",
    "تبریک تولد",
    "{نام_مشتری} عزیز، تولدتان مبارک! {نام_فروشگاه} این روز خوب را به شما تبریک می‌گوید.",
    5000
  ),
  seedTemplate(
    "یادآوری قسط",
    "یادآوری سررسید قسط",
    "{نام_مشتری} عزیز، سررسید قسط شما به مبلغ {مبلغ} تومان در تاریخ {تاریخ} است. لطفاً نسبت به پرداخت اقدام فرمایید. {نام_فروشگاه}",
    4000
  ),
  seedTemplate(
    "یادآوری چک",
    "یادآوری سررسید چک",
    "{نام_مشتری} عزیز، سررسید چک به مبلغ {مبلغ} تومان در تاریخ {تاریخ} نزدیک است. {نام_فروشگاه}",
    3000
  ),
  seedTemplate(
    "کمپین تبلیغاتی",
    "کمپین تبلیغاتی نمونه",
    "{نام_مشتری} عزیز، از تخفیف‌های ویژهٔ {نام_فروشگاه} در این هفته غافل نشوید!",
    2000
  )
];

const templatesStore = createStore<TemplatesState>({ templates: seedTemplates }, "data-sms-templates");

interface NewTemplateInput {
  category: SmsTemplateCategory;
  title: string;
  body: string;
}

function createTemplate(input: NewTemplateInput): void {
  const template: SmsTemplate = { ...input, id: generateId("tmpl"), createdAt: new Date().toISOString() };
  templatesStore.setState((prev) => ({ templates: [...prev.templates, template] }));
}

function updateTemplate(templateId: string, updates: Partial<NewTemplateInput>): void {
  templatesStore.setState((prev) => ({
    templates: prev.templates.map((t) => (t.id === templateId ? { ...t, ...updates } : t))
  }));
}

function deleteTemplate(templateId: string): void {
  templatesStore.setState((prev) => ({
    templates: prev.templates.filter((t) => t.id !== templateId)
  }));
}

/** Fills {نام_مشتری} {نام_کالا} {مبلغ} {تاریخ} {نام_فروشگاه} placeholders with real values. */
export function fillTemplate(body: string, values: Record<string, string>): string {
  return body.replace(/\{([^}]+)\}/g, (_match, key: string) => values[key] ?? `{${key}}`);
}

export function useSmsTemplates() {
  const state = templatesStore.useStore();
  return { templates: state.templates, createTemplate, updateTemplate, deleteTemplate };
}

export const smsTemplateActions = {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getState: templatesStore.getState
};
