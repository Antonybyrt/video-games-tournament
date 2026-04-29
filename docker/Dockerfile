FROM node:23-alpine AS builder

RUN corepack enable
WORKDIR /home/node
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:23-alpine AS runner

USER node
WORKDIR /home/node
COPY --from=builder --chown=node:node /home/node/dist ./dist
COPY --from=builder --chown=node:node /home/node/node_modules ./node_modules
COPY --from=builder --chown=node:node /home/node/package.json .
EXPOSE 3000
CMD ["node", "dist/main"]
