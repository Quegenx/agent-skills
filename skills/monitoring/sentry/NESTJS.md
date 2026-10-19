# Sentry for NestJS

`@sentry/nestjs` is the Node SDK plus NestJS hooks: a module that names transactions, a global filter that reports exceptions, and decorators for spans, crons and existing filters. Everything shared with plain Node (capture APIs, scopes, filtering, fingerprints, logs API, metrics, crons API, span APIs, sampling, distributed tracing, profiling, AI integrations) is in [NODE.md](NODE.md) and [NODE-TRACING.md](NODE-TRACING.md); this file keeps only what Nest changes. Two mechanisms decide most outcomes. First, the SDK must patch Node modules through OpenTelemetry before NestJS loads them, which is why setup takes three files and `instrument.ts` is the first import. Second, NestJS routes unhandled exceptions through its exception filter pipeline, so they never reach Node's uncaught handler: Sentry sees them only if it is hooked into that pipeline.

**JavaScript version boundary:** retained vendor examples target the stated SDK 10 era source unless marked 11; read the [SDK 11 migration](UPGRADE.md#v10-to-v11) before applying them to 11. Native Flutter/RN SDK versions are separate. [https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/]

**Contents:** [Versions](#versions) · [Detect and recommend](#detect-and-recommend) · [Setup: three files](#setup-three-files) · [Configuration](#configuration) · [Error monitoring](#error-monitoring) · [Context per request and per job](#context-per-request-and-per-job) · [Tracing](#tracing) · [Databases](#databases) · [Profiling](#profiling) · [Logs](#logs) · [Metrics](#metrics) · [Crons](#crons) · [AI monitoring](#ai-monitoring) · [DI wrappers and lint rules](#di-wrappers-and-lint-rules) · [Troubleshooting](#troubleshooting) · [Prove it](#prove-it)

## Versions

APIs here reflect `@sentry/nestjs` 10.x with NestJS 8 to 11. Verify against https://docs.sentry.io/platforms/node/guides/nestjs/ before implementing.

| Feature | Minimum |
|---|---|
| `@sentry/nestjs` package | 8.0.0 |
| `@SentryTraced` | 8.15.0 |
| `@SentryCron` | 8.16.0 |
| Event Emitter auto-instrumentation | 8.39.0 |
| Unified `SentryGlobalFilter` | 8.40.0 |
| `Sentry.logger` (`enableLogs`) | 9.41.0 |
| Pino integration | 10.18.0 |
| Metrics | 10.25.0 |
| `profileSessionSampleRate` | 10.27.0 (`profilesSampleRate` is deprecated in 10.x) |
| AI integrations | 10.53.0; `streamGenAiSpans` defaults to `true` from 10.61.0 |
| `dataCollection` | 10.57.0, replaces deprecated `sendDefaultPii` |
| Node.js | 18+; 18.19.0+ for ESM `--import` (tracing reference: 18.19.0+ or 19.9.0+ recommended) |

## Detect and recommend

```bash
# Confirm NestJS project
grep -E '"@nestjs/core"' package.json 2>/dev/null

# Check NestJS version
node -e "console.log(require('./node_modules/@nestjs/core/package.json').version)" 2>/dev/null

# Check existing Sentry
grep -i sentry package.json 2>/dev/null
ls src/instrument.ts 2>/dev/null
grep -r "Sentry.init\|@sentry" src/main.ts src/instrument.ts 2>/dev/null

# Check for existing Sentry DI wrapper (common in enterprise NestJS)
grep -rE "SENTRY.*TOKEN|SentryProxy|SentryService" src/ libs/ 2>/dev/null

# Check for config-class-based init (vs env-var-based)
grep -rE "class SentryConfig|SentryConfig" src/ libs/ 2>/dev/null

# Check if SentryModule.forRoot() is already registered in a shared module
grep -rE "SentryModule\.forRoot|SentryProxyModule" src/ libs/ 2>/dev/null

# Detect HTTP adapter (default is Express)
grep -E "FastifyAdapter|@nestjs/platform-fastify" package.json src/main.ts 2>/dev/null

# Detect GraphQL
grep -E '"@nestjs/graphql"|"apollo-server"' package.json 2>/dev/null

# Detect microservices
grep '"@nestjs/microservices"' package.json 2>/dev/null

# Detect WebSockets
grep -E '"@nestjs/websockets"|"socket.io"' package.json 2>/dev/null

# Detect task queues / scheduled jobs
grep -E '"@nestjs/bull"|"@nestjs/bullmq"|"@nestjs/schedule"|"bullmq"|"bull"' package.json 2>/dev/null

# Detect databases
grep -E '"@prisma/client"|"typeorm"|"mongoose"|"pg"|"mysql2"' package.json 2>/dev/null

# Detect AI libraries
grep -E '"openai"|"@anthropic-ai"|"langchain"|"@langchain"|"@google/generative-ai"|"ai"' package.json 2>/dev/null

# Check for companion frontend
ls -d ../frontend ../web ../client ../ui 2>/dev/null
```

| Finding | Do |
|---|---|
| `@sentry/nestjs` already installed | Read `instrument.ts` and `Sentry.init()`; you may only need feature config |
| A Sentry DI wrapper (e.g. `SENTRY_PROXY_TOKEN`) | Use the injected proxy for every runtime call (`startSpan`, `captureException`, `withIsolationScope`); only `instrument.ts` imports `@sentry/nestjs` |
| A config class drives init | Add new SDK options to the config type; don't hardcode values that vary per environment |
| `SentryModule.forRoot()` in a shared module | Don't add it again in `AppModule` |
| Fastify adapter | Works, with known edge cases; Express is fully supported |
| GraphQL | `SentryGlobalFilter` handles it natively |
| Microservices | Add a dedicated RPC exception filter |
| `@nestjs/schedule`, Bull, BullMQ | Recommend crons |
| AI libraries | Auto-instrumented, zero config |
| Prisma | Add `prismaIntegration()` manually |
| A companion front end without Sentry | Suggest its SDK skill ([REACT.md](REACT.md), [NEXTJS.md](NEXTJS.md), [REACT-NATIVE.md](REACT-NATIVE.md)) |

- **Turn on:** error monitoring (the non-negotiable baseline), tracing (the Nest lifecycle is auto-instrumented) and logs, always. Profiling for production CPU-sensitive workloads; metrics for business KPIs or SLOs; crons and AI monitoring when detected.
- **Lead with a recommendation:** "I recommend Error Monitoring + Tracing + Logging. Want Profiling, Crons, or AI Monitoring too?" Then add features one at a time and verify each before the next.

## Setup: three files

- **Install only `@sentry/nestjs`** (`npm install @sentry/nestjs`; with profiling `npm install @sentry/nestjs @sentry/profiling-node`). Never also install `@sentry/node`: `@sentry/nestjs` re-exports all of it, and installing both causes duplicate registration.
- **Before creating files:** if `instrument.ts` exists, modify it; if a config class drives init, read from config; if a DI wrapper exists, use it.

### 1. `src/instrument.ts`

```typescript
import * as Sentry from "@sentry/nestjs";
// Optional: add profiling
// import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? "production",
  release: process.env.SENTRY_RELEASE,

  // Data collection (SDK ≥ 10.57.0, replaces deprecated sendDefaultPii)
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nestjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  // Tracing: lower to 0.1-0.2 in high-traffic production
  tracesSampleRate: 1.0,

  // Profiling (requires @sentry/profiling-node)
  // integrations: [nodeProfilingIntegration()],
  // profileSessionSampleRate: 1.0,
  // profileLifecycle: "trace",

  // Structured logs (SDK ≥ 9.41.0)
  enableLogs: true,
});
```

With a config class instead of env vars:

```typescript
import * as Sentry from "@sentry/nestjs";
import { loadConfiguration } from "./config";

const config = loadConfiguration();

Sentry.init({
  dsn: config.sentry.dsn,
  environment: config.sentry.environment ?? "production",
  release: config.sentry.release,
  dataCollection: config.sentry.dataCollection ?? {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nestjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
  tracesSampleRate: config.sentry.tracesSampleRate ?? 1.0,
  profileSessionSampleRate: config.sentry.profilesSampleRate ?? 1.0,
  profileLifecycle: "trace",
  enableLogs: true,
});
```

### 2. `src/main.ts`

```typescript
// instrument.ts MUST be the very first import, before NestJS or any other module
import "./instrument";

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable graceful shutdown: flushes Sentry events on SIGTERM/SIGINT
  app.enableShutdownHooks();

  await app.listen(3000);
}
bootstrap();
```

OpenTelemetry must monkey-patch `http`, `express`, database drivers and other modules before they load; any module loaded before `instrument.ts` is not auto-instrumented. With TypeScript path aliases, set `tsconfig.json` `paths` so `instrument` resolves from `main.ts`.

### 3. `src/app.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { SentryModule, SentryGlobalFilter } from "@sentry/nestjs/setup";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    SentryModule.forRoot(), // Registers SentryTracingInterceptor globally
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter, // Captures all unhandled exceptions
    },
  ],
})
export class AppModule {}
```

- **`SentryModule.forRoot()`** registers `SentryTracingInterceptor` as a global `APP_INTERCEPTOR`, which names HTTP transactions. Register it once: twice means every span is intercepted twice (duplicate spans on every request).
- **`SentryGlobalFilter`** extends `BaseExceptionFilter` and captures across HTTP, GraphQL (it re-throws `HttpException` without reporting) and RPC contexts.

### Two entry points

| Import from | Gives you |
|---|---|
| `@sentry/nestjs` | `Sentry.init`, capture APIs, decorators (`SentryTraced`, `SentryCron`, `SentryExceptionCaptured`), span APIs, every `@sentry/node` re-export |
| `@sentry/nestjs/setup` | `SentryModule`, `SentryTracingInterceptor`, `SentryGlobalFilter` |

Never import `SentryModule` from `@sentry/nestjs`: that loads `@nestjs/common` before OpenTelemetry patches it and breaks auto-instrumentation. The split makes the setup pieces load after `Sentry.init()` has run in `instrument.ts`.

### ESM (Node 18.19.0+)

```javascript
// instrument.mjs
import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

```json
// package.json
{
  "scripts": {
    "start": "node --import ./instrument.mjs -r ts-node/register src/main.ts"
  }
}
```

Or `NODE_OPTIONS="--import ./instrument.mjs" npm run start`. ESM syntax errors: set `registerEsmLoaderHooks: false`, which disables the ESM hooks and with them auto-instrumentation for ESM modules.

## Configuration

The full option table, the `dataCollection` default dispute and the environment variables are in [NODE.md](NODE.md#configuration). Nest notes:

- **`dsn` empty disables the SDK.** `release` looks like `"myapp@1.0.0"`. `profileLifecycle` defaults to `"trace"`. `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` serve the CLI and `npx @sentry/wizard@latest -i sourcemaps` ([RELEASES-AND-SOURCEMAPS.md](RELEASES-AND-SOURCEMAPS.md)).
- **Auto-enabled integrations:** `httpIntegration`, `expressIntegration`, `nestIntegration`, `nativeNodeFetchIntegration`, `requestDataIntegration`, `onUncaughtExceptionIntegration`, `onUnhandledRejectionIntegration`, `graphqlIntegration`, the database ones in [Databases](#databases), `redisIntegration`, `amqplibIntegration`, `kafkaIntegration`, and the AI ones (`openAIIntegration`, `anthropicAIIntegration`, `googleGenAIIntegration`, LangChain, Vercel AI).
- **Add manually:** `nodeProfilingIntegration` (from `@sentry/profiling-node`), `prismaIntegration`, `knexIntegration`, `dataloaderIntegration`, `supabaseIntegration`, `consoleLoggingIntegration`, `captureConsoleIntegration`, `localVariablesIntegration`.
- **Spelling differs between references:** `langchainIntegration` vs `langChainIntegration`, `vercelAIIntegration` vs `vercelAiIntegration`. Check the export in your installed version.

```typescript
Sentry.init({
  // Disable a specific integration:
  integrations: (defaults) => defaults.filter((i) => i.name !== "Kafka"),
});

// Override integration config:
Sentry.init({
  integrations: [Sentry.breadcrumbsIntegration({ console: false })],
});

// Add non-default integration:
Sentry.addIntegration(Sentry.captureConsoleIntegration());

// Disable all defaults (uncommon):
Sentry.init({ defaultIntegrations: false });
```

## Error monitoring

Capture APIs, `beforeSend`, `ignoreErrors`, fingerprints and event processors work as in [NODE.md](NODE.md#capturing-errors). What Nest adds is how exceptions reach Sentry.

### Hooking into the filter pipeline

Two integration points; both skip expected errors with `isExpectedError()`, a duck-typing check (not `instanceof`, because importing `@nestjs/common` in the entry point would load it before OpenTelemetry patches it):

```typescript
// Internal SDK logic (simplified)
function isExpectedError(exception: unknown): boolean {
  if (typeof exception !== 'object' || exception === null) return false;

  const ex = exception as Record<string, unknown>;

  // HttpException: has getStatus(), getResponse(), initMessage()
  if (
    typeof ex.getStatus === 'function' &&
    typeof ex.getResponse === 'function' &&
    typeof ex.initMessage === 'function'
  ) {
    return true; // ← skipped, not reported
  }

  // RpcException: has getError(), initMessage()
  if (typeof ex.getError === 'function' && typeof ex.initMessage === 'function') {
    return true; // ← skipped, not reported
  }

  return false; // ← reported to Sentry
}
```

- **`HttpException` and its subclasses (4xx and 5xx) are never reported by design;** they are control flow. Capture one manually if you need it. A custom exception class that mimics these method signatures is also treated as expected and skipped.

| Option | When | How |
|---|---|---|
| A: `SentryGlobalFilter` | No custom catch-all filter (recommended) | `APP_FILTER` provider, as in step 3 |
| B: `@SentryExceptionCaptured()` | You have a `@Catch()` filter to keep | Decorate its `catch()`; it reports before your handler runs. Use instead of `SentryGlobalFilter` |
| C: Filter for one exception type | Special handling for one class | `captureException` then `super.catch` |
| D: RPC filter | Microservices | A dedicated `RpcExceptionFilter` |

```typescript
import { Catch, ExceptionFilter, ArgumentsHost } from "@nestjs/common";
import { SentryExceptionCaptured } from "@sentry/nestjs";

@Catch()
export class YourExistingFilter implements ExceptionFilter {
  @SentryExceptionCaptured() // Wraps catch() to auto-report exceptions
  catch(exception: unknown, host: ArgumentsHost): void {
    // Your existing error handling continues unchanged
  }
}
```

```typescript
import { Catch, ArgumentsHost, BadRequestException } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import * as Sentry from "@sentry/nestjs";

@Catch(DatabaseException)
export class DatabaseExceptionFilter extends BaseExceptionFilter {
  catch(exception: DatabaseException, host: ArgumentsHost) {
    Sentry.captureException(exception, {
      tags: { component: "database", query: exception.query },
    });
    return super.catch(new BadRequestException(exception.message), host);
  }
}
```

```typescript
import { Catch, RpcExceptionFilter, ArgumentsHost } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { RpcException } from "@nestjs/microservices";
import * as Sentry from "@sentry/nestjs";

@Catch(RpcException)
export class SentryRpcFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    Sentry.captureException(exception);
    return throwError(() => exception.getError());
  }
}
```

`SentryGlobalFilter` does handle RPC, but logs `IMPORTANT: RpcException should be handled with a dedicated Rpc exception filter, not the generic SentryGlobalFilter`. (One reference names this class `SentryRpcExceptionFilter`; the code is the same.)

### What reaches Sentry

| Scenario | Captured | Do |
|---|---|---|
| Unhandled controller exception | Yes | |
| `HttpException` (`BadRequestException`, ...) | No | Capture manually if needed |
| Caught in a service, graceful return | No | `captureException` before returning |
| Caught and re-thrown | Yes | |
| GraphQL resolver | Yes | |
| RPC | Partly | Dedicated `RpcExceptionFilter` |
| Background job (`@Cron`, `@OnEvent`) | No | `withIsolationScope()` plus manual capture |
| WebSocket gateway | No | Catch manually in gateway methods |

- **Caught exceptions never reach the filter.** If you catch and swallow, add `Sentry.captureException(err)` before the graceful return.
- **GraphQL:** the filter detects `host.getType<string>() === 'graphql'`, re-throws `HttpException` without capturing, and captures then re-throws every other `Error` and non-`Error` object, so the Apollo or Mercurius formatter still runs and the error shows in both Sentry and the GraphQL response.
- **The references disagree twice.** `@OnEvent`: the tracing reference says unhandled exceptions in handlers are auto-captured (they bypass `SentryGlobalFilter`), the error reference says background jobs including `@OnEvent` are not captured. WebSockets: the skill's troubleshooting says put `@SentryExceptionCaptured()` on the gateway's `handleConnection`/`handleDisconnect`, the error reference says catch manually in gateway methods. Confirm in the current docs.

## Context per request and per job

Scopes, tags, context and breadcrumbs work as in [NODE.md](NODE.md#scopes-and-context); isolation uses `AsyncLocalStorage` per request.

- **Set the user in middleware, before the controller:**

```typescript
// auth.middleware.ts
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/nestjs";

@Injectable()
export class SentryContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user;  // populated by auth guard
    if (user) {
      Sentry.setUser({
        id: String(user.id),
        email: user.email,
        username: user.username,
      });
      Sentry.setTag("user.role", user.role);
      Sentry.setTag("tenant.id", String(user.tenantId));
    }
    next();
  }
}
```

```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SentryContextMiddleware).forRoutes("*");
  }
}
```

- **Wrap every background handler in `withIsolationScope`.** `@Cron`, `@Interval`, `@OnEvent` and `@Processor` share the default isolation scope with HTTP requests, so without it a cron's breadcrumbs leak into the next HTTP error.

```typescript
@Injectable()
export class ReportGenerationService {
  @Cron(CronExpression.EVERY_HOUR)
  async generateReports() {
    Sentry.withIsolationScope(async () => {
      Sentry.setTag("job", "report-generation");
      Sentry.addBreadcrumb({ message: "Starting report generation", level: "info" });
      try {
        await this.doGenerate();
      } catch (err) {
        Sentry.captureException(err);
      }
    });
  }
}
```

## Tracing

Span APIs, sampling, `beforeSendSpan`, `tracePropagationTargets` and queue propagation are in [NODE-TRACING.md](NODE-TRACING.md). Prefer `tracesSampler` over a flat `tracesSampleRate` in production: drop health checks, adjust per route, honour distributed decisions. The Nest tracing reference does it with `parentSampled`:

```typescript
Sentry.init({
  dsn: "YOUR_DSN",
  tracesSampler: ({ name, attributes, parentSampled }) => {
    // Drop health check endpoints
    if (/\/(health|ping|readiness|liveness)/.test(name)) return 0;

    // Always capture authentication flows
    if (name.includes("/auth/")) return 1;

    // Inherit parent's sampling decision (distributed tracing)
    if (parentSampled !== undefined) return parentSampled;

    // Default 10%
    return 0.1;
  },
});
```

- **The sources conflict on the parent check.** The Nest reference returns `parentSampled` by hand, as above. The Node reference says always prefer `inheritOrSampleWith(fallbackRate)` over checking `parentSampled` directly, because it propagates rates accurately and sets `sentry-sampled` in `baggage` ([NODE-TRACING.md](NODE-TRACING.md#sampling)).

### How Nest is traced

```
@sentry/nestjs
  ├── Sentry.init() → auto-adds nestIntegration() to default integrations
  ├── nestIntegration() → registers 3 OTel instrumentations:
  │     ├── @opentelemetry/instrumentation-nestjs-core   → app_creation, request_context, handler spans
  │     ├── SentryNestInstrumentation                    → middleware, guard, pipe, interceptor, filter spans
  │     └── SentryNestEventInstrumentation               → @OnEvent handler spans
  ├── SentryModule.forRoot() → registers SentryTracingInterceptor globally
  ├── SentryTracingInterceptor → sets HTTP transaction names from Express/Fastify route patterns
  └── SentryGlobalFilter → captures unhandled exceptions (HTTP, GraphQL, RPC)
```

- **Spans:** `app_creation.nestjs` (bootstrap), `request_context.nestjs` (the whole request), `handler.nestjs` (each route handler). Middleware, guards, pipes, interceptors and filters all share op `middleware.nestjs` (`SentryNestInstrumentation` patches `@Injectable` and `@Catch`).
- **Transaction names are parameterized routes:** `GET /users/:id`, from `req.route.path` on Express and `req.routeOptions.url` on Fastify.

```
GET /api/users/:id  (transaction name)
  └── request_context.nestjs
        ├── AuthGuard              (middleware.nestjs)
        ├── ParseIntPipe           (middleware.nestjs)
        ├── LoggingInterceptor     (middleware.nestjs, before route)
        │     └── handler.nestjs
        │           └── db query span (auto from pg/mysql/etc.)
        └── LoggingInterceptor - Interceptors - After Route  (middleware.nestjs)
```

### `@SentryTraced(op?)`

Span name is the method name; op is the argument, default `"function"`. Works on sync and async methods and copies `reflect-metadata` keys, so DI keeps working.

```typescript
import { SentryTraced } from "@sentry/nestjs";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OrderService {
  @SentryTraced("db.query") // op="db.query", name="findOrder" (method name)
  async findOrder(id: string) {
    return this.orderRepo.findOne({ where: { id } });
  }

  @SentryTraced() // op="function" (default)
  async processOrder(data: CreateOrderDto) {
    return this.process(data);
  }
}
```

### `@OnEvent` handlers

Auto-traced with `@nestjs/event-emitter` >= 2.0.0: span name `"event user.created"`, op `"event.nestjs"`, always `forceTransaction: true`, so each handler is its own root transaction, not a child of the emitting request (expected, not a bug). Several events give `"event user.created|user.updated"`; wildcards like `"order.*"` work.

### GraphQL

`graphqlIntegration` (default) traces query, mutation and subscription execution and individual resolver fields. Fastify plus GraphQL has known edge cases (https://github.com/getsentry/sentry-javascript/issues/13388): prefer Express for GraphQL.

### Microservices

| Transport | Auto | Mechanism |
|---|---|---|
| AMQP / RabbitMQ | Yes | `amqplibIntegration`: `amqp.publish` and `amqp.process` spans, headers injected |
| Kafka (KafkaJS) | Yes | `kafkaIntegration`: `kafka.send` and `kafka.process`, trace context in record headers |
| Redis pub/sub | Partly | `redisIntegration` traces commands only |
| TCP | No | No OpenTelemetry instrumentation |
| NATS, gRPC | No | Community OpenTelemetry package needed |

Wrap every `@EventPattern()` and `@MessagePattern()` handler in an explicit span, with `forceTransaction: true` for event handlers that should be root transactions. For TCP, NATS and gRPC use manual `startSpan()` plus `continueTrace()`.

```typescript
@Controller()
export class OrderController {
  @EventPattern("order.created")
  async handleOrderCreated(@Payload() data: OrderEvent) {
    return Sentry.startSpan(
      { name: "handleOrderCreated", op: "kafka", forceTransaction: true },
      async () => {
        await this.orderService.processCreated(data);
      },
    );
  }

  @MessagePattern("order.get")
  async getOrder(@Payload() data: { id: string }) {
    return Sentry.startSpan({ name: "getOrder", op: "rpc" }, async () => {
      return this.orderService.findById(data.id);
    });
  }
}
```

### WebSockets

Not auto-traced: `SentryTracingInterceptor` only handles HTTP. Carry the trace in the message:

```typescript
@WebSocketGateway(3001)
export class ChatGateway {
  @SubscribeMessage("message")
  async handleMessage(@MessageBody() payload: { data: any; _sentry?: any }) {
    const { sentryTrace, baggage } = payload._sentry ?? {};

    return Sentry.continueTrace({ sentryTrace, baggage }, () =>
      Sentry.startSpan(
        {
          name: "ws.chat.message",
          op: "websocket.server",
          forceTransaction: true,
        },
        async () => this.chatService.process(payload.data),
      ),
    );
  }
}

// Client: attach trace context to every message
const traceData = Sentry.getTraceData();
socket.emit("message", {
  data: payload,
  _sentry: {
    sentryTrace: traceData["sentry-trace"],
    baggage: traceData["baggage"],
  },
});
```

### Bull and BullMQ

No dedicated integration. Always `withIsolationScope` first: BullMQ runs jobs concurrently in one process, so without isolation `setTag`, `setUser` and breadcrumbs leak between jobs.

```typescript
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import * as Sentry from "@sentry/nestjs";

@Processor("email")
export class EmailProcessor extends WorkerHost {
  async process(job: Job) {
    return Sentry.withIsolationScope(() =>
      Sentry.startSpan(
        {
          name: `email ${job.name}`,
          op: "queue.process",
          forceTransaction: true,
          attributes: {
            "messaging.system": "bullmq",
            "messaging.destination": "email",
            "messaging.message.id": job.id ?? "unknown",
            "job.name": job.name,
            "job.attemptsMade": job.attemptsMade,
          },
        },
        async () => {
          await this.emailService.sendWelcomeEmail(job.data.userId);
        },
      ),
    );
  }
}
```

To link the job to the request that queued it, the publisher stores the trace data in the job:

```typescript
async queueWelcomeEmail(userId: string) {
  return Sentry.startSpan({ name: "email.queue", op: "queue.publish" }, () => {
    const traceData = Sentry.getTraceData();
    return this.emailQueue.add("send-welcome", { userId, _sentry: traceData });
  });
}
```

and the Bull `@Process()` handler reads `_sentry` from `job.data`: `Sentry.withIsolationScope(() => Sentry.continueTrace({ sentryTrace: _sentry?.["sentry-trace"], baggage: _sentry?.["baggage"] }, () => Sentry.startSpan({ name: "email.send-welcome", op: "queue.process", forceTransaction: true }, ...)))`.

## Databases

| Database | Integration |
|---|---|
| `pg` | `postgresIntegration` (auto) |
| MySQL, MySQL2 | `mysqlIntegration`, `mysql2Integration` (auto) |
| MongoDB, Mongoose | `mongoIntegration`, `mongooseIntegration` (auto) |
| SQL Server (Tedious) | `tediousIntegration` (auto) |
| Redis (`ioredis`, `node-redis`) | `redisIntegration` (auto), spans like `name: "SET user:123"`, op `db.redis` |
| Prisma | Manual: `integrations: [Sentry.prismaIntegration()]` (one list in the tracing reference calls it auto-enabled) |
| Knex | Manual: `import { knexIntegration } from "@sentry/node"`, `integrations: [knexIntegration()]` |
| TypeORM | None: the community `opentelemetry-instrumentation-typeorm` package, imported after `instrument.ts` |
| Sequelize | No known integration |

The Node reference lists Prisma, Sequelize, TypeORM and Knex among auto-instrumented packages ([NODE-TRACING.md](NODE-TRACING.md#what-is-traced-automatically)); confirm for your version. Missing DB spans usually mean the driver loaded before `instrument.ts`.

## Profiling

Setup, lifecycles, platforms and environment variables are in [NODE-TRACING.md](NODE-TRACING.md#profiling). Pin `@sentry/profiling-node` to exactly the `@sentry/nestjs` version (a mismatch crashes the profiler at startup).

```typescript
// instrument.ts  (must be the first file loaded, see main skill)
import * as Sentry from "@sentry/nestjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,  // profile 100% of process sessions
  profileLifecycle: "trace",       // SDK auto-manages profiler lifetime
});
```

For a fleet: `tracesSampleRate: 0.1` (10% of requests) with `profileSessionSampleRate: 0.25` (25% of pods).

## Logs

The `Sentry.logger` API, `fmt`, `beforeSendLog` and attributes are in [SIGNALS-PRACTICE.md](SIGNALS-PRACTICE.md#logs). Nest bridges:

- **NestJS `Logger` / `ConsoleLogger`:** `consoleLoggingIntegration({ forceConsole: true })`; then `new Logger(AppService.name)` sends `.log` as info, `.warn` as warn, `.error` as error.

```typescript
import * as Sentry from "@sentry/nestjs";
import { consoleLoggingIntegration } from "@sentry/nestjs";

Sentry.init({
  dsn: "...",
  enableLogs: true,
  integrations: [
    consoleLoggingIntegration({ forceConsole: true }),
  ],
});
```

- **Pino (SDK 10.18.0+):** `npm install pino`, then `integrations: [pinoIntegration()]`, imported from `@sentry/nestjs`.
- **Winston:** `npm install winston`, then add `createSentryWinstonTransport({ minLevel: "info" })` from `@sentry/nestjs` to `winston.createLogger({ transports: [...] })`.
- **Bunyan is not supported.**

## Metrics

Exactly as in [SIGNALS-PRACTICE.md](SIGNALS-PRACTICE.md#application-metrics) (on by default from 10.25.0, no init flag). Nest example of a counter from a DTO:

```typescript
Sentry.metrics.count('orders.created', 1, {
  attributes: {
    type: dto.type,
    region: dto.region,
  },
});
```

## Crons

`withMonitor`, `captureCheckIn`, `MonitorConfig` and the rate limit are in [NODE.md](NODE.md#crons). Nest adds `@SentryCron` for `@nestjs/schedule`:

- **Prerequisites:** `npm install --save @nestjs/schedule` and `ScheduleModule.forRoot()` in `AppModule` imports.
- **Order matters:** `@SentryCron` goes after `@Cron` (below it, closer to the method). The wrong order silently does nothing.
- **Pass a `monitorConfig` or create the monitor first:** with only a slug (`@SentryCron("nightly-report")`) the monitor must already exist in the Sentry UI; monitors are not auto-created without `monitorConfig`.
- **Imports:** `SentryCron` from `@sentry/nestjs`, the `MonitorConfig` type from `@sentry/core`.

```typescript
import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SentryCron } from "@sentry/nestjs";
import type { MonitorConfig } from "@sentry/core";

const monitorConfig: MonitorConfig = {
  schedule: {
    type: "crontab",
    value: "0 2 * * *",
  },
  timezone: "Europe/Vienna",
  checkinMargin: 10,       // minutes late before MISSED alert
  maxRuntime: 30,          // minutes after IN_PROGRESS before TIMEOUT
  failureIssueThreshold: 3,
  recoveryThreshold: 3,
};

@Injectable()
export class TasksService {
  @Cron("0 2 * * *")
  @SentryCron("nightly-report", monitorConfig)
  async handleNightlyReport() {
    await generateReport();
  }
}
```

- **Bull and BullMQ jobs** have no auto-instrumentation: wrap `process()` in `Sentry.withMonitor("report-queue-processor", async () => {...}, { schedule: { type: "crontab", value: "0 3 * * *" }, timezone: "UTC", checkinMargin: 5, maxRuntime: 60 })`.

## AI monitoring

Integrations, PII controls, manual spans and conversations are in [NODE-TRACING.md](NODE-TRACING.md#ai-monitoring) and [AI-MONITORING.md](AI-MONITORING.md). Nest-reference additions:

- **Wrapped clients:** `const client = Sentry.instrumentOpenAiClient(openai);` and `Sentry.instrumentAnthropicAiClient(anthropic)`. Wrap once at module level and reuse; recording is on by default, governed by `dataCollection.genAI`.
- **Anthropic operations traced:** `client.messages.create()`, `client.messages.stream()`, `client.messages.countTokens()`, `client.beta.messages.create()`. Anthropic spans missing: check the version and add `anthropicAIIntegration()` explicitly.
- **Vercel AI SDK `recordInputs`/`recordOutputs`** are listed with minimum SDK 9.27.0 (the integration table says 10.53.0):

```typescript
const result = await generateText({
  model: openai("gpt-4o"),
  prompt,
  experimental_telemetry: {
    isEnabled: true,
    functionId: "my-text-generation",
    recordInputs: true,
    recordOutputs: true,
  },
});
```

- **Costs** are estimated from models.dev and OpenRouter; the model name must match theirs or no estimate shows. The dashboard is Sentry > AI > Agents (or Insights > AI), tabs Overview, Models, Tools, Traces.

## DI wrappers and lint rules

- **If the project injects a Sentry proxy, use it everywhere except `instrument.ts`,** and except standalone scripts and exception filters outside the DI container, which import `@sentry/nestjs` directly.

```typescript
import { Controller, Inject } from "@nestjs/common";
import { SENTRY_PROXY_TOKEN, type SentryProxyService } from "./sentry-proxy";

@Controller("orders")
export class OrderController {
  constructor(
    @Inject(SENTRY_PROXY_TOKEN) private readonly sentry: SentryProxyService,
    private readonly orderService: OrderService,
  ) {}

  @Post()
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.sentry.startSpan(
      { name: "createOrder", op: "http" },
      async () => this.orderService.create(dto),
    );
  }
}
```

- **ESLint bans `import * as Sentry`** (`no-restricted-syntax`)**:** use named imports (`import { startSpan, captureException } from "@sentry/nestjs"`) or the DI proxy.
- **With a config class,** add each new option to the config type and rebuild, or it is "not recognized".

## Troubleshooting

| Symptom | Fix |
|---|---|
| Exceptions not captured | Register `SentryGlobalFilter` through `APP_FILTER` in `AppModule` |
| Auto-instrumentation not working, DB spans missing | `import "./instrument"` is not the first line of `main.ts` |
| Raw URL transaction names (`/users/123`) | `SentryModule.forRoot()` not imported, or `instrument.ts` loaded after `@nestjs/core` |
| Duplicate spans on every request | `SentryModule.forRoot()` registered twice |
| Middleware, guard, pipe spans missing | `nestIntegration` not registered; `instrument.ts` not first |
| `@OnEvent` spans missing | `@nestjs/event-emitter` below 2.0.0, or `instrument.ts` loaded after the emitter |
| Event spans show as separate transactions | Expected (`forceTransaction: true`) |
| OpenTelemetry package spans missing | Load the package after `instrument.ts` |
| Background job events mixed with requests | Wrap in `Sentry.withIsolationScope(() => { ... })` |
| User missing on events | `Sentry.setUser()` in middleware before the controller |
| GraphQL errors not appearing | Filter registered; no custom filter catching first |
| Prisma spans missing | `integrations: [Sentry.prismaIntegration()]` |
| ConsoleLogger output missing from Logs | `consoleLoggingIntegration({ forceConsole: true })` |
| Too many transactions | Lower the rate, or `tracesSampler` that drops health checks |
| No traces | `tracesSampleRate` set (not `undefined`) |
| Profiling not starting | `tracesSampleRate > 0`, `profileSessionSampleRate > 0` and `@sentry/profiling-node` installed |
| `enableLogs` not working | Needs SDK 9.41.0 or newer |
| Distributed traces broken | `sentry-trace` and `baggage` must pass through proxies and API gateways |

## Prove it

- **A test controller reports:** add this, hit `GET /debug-sentry` and check the Issues dashboard within seconds; remove the test endpoint before production. (`Sentry.captureMessage("NestJS Sentry SDK test");` also works.)

```typescript
import { Controller, Get } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";

@Controller()
export class DebugController {
  @Get("/debug-sentry")
  triggerError() {
    throw new Error("My first Sentry error from NestJS!");
  }

  @Get("/debug-sentry-span")
  triggerSpan() {
    return Sentry.startSpan({ op: "test", name: "NestJS Test Span" }, () => {
      return { status: "span created" };
    });
  }
}
```

- **If nothing appears:** 1, `debug: true`; 2, `SENTRY_DSN` is set in the running process; 3, `import "./instrument"` is the first line of `main.ts`; 4, `SentryModule.forRoot()` is in `AppModule`; 5, the DSN looks like `https://<key>@o<org>.ingest.sentry.io/<project>`.
