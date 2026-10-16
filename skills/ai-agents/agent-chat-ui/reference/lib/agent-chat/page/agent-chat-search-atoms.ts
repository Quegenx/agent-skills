import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Atom } from "effect/reactivity";

// Whether the chat search dialog is open. It lives outside the sidebar,
// which unmounts its menu on phones once the sheet closes.
const agentChatSearchOpenAtom = Atom.make(false).pipe(Atom.keepAlive);

/**
 * Whether the chat search dialog is open.
 *
 * @returns Whether it is open.
 */
export const useAgentChatSearchOpen = () =>
  useAtomValue(agentChatSearchOpenAtom);

/**
 * Opens or closes the chat search dialog.
 *
 * @returns The setter.
 */
export const useSetAgentChatSearchOpen = () =>
  useAtomSet(agentChatSearchOpenAtom);
