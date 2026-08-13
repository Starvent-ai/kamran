import { describe, expect, it } from "vitest";
import { pluginPreferencesActions } from "@/state/pluginPreferences";

describe("pluginPreferences", () => {
  it("a plugin is enabled by default", () => {
    expect(pluginPreferencesActions.isDisabled("some-plugin")).toBe(false);
  });

  it("disabling then re-enabling a plugin round-trips correctly", () => {
    pluginPreferencesActions.setEnabled("test-plugin-a", false);
    expect(pluginPreferencesActions.isDisabled("test-plugin-a")).toBe(true);

    pluginPreferencesActions.setEnabled("test-plugin-a", true);
    expect(pluginPreferencesActions.isDisabled("test-plugin-a")).toBe(false);
  });

  it("disabling the same plugin twice does not create duplicate entries", () => {
    pluginPreferencesActions.setEnabled("test-plugin-b", false);
    pluginPreferencesActions.setEnabled("test-plugin-b", false);
    const count = pluginPreferencesActions.getState().disabledIds.filter((id) => id === "test-plugin-b").length;
    expect(count).toBe(1);
  });

  it("disabling one plugin does not affect another", () => {
    pluginPreferencesActions.setEnabled("test-plugin-c", false);
    expect(pluginPreferencesActions.isDisabled("test-plugin-d")).toBe(false);
  });
});
