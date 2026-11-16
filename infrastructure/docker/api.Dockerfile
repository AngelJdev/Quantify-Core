FROM node:24.14.1-bookworm-slim AS build
WORKDIR /app/services/api
COPY services/api/package.json services/api/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY services/api/tsconfig.json ./
COPY services/api/src ./src
COPY services/api/telemetry/src ./telemetry/src
COPY packages/contracts /app/packages/contracts
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

FROM node:24.14.1-bookworm-slim
ARG APP_REVISION=unversioned
LABEL org.opencontainers.image.revision=$APP_REVISION
ENV APP_REVISION=$APP_REVISION
ENV NODE_ENV=production
WORKDIR /app/services/api
COPY --from=build --chown=node:node /app/services/api/node_modules ./node_modules
COPY --from=build --chown=node:node /app/services/api/build ./build
COPY --from=build --chown=node:node /app/packages/contracts /app/packages/contracts
USER node
CMD ["node", "build/src/main.js"]
