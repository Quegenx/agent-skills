import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { userIdServerInput } from "@/lib/auth/user-id-server-input";
import { createSonioxDictationKey } from "@/server/integrations/soniox.server";
import { runAppRequest } from "@/server/runtime/app-runtime.server";
import { createOwnedSupabaseClient } from "@/server/user-data/user-page-state.server";

import { toStandardSchema } from "../../../../backend/shared/schema/standard-schema";

/**
 * A signed-in user's key for one dictation (createSonioxDictationKey).
 */
export const createAgentChatDictationKey = createServerFn({ method: "POST" })
  .validator(toStandardSchema(userIdServerInput))
  .handler(
    async ({ data }) =>
      await runAppRequest(
        Effect.andThen(
          createOwnedSupabaseClient(data.userId),
          createSonioxDictationKey()
        )
      )
  );
