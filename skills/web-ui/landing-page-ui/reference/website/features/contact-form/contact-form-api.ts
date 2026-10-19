import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { runAppRequest } from "@/server/runtime/app-runtime.server";
import { runSupabaseQuery } from "@/server/runtime/supabase-query";

import { toStandardSchema } from "../../../../backend/shared/schema/standard-schema";
import { SupabaseServiceDatabase } from "../../../../backend/shared/supabase/supabase-service-database";

/**
 * An email address as the contact form takes it: a local part, then a domain of
 * dot-separated labels.
 */
export const contactEmailPattern = /^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/u;

// The same limits as public.contact_submissions' checks, so a bad field fails
// here instead of in the database.
const contactSubmissionSchema = Schema.Struct({
  id: Schema.String.check(Schema.isUUID()),
  name: Schema.String.check(Schema.isMinLength(2), Schema.isMaxLength(120)),
  email: Schema.String.check(
    Schema.isMaxLength(254),
    Schema.isPattern(contactEmailPattern)
  ),
  message: Schema.String.check(
    Schema.isMinLength(10),
    Schema.isMaxLength(5000)
  ),
  locale: Schema.Literals(["he", "en"]),
});

/**
 * Saves a contact form submission to the app's Supabase project
 * (public.contact_submissions). Visitors cannot write that table: this server
 * function validates the fields and inserts with the service-role client.
 * The form's own id makes a repeated send (a double click, a retry) land on
 * the same row, so a duplicate is ignored and counts as a success.
 */
export const sendContactSubmission = createServerFn({ method: "POST" })
  .validator(
    toStandardSchema(contactSubmissionSchema, { onExcessProperty: "error" })
  )
  .handler(async ({ data }) => {
    await runAppRequest(
      Effect.gen(function* sendContactSubmissionHandler() {
        const supabase = yield* (yield* SupabaseServiceDatabase).client;
        yield* runSupabaseQuery("CONTACT_SUBMISSION_FAILED", () =>
          supabase
            .from("contact_submissions")
            .upsert(data, { onConflict: "id", ignoreDuplicates: true })
        );
      })
    );
  });
