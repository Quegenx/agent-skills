import { RegistryContext } from "@effect/atom-react";
import { Effect } from "effect";
import { useContext, useState } from "react";

import { runClientEffect } from "@/lib/atoms/app-atom-runtime";

/**
 * Copies a link and reports "copied" for two seconds, for menu feedback. A
 * refused clipboard (no permission, an unfocused page) reports nothing.
 *
 * @returns Whether a link was just copied, and copy.
 */
export const useCopiedLink = () => {
  const registry = useContext(RegistryContext);
  const [copied, setCopied] = useState(false);

  const copy = async (url: string) => {
    await runClientEffect(
      registry,
      Effect.tryPromise(async () => {
        await navigator.clipboard.writeText(url);
      }).pipe(
        Effect.andThen(
          Effect.sync(() => {
            setCopied(true);
            window.setTimeout(() => {
              setCopied(false);
            }, 2000);
          })
        ),
        Effect.ignore
      )
    );
  };

  return { copied, copy };
};
