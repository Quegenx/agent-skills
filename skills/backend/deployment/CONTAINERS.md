# Containers

An image packages the app with its runtime and dependencies, so it runs the same on a laptop, in CI and in production. No "works on my machine", no runtime version drift between servers.

## A multi-stage Dockerfile (Node / TypeScript)

```dockerfile
# build: full toolchain, never shipped
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci          # cached until the lockfile changes
COPY . .
RUN npm run build                                       # this stage keeps dev tools (migrations run from it)

# production dependencies only
FROM build AS prod-deps
RUN npm prune --omit=dev

# runtime: only what runs
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./
USER node
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

- **Stages:** the build stage has compilers, dev dependencies and source; the final stage copies out only the built output and production dependencies. No source, no dev tooling, no build caches in what ships.
- **Layer order is cache order.** Copy the files that change rarely (the manifest and lockfile) and install before copying the source, so a code change rebuilds from `COPY . .` and reuses the installed dependencies.
- **`npm ci`, not `npm install`:** installs exactly the lockfile and fails if it's out of date.
- **Run as a non-root user.** The official Node images include a `node` user; distroless images run as non-root by default. A non-root process can't bind ports below 1024, so listen on 8080 (or similar).
- **`CMD ["node", ...]`, not `npm start`:** npm in front of the process doesn't pass stop signals on cleanly, so shutdown hooks don't run.

## `.dockerignore`

```
node_modules
dist
.git
.env*
*.md
docker-compose*.yml
coverage
```

It keeps the build context small (faster builds) and keeps secrets and local artifacts out of the image. Without it, a `COPY . .` can copy your `.env` into a layer, where it stays even if a later step deletes it.

## Choosing the base image

| Base | Size | Notes |
|---|---|---|
| `node:22-bookworm-slim` | small | glibc, has a shell. The default. |
| `node:22-alpine` | smaller | musl libc: native modules built for glibc may fail or need rebuilding. Test before switching. |
| distroless Node | smaller | no shell, no package manager, non-root. Best security posture; debugging needs a separate debug image. |

Pin the major version (and the digest in production), and rebuild regularly to pick up base-image security fixes.

## Commands

```bash
docker build -t myapp .
docker run -p 8080:8080 --env-file .env.local myapp   # -d to run in the background
docker ps                                              # running containers
docker stop <container>
```

## A local stack with Docker Compose

One command starts the app and everything it depends on:

```yaml
services:
  api:
    build: .
    ports: ["3000:8080"]
    env_file: .env.local                     # not committed
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_started }
      migrate: { condition: service_completed_successfully }

  migrate:
    build: { context: ., target: build }     # the stage that has the migration tool
    command: ["npm", "run", "db:migrate"]
    env_file: .env.local
    depends_on:
      postgres: { condition: service_healthy }

  postgres:
    image: postgres:17-alpine
    environment: { POSTGRES_DB: app, POSTGRES_USER: postgres, POSTGRES_PASSWORD: postgres }
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  postgres_data:
```

- **Wait for health, not for start:** `depends_on` with `service_healthy` waits for the database to accept connections; a plain `depends_on` only waits for the container to exist.
- **Migrations are a one-shot step,** not something the app runs on startup (several instances starting at once would race). Run them from an image that has the migration tool (the build stage, or a dedicated stage); the runtime image usually doesn't have it. In deployment, the same rule holds: a CI or release step applies migrations before the new version starts.
- The development credentials in a compose file are for local containers only. Real secrets come from the platform's secret store.
- **Supabase and Convex bring their own local stacks:** `supabase start` runs Postgres, auth, storage and the rest in containers (with `supabase db reset` applying migrations and seed), and `npx convex dev` runs the Convex backend for development. Use Compose for what those don't cover.

## Self-hosting a tool someone else ships

OpenSEO's Docker setup is a worked example of running a third-party app's image on your own machine (MIT, [open-seo] `compose.yaml` and openseo.so/docs/self-hosting/docker):

- **Pin the image.** It defaults to `ghcr.io/every-app/open-seo:latest` and takes `OPEN_SEO_IMAGE=ghcr.io/every-app/open-seo:v1.2.3` to pin; pin it, per the build-once rule in [SKILL.md](SKILL.md).
- **Publish the port on loopback only:** `127.0.0.1:${PORT:-3001}`, so the container isn't reachable from the network until you put something in front of it.
- **A no-auth mode stays private.** `AUTH_MODE=local_noauth` signs everyone in as `admin@localhost`: "Only expose it behind your own auth-protected reverse proxy, tunnel, or private network." `ALLOWED_HOST` names the one hostname the reverse proxy may use.
- **`env_file` passes everything; `environment:` passes only what it lists.** The compose file added `env_file: .env` because without it "any .env value not listed there (e.g. OPENROUTER_API_KEY) silently never reached the app." After changing `.env`, recreate the container (`docker compose up -d --force-recreate open-seo`) and confirm the merged config with `docker compose config`.
- **State on a named volume** (`open_seo_data:/app/.wrangler`) and a health endpoint (`/api/health`) that reports configuration and database status.
- **Telemetry disclosed, with an opt-out.** Anonymized heartbeats with aggregate counts and a random install ID, "No URLs, keywords, prompts, emails, or IP-derived location", nothing from idle installs; `OPENSEO_TELEMETRY_DISABLED=1` or `DO_NOT_TRACK=1` turns it off.
- **An MCP server behind an identity proxy needs the proxy's OAuth.** Behind Cloudflare Access, Managed OAuth must be turned on for MCP clients ("not enabled by default"), with loopback redirect URIs (`http://localhost:PORT/callback`) allowed for CLI and desktop agents and HTTPS redirect URIs for web connectors: "Without this, clients can't finish Dynamic Client Registration and log in but expose no tools." [open-seo, SELF_HOSTING_CLOUDFLARE_OPERATIONS.md]

## Health checks

Expose a cheap endpoint (`GET /health`) that reports whether the process can serve: it checks its own critical dependencies (the database answers a trivial query) and returns 200 or 503. Keep it fast and unauthenticated but uninformative to outsiders. Checking dependencies makes it a readiness check; anything that restarts the container on failure should call a separate liveness endpoint that checks only the process, or a database blip restarts every instance (the `observability` skill's HEALTH.md).

```yaml
api:
  healthcheck:
    test: ["CMD", "node", "-e", "fetch('http://localhost:8080/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

`curl` isn't in every image and distroless images have no shell, so either probe with the runtime you already have (as above) or let the orchestrator probe the endpoint over HTTP from outside.

## Common mistakes

1. Shipping the build stage (compilers, dev dependencies, source) as the production image.
2. One stage for everything, so source and tooling end up in production.
3. Running as root.
4. No `.dockerignore`, so `.env` and `.git` land in the image.
5. Configuration baked into the image, so each environment needs its own build.

## Prove it

Build the image, change one source file and rebuild: the dependency install layer comes from cache. Inspect the final image (`docker run --rm myapp ls -la /app`, `docker history myapp`): no source, no `.env`, no dev dependencies, and `whoami` isn't root. Run `docker compose up` on a clean machine: the API starts only after the database is healthy and migrations succeeded.
