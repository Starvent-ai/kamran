import type { ComponentType } from "react";

/**
 * A Starvent plugin describes one navigable section of the app (a core
 * module like "inventory", or a future third-party addition). The shell
 * (App.tsx / Sidebar.tsx) never references modules by name — it only
 * ever iterates over whatever has been registered here. Adding a new
 * feature means adding a new folder + one registration call, not editing
 * the core shell.
 */
export interface StarventPlugin {
  id: string;
  label: string;
  /** A single glyph/emoji used as the nav icon — keeps the app fully
   *  offline-capable with no external icon font dependency. */
  icon: string;
  order: number;
  component: ComponentType;
  /** Section heading this module's nav link is grouped under (e.g.
   *  "عملیات روزانه"). Modules that omit this fall under a generic
   *  "سایر" section — the sidebar never needs to know about a module
   *  by name to group it correctly. */
  group?: string;
  /** True for the handful of modules the app can't safely run without
   *  (dashboard as the landing page, settings/security since they're what
   *  re-enables everything else) — these never show a disable toggle in
   *  «تنظیمات → افزونه‌ها». Everything else defaults to disableable. */
  essential?: boolean;
}

class PluginRegistry {
  private plugins = new Map<string, StarventPlugin>();

  register(plugin: StarventPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(
        `افزونه‌ای با شناسه «${plugin.id}» قبلاً ثبت شده است. شناسهٔ یکتا انتخاب کنید.`
      );
    }
    this.plugins.set(plugin.id, plugin);
  }

  unregister(id: string): void {
    this.plugins.delete(id);
  }

  get(id: string): StarventPlugin | undefined {
    return this.plugins.get(id);
  }

  getAll(): StarventPlugin[] {
    return Array.from(this.plugins.values()).sort((a, b) => a.order - b.order);
  }
}

export const pluginRegistry = new PluginRegistry();
