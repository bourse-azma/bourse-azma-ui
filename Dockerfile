FROM node:22-alpine AS build
ARG NODE_BUILD_HEAP_MB=256
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN NODE_OPTIONS="--max-old-space-size=${NODE_BUILD_HEAP_MB}" npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine-slim
ARG NGINX_CONF=nginx.conf
WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist ./
COPY --chown=101:101 --chmod=644 ${NGINX_CONF} /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
