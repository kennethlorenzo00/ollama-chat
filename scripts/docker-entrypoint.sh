#!/bin/bash
set -e
# Run migrations so the DB has tables (e.g. users) before the app serves traffic.
uv run alembic upgrade head
exec "$@"
