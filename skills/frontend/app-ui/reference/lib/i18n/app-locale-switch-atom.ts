import { Atom } from "effect/reactivity";

import type { AppLocale } from "@/lib/i18n/app-intl-locale";

// The language the app is switching to: the sidebar's language row sets it,
// and the shell's AppLocaleTransition plays the switch.
export const appLocaleSwitchAtom = Atom.make<AppLocale | null>(null).pipe(
  Atom.keepAlive
);
