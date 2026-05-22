FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
COPY functions/package.json functions/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install

FROM deps AS build
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS functions
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/functions/dist ./functions/dist
COPY --from=build /app/functions/package.json ./functions/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
CMD ["node", "functions/dist/index.js"]
