FROM node:24.12.0-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY packages/api-contracts/package.json packages/api-contracts/package.json
RUN pnpm install --frozen-lockfile
COPY apps/admin apps/admin
COPY packages/api-contracts packages/api-contracts
RUN pnpm --filter @shellty/admin... build

FROM node:24.12.0-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/apps/admin/.next/standalone ./
COPY --from=build /app/apps/admin/.next/static ./apps/admin/.next/static
USER node
EXPOSE 3002
CMD ["node", "apps/admin/server.js"]
