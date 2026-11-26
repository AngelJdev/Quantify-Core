FROM node:24.14.1-bookworm-slim AS build
WORKDIR /app/apps/web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY apps/web ./
COPY packages /app/packages
COPY assets/images /app/assets/images
COPY docs/GUI/assets /app/docs/GUI/assets
COPY docs/GUI/identidad/guia/modelo.json /app/docs/GUI/identidad/guia/modelo.json
ARG VITE_API_BASE_URL=http://localhost:3000/api/v1
ARG VITE_OIDC_ISSUER=http://localhost:8180/realms/quantify
ARG VITE_OIDC_CLIENT_ID=quantify-web
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_OIDC_ISSUER=$VITE_OIDC_ISSUER
ENV VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
RUN npm run build

FROM nginx:1.28-alpine
COPY infrastructure/docker/web.nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
ENTRYPOINT ["nginx", "-g", "daemon off;"]
