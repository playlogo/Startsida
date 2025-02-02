# Build ------------------------------------------- 
FROM oven/bun:1.1-alpine AS build

RUN apk add --no-cache git

WORKDIR /app

COPY frontend/ ./
COPY .git .

RUN bun install 
RUN bun run build

# Serve -------------------------------------------
FROM denoland/deno:alpine-2.1.4

RUN apk add bash wget git curl python3 awake
EXPOSE 8000

# Fix permissions
RUN mkdir -p /app/cache && chown -R 1000:1000 /app/cache
RUN mkdir -p /app/data && chown -R 1000:1000 /app/data

USER deno

WORKDIR /app

# Copy source
COPY --from=build /app/dist ./dist

COPY backend/ ./

# Compile app
RUN deno task cache

CMD ["task", "run"]

