import { createStore } from "@/state/createStore";

interface PluginPreferencesState {
  disabledIds: string[];
}

const pluginPreferencesStore = createStore<PluginPreferencesState>({ disabledIds: [] }, "data-plugin-preferences");

function setEnabled(id: string, enabled: boolean): void {
  pluginPreferencesStore.setState((prev) => ({
    disabledIds: enabled ? prev.disabledIds.filter((x) => x !== id) : [...new Set([...prev.disabledIds, id])]
  }));
}

export function usePluginPreferences() {
  const state = pluginPreferencesStore.useStore();
  return {
    disabledIds: state.disabledIds,
    isDisabled: (id: string) => state.disabledIds.includes(id),
    setEnabled
  };
}

export const pluginPreferencesActions = {
  setEnabled,
  isDisabled: (id: string) => pluginPreferencesStore.getState().disabledIds.includes(id),
  getState: pluginPreferencesStore.getState
};
