# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22

# ---------- base: Node + pnpm ----------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    ASTRO_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# ---------- build: full install + astro build ----------
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
# Build-time settings (public values only, never secrets).
ARG SITE_URL=https://mvrc.com.br
ARG BASE_PATH=/
ARG PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
ENV SITE_URL=${SITE_URL} \
    BASE_PATH=${BASE_PATH} \
    PUBLIC_TURNSTILE_SITE_KEY=${PUBLIC_TURNSTILE_SITE_KEY}
RUN pnpm build

# ---------- prod-deps: runtime dependencies only ----------
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile --no-optional --ignore-scripts

# ---------- runtime: distroless, non-root ----------
FROM gcr.io/distroless/nodejs${NODE_VERSION}-debian12:nonroot AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321 \
    ASTRO_TELEMETRY_DISABLED=1

COPY --from=prod-deps --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /app/dist ./dist
COPY --chown=nonroot:nonroot package.json server.mjs healthcheck.mjs ./

USER nonroot
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/nodejs/bin/node", "healthcheck.mjs"]
CMD ["server.mjs"]
