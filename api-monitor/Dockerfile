FROM node:20-slim

RUN npm install -g pnpm

WORKDIR /app

# Copy only api-monitor files from the repo root build context
COPY api-monitor/package.json api-monitor/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

COPY api-monitor/ .
RUN pnpm run build

ENV NODE_ENV=production
EXPOSE ${PORT:-3000}

CMD ["node", "dist/server.js"]
