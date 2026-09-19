# Production image: server + seed data only. Pages are NOT included — they are
# bind-mounted at /pages from the host (see docker-compose.yml).
FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.mjs jsx.mjs api.mjs db.mjs ./
COPY seed ./seed
ENV NODE_ENV=production PORT=3000 PAGES_DIR=/pages
EXPOSE 3000
CMD ["node", "server.mjs"]
