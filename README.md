# Ollama (Qwen 2.5) with FastAPI API-key wrapper

Deploy Ollama in Docker with the Qwen 2.5 model and expose it through a FastAPI proxy that requires an API key. Ollama is not exposed to the host; only the proxy is.

## Prerequisites

- Docker and Docker Compose
- (Optional) For GPU: [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) or AMD ROCm setup

## Quick start

1. **Set your API key**

   ```bash
   cp .env.example .env
   # Edit .env and set API_KEYS=your-secret-key (comma-separated for multiple keys)
   ```

2. **Start the stack**

   ```bash
   docker compose up -d
   ```

3. **Pull the Qwen 2.5 model** (one-time). Replace `<ollama_container>` with the ollama service container name from `docker compose ps`:

   ```bash
   docker exec -it <ollama_container> ollama pull qwen2.5:3b
   ```

   Or use `qwen2.5:1.5b` for a smaller model (986MB). Available tags: `qwen2.5:0.5b`, `qwen2.5:1.5b`, `qwen2.5:3b`, `qwen2.5:7b`, etc.

4. **Call the API** with your key

   ```bash
   export API_KEY=your-secret-key

   # List models
   curl -H "Authorization: Bearer $API_KEY" http://localhost:8000/api/tags

   # Chat (non-streaming)
   curl -H "Authorization: Bearer $API_KEY" http://localhost:8000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"model":"qwen2.5:3b","messages":[{"role":"user","content":"Hi"}],"stream":false}'

   # Or use X-API-Key header
   curl -H "X-API-Key: $API_KEY" http://localhost:8000/api/tags
   ```

- **Without API key**: `curl http://localhost:8000/api/tags` returns **401**.
- **Health**: `curl http://localhost:8000/` returns service info (no auth).

## Chat UI (/chat)

Open **http://localhost:8000/chat** for a Claude-style conversation interface (React + Tailwind):

- **API key**: Enter once (stored in the browser only); use the same value as in `.env` `API_KEYS`. If you entered the wrong key, use **Change API key** at the bottom of the sidebar to re-enter it.
- **New chat**: Start a new conversation from the sidebar.
- **Conversations**: Listed in the dark sidebar; click to switch. Data is stored in the browser.
- **Model**: Choose `qwen2.5:3b`, `qwen2.5:1.5b`, or `qwen2.5:0.5b` above the input.

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
| `API_KEYS` | Comma-separated list of valid API keys (required in production). |
| `API_KEY` | Single API key (alternative to `API_KEYS`). |
| `OLLAMA_BACKEND_URL` | Ollama URL; default `http://ollama:11434` in Docker. |

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
