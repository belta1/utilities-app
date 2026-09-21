# One image, two services (see docker-compose.yml):
#   jsx_server  — `node server.mjs`, the pages server + API. The pages are part of the
#                 image, so one redeploy ships the page and the API it talks to together.
#   coach       — `coach/entrypoint.sh`, Claude Code serving Remote Control as the
#                 unprivileged `node` user, with the coach project at /coach.
FROM node:24-bookworm-slim

# Claude Code native build, installed as root and moved out of $HOME so the coach's home
# can be a volume (login, consent and session state live in /home/node).
ARG CLAUDE_VERSION=latest
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl git \
 && rm -rf /var/lib/apt/lists/* \
 && curl -fsSL https://claude.ai/install.sh | bash -s -- "$CLAUDE_VERSION" \
 && install -m 755 "$(readlink -f /root/.local/bin/claude)" /usr/local/bin/claude \
 && rm -rf /root/.local/share/claude /root/.local/bin/claude \
 && claude --version

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.mjs jsx.mjs api.mjs db.mjs ./
COPY seed ./seed
COPY scripts ./scripts
# Last, because this is what changes most often: everything above it stays cached.
COPY pages ./pages

# The coach project: manual, skills, tools. Its personal data (/coach/data) is a volume.
COPY coach /coach
RUN chmod +x /coach/bin/* /coach/entrypoint.sh && mkdir -p /coach/data && chown -R node:node /coach
ENV PATH="/coach/bin:${PATH}"

ENV NODE_ENV=production PORT=3000 PAGES_DIR=/app/pages DISABLE_AUTOUPDATER=1
EXPOSE 3000
CMD ["node", "server.mjs"]
