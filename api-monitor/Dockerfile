FROM node:20-slim

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

COPY . .
RUN pnpm run build

ENV NODE_ENV=production
EXPOSE ${PORT:-3000}

CMD ["node", "dist/server.js"]
