# Stage 1: build React chat UI
FROM node:20-slim AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npx vite build

# Stage 2: FastAPI + serve built UI (uv)
FROM python:3.12-slim

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
ENV PATH="/app/.venv/bin:/root/.local/bin:/usr/local/bin:$PATH"

COPY pyproject.toml .
RUN pip install --no-cache-dir uv && uv sync --no-dev --no-install-project

# Copy backend first; then add frontend build into static (so app/api is never overwritten)
COPY app/ ./app/
RUN test -d ./app/api && test -d ./app/api/routes || (echo "ERROR: app/api missing in build context" && exit 1)
COPY alembic.ini .
COPY alembic/ ./alembic/
ENV PYTHONPATH=/app

RUN mkdir -p ./app/static/chat-ui
COPY --from=frontend /frontend/dist/. ./app/static/chat-ui/

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]