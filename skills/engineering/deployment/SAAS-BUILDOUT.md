# A SaaS walking skeleton

An optional buildout from [more skills, saas-stack-playbook.md], corrected against the linked provider docs. Its selected recipe is React/Next.js, Vercel, Supabase, Clerk and, when needed, a separate Node worker. Use it for a new project that chose those providers, or to inspect an existing project's responsibilities. Preserve working installed choices unless a migration is authorized. React and Next.js remain in [the global React skill](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/SKILL.md).

## Decide responsibilities before setup

[more skills, saas-stack-playbook.md, division of labor and decision rules]

| Responsibility | This recipe's choice | Boundary |
|---|---|---|
| User-facing app and request handlers | Next.js on Vercel | Identity checks and data access belong at the resource |
| Identity | Clerk | Forward the caller's token to user-scoped data access |
| Durable application data, files and progress | Supabase Postgres, Storage and Realtime | Apply the existing ownership/RLS rules |
| A workload that needs a separate process | Node worker on Railway or Fly.io | Introduce it only for an actual workload; share durable job state |

The source prefers Railway for initial setup and Fly.io for greater control; those are author choices, not measured superiority or a reason to replace an installed host. Its one-database/jobs-table preference does not replace the existing [worker claim and retry contract](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/WORKERS.md). Record why any extra service is needed in the project's README. Place app functions, database and workers close together where their actual region options permit it. [more skills, saas-stack-playbook.md]

**Corrected workload rule:** Vercel supports scheduled work through Cron Jobs and durable work through Workflows. Ordinary Functions still have runtime/configuration limits; choose from the workload's actual requirements. The source categorically sent all long-running or scheduled work to Railway/Fly. [https://vercel.com/docs/functions/limitations; https://vercel.com/docs/cron-jobs]

## Build one working path in phases

[more skills, saas-stack-playbook.md, standard buildout order]

1. **Scaffold the selected app.** Establish the TypeScript/Next.js app before feature work. Keep the owner's existing app, landing-page and agent-chat references; this source's external component-library recommendation does not replace them. [app-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/app-ui/SKILL.md), [landing-page-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/SKILL.md), [agent-chat-ui SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-chat-ui/SKILL.md).
2. **Make identity work.** Configure the chosen Clerk application and SDK/provider, then verify actual signed-in and signed-out behavior. Clerk now has a CLI for setup and environment management; the source said it had none and required a dashboard-only step. [https://clerk.com/docs/cli]
3. **Version the database.** Put schema changes in the repository's migration workflow, enable RLS and regenerate schema-derived types after changes. When the project already uses declarative schemas, generate and review migrations through that workflow instead of replacing it with hand-written migrations. The canonical commands and target rules are in [supabase WORKFLOW.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/WORKFLOW.md). [more skills, saas-stack-playbook.md]
4. **Wire one authorized read.** Pass the Clerk session token through a shared Supabase client factory. Use the existing [third-party-auth/token and subject rules](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/AUTH-PROVIDERS.md#third-party-auth-clerk-firebase-auth0-cognito-workos-custom-oidc) and [RLS ownership rules](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/SECURITY.md). A provider connection alone does not establish every row's authorization. [more skills, saas-stack-playbook.md; https://supabase.com/docs/guides/auth/third-party/clerk]
5. **Verify a deployed skeleton.** Connect the selected deployment project and its actual environment, inspect a preview, then perform the authorized production deployment. Report the real auth result, real table read and actual URL. The source's first-day skeleton is a scheduling preference, not a delivery guarantee or permission to publish. [more skills, saas-stack-playbook.md]
6. **Add background work only when needed.** Keep the worker entry point separate; the app records work durably and reads progress from owner-scoped job state. Preserve attempts, claim ownership, failure and abandoned-run recovery through [background-jobs WORKERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/WORKERS.md) and [background-jobs ASYNC-APIS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/ASYNC-APIS.md), rather than implementing a second queue definition. [more skills, saas-stack-playbook.md]
7. **Close provider-event loops.** Add verified, idempotent webhook handling for the identity mirror if needed, and payment state when payments arrive. A minimal user mirror is optional; verify the selected provider events before implementing it. Stripe's handler contract remains in [stripe WEBHOOKS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/WEBHOOKS.md). The source's claim that every webhook eventually duplicates is not a guarantee about every event; duplicate-safe processing remains the contract. [more skills, saas-stack-playbook.md]

**Corrected Clerk protection:** `clerkMiddleware()` alone does not make nonpublic routes protected. Enforce authentication and authorization close to the resource that reads or mutates data. Current Clerk docs use `proxy.ts` for Next.js 16 and `middleware.ts` for Next.js 15 or earlier. The source described middleware as protecting everything except public routes and used an unversioned filename. [https://clerk.com/docs/reference/nextjs/clerk-middleware]

**Corrected identity scope:** Supabase can trust Clerk alongside Supabase Auth or as the application's chosen sign-in provider. The source forbade combining them; that was its architecture preference, not a platform limitation. Retain the issuer/subject protections in the existing auth owner. [https://supabase.com/docs/guides/auth/third-party/clerk]

## Keep an environment inventory

[more skills, saas-stack-playbook.md, environment variable hygiene]

Record local, preview and production requirements separately, including which process needs each variable. Commit only a placeholder `.env.example`; keep real values in the existing platform secret stores. The app needs its identity configuration, Supabase endpoint/public client key and public configuration. A separate worker needs its own data-access and external-service credentials. A `NEXT_PUBLIC_` prefix deliberately ships a value to the browser; it is not a default for credentials.

**Corrected elevated-key boundary:** use a publishable Supabase key for code shipped to users and a secret key only in controlled backend code that enforces authorization. It can live in a server-only Next.js route or worker; it must not reach a browser. The source restricted elevated access to Railway/Fly and forbade it in all Next.js code. New integrations use publishable/secret keys; legacy `anon`/`service_role` migration belongs to [supabase SECURITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/SECURITY.md). [https://supabase.com/docs/guides/api/api-keys]

**Corrected environment pull:** `vercel env pull .env.local` retrieves development values by default. Select the intended preview or production environment when that is the task, rather than assuming every environment has been synchronized. The source described an untargeted pull as keeping local values in sync with the project generally. [https://vercel.com/docs/projects/deploy-from-cli]

## Diagnose in order

[more skills, saas-stack-playbook.md, when something breaks]

| Symptom | Inspection sequence |
|---|---|
| Auth loop or unauthorized response | Actual resource protection and matcher coverage, forwarded caller token, then the relevant ownership claim/policy |
| Local works, deployment fails | Compare the selected environment's variable names with `.env.example`; mismatch is a hypothesis, not an almost-certain diagnosis |
| Worker is silent | Actual provider logs, job state and current/expired claim; use the existing safe recovery contract |
| Slow page | Where the data is fetched, then the actual query and indexes on its filter columns |
| Types disagree after a schema change | Regenerate schema-derived types for the intended database target |

## Prove it

[more skills, saas-stack-playbook.md, phase verification and running this skill]

- Report the actual auth behavior, authorized table read and inspected deployment URL for the completed phases; do not mark an unrun phase verified.
- A worker is absent until a real workload needs it; when present, its durable job/progress/recovery behavior uses the existing worker owner.
- The environment inventory distinguishes app versus worker and local versus preview versus production, with no real secrets committed or shipped to the browser.
- For an existing app, return its responsibility map and evidence before proposing an authorized migration. For a settled service-choice question, answer that question without installing the whole recipe.
