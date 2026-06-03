# syntax=docker/dockerfile:1

# ---- builder: install all deps, build, prune to production deps ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Install deps first for better layer caching.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
	&& npm prune --omit=dev

# ---- runner: minimal image with build output + production node_modules ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
	PORT=3000 \
	DATA_DIR=/data

# Native modules (better-sqlite3, sharp) were built against the same base in builder.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
# Seed script + schema, so `docker compose run --rm app npm run seed` works.
COPY --from=builder /app/src/lib/server/db ./src/lib/server/db

# Persistent data dir (SQLite + uploaded covers), writable by the non-root user.
RUN mkdir -p /data && chown -R node:node /data
USER node
VOLUME /data
EXPOSE 3000

CMD ["node", "build"]
