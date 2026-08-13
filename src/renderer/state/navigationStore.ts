import { createStore } from "./createStore";

interface NavigationState {
  activeId: string;
}

const navigationStore = createStore<NavigationState>({ activeId: "" });

function goTo(moduleId: string): void {
  navigationStore.setState(() => ({ activeId: moduleId }));
}

export function useNavigation() {
  const state = navigationStore.useStore();
  return { activeId: state.activeId, goTo };
}

export const navigationActions = {
  goTo,
  getState: navigationStore.getState
};
