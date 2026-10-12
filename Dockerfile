# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:24-alpine AS build
WORKDIR /app

# Install pnpm via corepack
RUN corepack enable

# Install dependencies (with dev deps, needed to build)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build the SvelteKit app (adapter-node -> ./build)
COPY . .
RUN pnpm run build

# Keep only production dependencies for the runtime image
RUN pnpm prune --prod

# ---- Runtime stage ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Where store.ts persists the words JSON (mounted as a volume in compose)
ENV WORDS_DATA_FILE=/app/data/words.json
ENV PORT=3000

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Persisted data lives here
RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "build"]
