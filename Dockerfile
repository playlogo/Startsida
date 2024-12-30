# Build ------------------------------------------- 
FROM oven/bun:1.1-alpine AS build
WORKDIR /app

COPY frontend/ ./

RUN bun install 
RUN bun run build

# Serve -------------------------------------------
FROM denoland/deno:alpine-2.1.4

EXPOSE 8000

WORKDIR /app

USER deno

# Copy source
COPY --from=build /app/dist ./dist

COPY backend/ ./

# Compile app
RUN deno task cache

CMD ["task", "run"]

