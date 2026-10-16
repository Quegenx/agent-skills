import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Schema } from "effect";
import { Atom } from "effect/reactivity";

import { browserStorageAtomRuntime } from "@/lib/atoms/app-atom-runtime";

// Whether the agent page's tasks panel is open, remembered in this browser.
// Stored as before atoms (zustand's persist: { state, version: 0 }), so a
// panel left open then still opens.
const agentTasksPanelStorageAtom = Atom.kvs({
  runtime: browserStorageAtomRuntime,
  key: "app:agent-tasks-panel",
  schema: Schema.Struct({
    state: Schema.Struct({ open: Schema.Boolean }),
    version: Schema.Finite,
  }),
  defaultValue: () => ({ state: { open: false }, version: 0 }),
});

// The server render and the page's first render in the browser show it
// closed; the stored state shows once the page has hydrated.
const agentTasksPanelOpenAtom = Atom.writable(
  (get) => get(agentTasksPanelStorageAtom).state.open,
  (ctx, open: boolean) => {
    ctx.set(agentTasksPanelStorageAtom, { state: { open }, version: 0 });
  }
).pipe(Atom.withServerValue(() => false));

/**
 * Whether the agent page's tasks panel is open.
 *
 * @returns Whether it is open.
 */
export const useAgentTasksPanelOpen = () =>
  useAtomValue(agentTasksPanelOpenAtom);

/**
 * Opens or closes the panel, or toggles it.
 *
 * @returns setAgentTasksPanelOpen and toggleAgentTasksPanel.
 */
export const useAgentTasksPanelActions = () => {
  const setOpen = useAtomSet(agentTasksPanelOpenAtom);

  return {
    setAgentTasksPanelOpen: (open: boolean) => {
      setOpen(open);
    },
    toggleAgentTasksPanel: () => {
      setOpen((open) => !open);
    },
  };
};
