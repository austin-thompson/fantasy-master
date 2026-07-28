# syntax=docker/dockerfile:1.7

FROM node:22.22.2-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install --global pnpm@11.17.0
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_OUTPUT=standalone
RUN pnpm prisma:generate
RUN pnpm build

FROM base AS production-dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/generated ./src/generated
COPY package.json next.config.ts prisma.config.ts ./
COPY prisma ./prisma
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma:migrate:deploy && pnpm prisma:seed && node server.js"]
