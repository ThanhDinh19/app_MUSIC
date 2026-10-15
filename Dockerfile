# syntax=docker/dockerfile:1
# Image chạy Nocturne: một tiến trình Node phục vụ cả API lẫn giao diện PWA đã build.

# ───────────── 1. Build: cài đủ dependency, build client (Vite) + server (esbuild) ─────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --no-audit --no-fund

COPY tsconfig.base.json ./
COPY shared ./shared
COPY server ./server
COPY client ./client
RUN npm run build

# ───────────── 2. Runtime: chỉ dependency production của server + file đã build ─────────────
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4000
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev --workspace @nocturne/server --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
COPY server/storage/seed ./server/storage/seed
COPY server/storage/media ./server/storage/media

# Dữ liệu đang chạy (JSON) và token Zalo nằm trong volume → không mất khi build lại image.
RUN mkdir -p server/storage/data server/storage/secrets \
 && chown -R node:node server/storage/data server/storage/secrets
VOLUME ["/app/server/storage/data", "/app/server/storage/secrets"]

USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--enable-source-maps", "server/dist/index.js"]
