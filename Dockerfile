# Production Dockerfile for Creator Money OS (MoneyPlugHub)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json tsconfig*.json vite.config.ts postcss.config.js tailwind.config.js ./
RUN npm ci

# Copy source and public assets
COPY public ./public
COPY src ./src
COPY data ./data
COPY index.html ./

# Build client and server
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data

EXPOSE 3001

CMD ["node", "dist/backend/server.js"]
