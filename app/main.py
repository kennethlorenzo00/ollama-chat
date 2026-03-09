"""
Ollama proxy API: validates API key and forwards requests to Ollama.
"""

import logging
from pathlib import Path

from fastapi import Depends, FastAPI, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.deps import require_api_key
from app.proxy import proxy_to_ollama

# Built React app (frontend/dist) is copied here in Docker; fallback to static chat.html if missing.
_CHAT_UI_DIR = Path(__file__).resolve().parent / "static" / "chat-ui"
_CHAT_HTML_FALLBACK = Path(__file__).resolve().parent / "static" / "chat.html"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Ollama Proxy API",
    description="API-key-protected proxy to Ollama. Send requests with **Authorization: Bearer &lt;key&gt;** or **X-API-Key: &lt;key&gt;**.",
    version="0.1.0",
)

_original_openapi = app.openapi


def _custom_openapi() -> dict:
    """Add security schemes so /docs shows an Authorize button."""
    if app.openapi_schema:
        return app.openapi_schema
    openapi = _original_openapi()
    openapi.setdefault("components", {})["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "API key",
            "description": "Your API key (same value as in .env API_KEYS)",
        },
        "ApiKeyHeader": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "Your API key (alternative to Bearer)",
        },
    }
    for path_key, path_item in openapi.get("paths", {}).items():
        if path_key != "/" and "path" in path_key:
            for op in path_item.values():
                if isinstance(op, dict):
                    op["security"] = [
                        {"BearerAuth": []},
                        {"ApiKeyHeader": []},
                    ]
    app.openapi_schema = openapi
    return openapi


app.openapi = _custom_openapi


@app.get("/")
async def root() -> JSONResponse:
    """Health/info endpoint; no auth required for basic liveness."""
    return JSONResponse(
        content={
            "service": "ollama-proxy",
            "docs": "/docs",
            "chat": "/chat",
            "ollama_api": "Use /api/* with API key (Bearer or X-API-Key).",
        }
    )


@app.get("/chat")
@app.get("/chat/")
async def chat_ui() -> FileResponse:
    """Serve the chat UI (React SPA when built, else static HTML fallback)."""
    if (_CHAT_UI_DIR / "index.html").exists():
        return FileResponse(_CHAT_UI_DIR / "index.html")
    return FileResponse(_CHAT_HTML_FALLBACK)


if (_CHAT_UI_DIR / "assets").is_dir():
    app.mount("/chat/assets", StaticFiles(directory=_CHAT_UI_DIR / "assets"), name="chat_assets")


@app.api_route("/{path:path}", methods=["GET", "POST", "DELETE", "PUT", "PATCH"])
async def proxy(
    request: Request,
    path: str,
    _: None = Depends(require_api_key),
) -> Response:
    """Forward all /api/* (and other) requests to Ollama after API key check."""
    return await proxy_to_ollama(request, path)
