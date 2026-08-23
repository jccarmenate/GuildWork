FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace=backend

COPY backend backend
RUN npm run prisma:generate --workspace=backend
RUN npm run build --workspace=backend

EXPOSE 4000
CMD ["node", "backend/dist/index.js"]
