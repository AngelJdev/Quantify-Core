FROM node:24.14.1-bookworm-slim
WORKDIR /app/apps/web
COPY --chown=node:node apps/web/package.json apps/web/package-lock.json ./
RUN npm ci --no-audit --no-fund && chown -R node:node /app
USER node
EXPOSE 5173
CMD ["node", "node_modules/vite/bin/vite.js", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
