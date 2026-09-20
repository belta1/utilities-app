#!/usr/bin/env bash
# Coach container entrypoint: serve Remote Control once the container is signed in.
# Until then, print what to do and wait — never crash-loop. First-time setup, once:
#   docker exec -it coach claude          # accept trust, /login (URL + code), /exit
#   docker attach coach                   # answer "y" to "Enable Remote Control?", Ctrl-p Ctrl-q
set -u
cd /coach
mkdir -p data/history data/notas
[ -f data/PROFILE.md ] || cp /coach/PROFILE.example.md data/PROFILE.md
while true; do
  if [ ! -f "$HOME/.claude/.credentials.json" ]; then
    echo "$(date '+%F %T') coach: not signed in. Run: docker exec -it coach claude  → /login" >&2
    sleep 60; continue
  fi
  echo "$(date '+%F %T') coach: starting Remote Control" >&2
  claude remote-control --name "${COACH_NAME:-Coach RECOMP}" --permission-mode acceptEdits
  echo "$(date '+%F %T') coach: server exited ($?), restarting in 30s" >&2
  sleep 30
done
