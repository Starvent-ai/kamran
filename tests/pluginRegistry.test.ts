import { describe, expect, it, beforeEach } from "vitest";
import { pluginRegistry } from "@/plugins/pluginRegistry";

function DummyComponent() {
  return null;
}

describe("pluginRegistry", () => {
  beforeEach(() => {
    pluginRegistry.unregister("test-plugin-a");
    pluginRegistry.unregister("test-plugin-b");
  });

  it("registers a plugin and retrieves it by id", () => {
    pluginRegistry.register({
      id: "test-plugin-a",
      label: "پلاگین تست",
      icon: "•",
      order: 50,
      component: DummyComponent
    });

    const found = pluginRegistry.get("test-plugin-a");
    expect(found?.label).toBe("پلاگین تست");
  });

  it("throws when registering a duplicate id", () => {
    pluginRegistry.register({
      id: "test-plugin-a",
      label: "اول",
      icon: "•",
      order: 1,
      component: DummyComponent
    });

    expect(() =>
      pluginRegistry.register({
        id: "test-plugin-a",
        label: "دوم",
        icon: "•",
        order: 2,
        component: DummyComponent
      })
    ).toThrow();
  });

  it("returns plugins sorted by their order field", () => {
    pluginRegistry.register({
      id: "test-plugin-b",
      label: "دوم",
      icon: "•",
      order: -1,
      component: DummyComponent
    });
    pluginRegistry.register({
      id: "test-plugin-a",
      label: "اول",
      icon: "•",
      order: 100,
      component: DummyComponent
    });

    const all = pluginRegistry.getAll();
    const indexB = all.findIndex((p) => p.id === "test-plugin-b");
    const indexA = all.findIndex((p) => p.id === "test-plugin-a");
    expect(indexB).toBeLessThan(indexA);
  });
});
