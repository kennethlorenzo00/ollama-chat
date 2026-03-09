# Ollama (Qwen 2.5) with FastAPI proxy and user accounts

Deploy Ollama in Docker with the Qwen 2.5 model and expose it through a FastAPI proxy. Users register and log in; each user can create API keys and use the chat. All requests to the model are tracked per user.

## Prerequisites

- Docker and Docker Compose (or local: [uv](https://docs.astral.sh/uv/), Node 20+, PostgreSQL)
- (Optional) For GPU: [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) or AMD ROCm setup

## Local development (uv)

```bash
# Install dependencies with uv
uv sync

# Set .env (see Environment). Required: DATABASE_URL, SECRET_KEY
cp .env.example .env

# Run migrations
uv run alembic upgrade head

# Start the API
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend: `cd frontend && npm install && npm run dev`.

## Quick start (Docker)

1. **Configure environment**

   ```bash
   cp .env.example .env
   # Set DATABASE_URL, SECRET_KEY; see Environment table below.
   ```

2. **Build and start the stack**

   ```bash
   docker compose up -d --build
   ```

   Use `--build` whenever you change the app or frontend so the image is rebuilt.

   Then run migrations (one-time):

   ```bash
   docker compose exec api uv run alembic upgrade head
   ```

   If `uv` is not found in the container, use the venv directly:

   ```bash
   docker compose exec api /app/.venv/bin/alembic upgrade head
   ```

3. **Pull the Qwen 2.5 model** (one-time). Replace `<ollama_container>` with the ollama service container name from `docker compose ps`:

   ```bash
   docker exec -it <ollama_container> ollama pull qwen2.5:3b
   ```

   Or use `qwen2.5:1.5b` for a smaller model (986MB). Available tags: `qwen2.5:0.5b`, `qwen2.5:1.5b`, `qwen2.5:3b`, `qwen2.5:7b`, etc.

4. **Register and get an API key**

   - Open **http://localhost:8000/chat** and register (or log in).
   - In the sidebar, open **API keys**, create a key, and copy it (shown once).

5. **Call the API** with your key or JWT

   ```bash
   export API_KEY=your-copied-api-key

   # List models
   curl -H "Authorization: Bearer $API_KEY" http://localhost:8000/api/tags

   # Chat (non-streaming)
   curl -H "Authorization: Bearer $API_KEY" http://localhost:8000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"model":"qwen2.5:3b","messages":[{"role":"user","content":"Hi"}],"stream":false}'

   # Or use X-API-Key header
   curl -H "X-API-Key: $API_KEY" http://localhost:8000/api/tags
   ```

- **Without auth**: `curl http://localhost:8000/api/tags` returns **401**.
- **Health**: `curl http://localhost:8000/` returns service info (no auth).

## Chat UI (/chat)

Open **http://localhost:8000/chat** for a Claude-style conversation interface (React + Tailwind):

- **Auth**: Register or log in with email and password. After login, chat uses your session (JWT); no need to paste an API key in the browser unless you want to use a specific key.
- **API keys**: In the sidebar, open **API keys** to create, list, or revoke keys. Use a key for external clients (e.g. curl, scripts).
- **Request history**: View your LLM request log in the sidebar.
- **New chat / Conversations / Model**: Conversations are stored per user in the database (sync across devices); model selector in header.

Local UI dev: `cd frontend && npm install && npm run dev` (Vite). The Docker image builds the frontend and serves it at `/chat`.

## Testing in Swagger UI (/docs)

1. Open **http://localhost:8000/docs**.
2. Click **Authorize** and enter your API key:
   - For **BearerAuth**: type your key (no "Bearer " prefix).
   - Or for **X-API-Key**: set the header to your key.
3. Use the **Proxy** endpoints with the path and body for the Ollama API:
   - **GET** with path `api/tags` — list models (no body).
   - **POST** with path `api/generate` — body example (non-streaming):
     ```json
     {"model": "qwen2.5:3b", "prompt": "Why is the sky blue?", "stream": false}
     ```
   - **POST** with path `api/chat` — body example (non-streaming):
     ```json
     {"model": "qwen2.5:3b", "messages": [{"role": "user", "content": "Hi"}], "stream": false}
     ```
4. Click **Try it out**, set **path** to e.g. `api/tags` or `api/generate`, add the body for POST, then **Execute**.

The proxy forwards the request to Ollama; request/response format is the same as [Ollama’s API](https://docs.ollama.com/api/generate.md) (generate, chat, etc.).

## Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL URL (e.g. `postgresql+asyncpg://user:pass@host/db`). Required. |
| `SECRET_KEY` | Secret for JWT signing. Required. Use a long random string in production. |
| `OLLAMA_BACKEND_URL` | Ollama URL; default `http://ollama:11434` in Docker. |

## Clear cache and reset database

If the app misbehaves after switching to server-side conversations (e.g. old client cache or bad DB state), clear both.

**1. Browser (localStorage)**

- Open the app (e.g. http://localhost:8000/chat).
- Open DevTools (F12) → **Application** (Chrome) or **Storage** (Firefox) → **Local Storage** → select your origin.
- Remove these keys (or “Clear All” for that origin):
  - `ollama_chat_conversations` (old client-side chats; no longer used)
  - `ollama_chat_token` (logs you out)
  - `ollama_chat_theme` (optional; resets theme to light)
- Reload the page. If you removed the token, log in again.

**2. Database**

- **Only conversations/chats** (keep users and API keys):

  Connect to PostgreSQL and run:

  ```sql
  TRUNCATE messages, conversations RESTART IDENTITY CASCADE;
  ```

  Or with Docker (default compose uses user `ollama`, db `ollama_chat`):

  ```bash
  docker compose exec postgres psql -U ollama -d ollama_chat -c "TRUNCATE messages, conversations RESTART IDENTITY CASCADE;"
  ```

- **Full reset** (drop all tables and re-run migrations):

  ```bash
  uv run alembic downgrade base
  uv run alembic upgrade head
  ```

  In Docker:

  ```bash
  docker compose exec api uv run alembic downgrade base
  docker compose exec api uv run alembic upgrade head
  ```

  If `uv` is not in the container path, use `/app/.venv/bin/alembic` instead of `uv run alembic`.

## Troubleshooting

- **404 on POST /api/chat**: Ollama returns 404 when the model is not available. Pull the model first (see step 3 in Quick start):
  ```bash
  docker compose ps   # note the ollama container name (e.g. ollama-2-5b-ollama-1)
  docker exec -it <ollama_container> ollama pull qwen2.5:3b
  docker exec -it <ollama_container> ollama list   # verify the model appears
  ```
  Use the same model name in the UI (e.g. `qwen2.5:3b`) as in `ollama list`.

## GPU

- **Nvidia**: In `docker-compose.yaml`, uncomment the `deploy.resources.reservations.devices` block for the `ollama` service and ensure the host has the NVIDIA Container Toolkit installed.
- **AMD**: Use image `ollama/ollama:rocm` and add `device_ids: ["/dev/kfd", "/dev/dri"]` (or the equivalent `devices` mapping) for the `ollama` service.

## License

MIT.
