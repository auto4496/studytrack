# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS base
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM dependencies AS build
COPY server/prisma ./server/prisma
RUN npm run db:generate
COPY server/src ./server/src
COPY server/tsconfig.json ./server/tsconfig.json
COPY client ./client
COPY vite.config.ts ./vite.config.ts
RUN npm run build

# Explicit one-off migration/seed image; never used as the serving container.
FROM build AS tools
ENV NODE_ENV=production
USER node
CMD ["npm", "run", "db:migrate"]

FROM build AS production-dependencies
RUN npm prune --omit=dev

FROM base AS runtime
ARG VCS_REF=unknown
LABEL org.opencontainers.image.title="StudyTrack" \
      org.opencontainers.image.source="https://github.com/auto4496/studytrack" \
      org.opencontainers.image.revision="${VCS_REF}"
ENV NODE_ENV=production PORT=8080
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=node:node /app/server/dist ./server/dist
COPY --from=build --chown=node:node /app/dist/client ./dist/client
COPY --chown=node:node package.json ./package.json
USER node
EXPOSE 8080
HEALTHCHECK --interval=5s --timeout=3s --start-period=15s --retries=12 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health',{signal:AbortSignal.timeout(2000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "server/dist/index.js"]
