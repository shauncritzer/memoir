FROM n8nio/n8n:latest

# Railway assigns $PORT dynamically; n8n reads N8N_PORT
ENV N8N_PORT=${PORT:-5678}
ENV N8N_PROTOCOL=https
ENV GENERIC_TIMEZONE=America/New_York
# Persist workflows in SQLite (Railway volume at /data)
ENV N8N_USER_FOLDER=/data
ENV DB_TYPE=sqlite
ENV DB_SQLITE_DATABASE=/data/n8n.sqlite

EXPOSE ${N8N_PORT}
