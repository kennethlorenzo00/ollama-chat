"""
Ollama proxy API: user auth, API keys, request logging, proxy to Ollama.
"""

import logging
from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routes import api_keys, auth, conversations, request_logs
from app.db import get_db
from app.db.models import RequestLog
from app.deps import AuthContext, require_api_key_or_jwt
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
    description="User accounts, API keys, and request logging. Proxy to Ollama with **Authorization: Bearer &lt;JWT or API key&gt;** or **X-API-Key**.",
    version="0.2.0",
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


def _serve_chat_ui() -> FileResponse:
    """Return the chat UI (React SPA when built, else static HTML fallback)."""
    if (_CHAT_UI_DIR / "index.html").exists():
        return FileResponse(_CHAT_UI_DIR / "index.html")
    return FileResponse(_CHAT_HTML_FALLBACK)


# Mount assets first so /chat/assets/* returns JS/CSS, not index.html (route order matters).
if (_CHAT_UI_DIR / "assets").is_dir():
    app.mount("/chat/assets", StaticFiles(directory=_CHAT_UI_DIR / "assets"), name="chat_assets")


@app.get("/chat")
@app.get("/chat/")
@app.get("/chat/{rest:path}")
async def chat_ui(rest: str = "") -> FileResponse:
    """Serve the chat UI for /chat and /chat/* (SPA routes)."""
    return _serve_chat_ui()


@app.get("/favicon.ico")
async def favicon() -> Response:
    """Serve favicon without auth to avoid 401 on browser default request."""
    favicon_path = _CHAT_UI_DIR / "favicon.ico"
    if favicon_path.exists():
        return FileResponse(favicon_path)
    return Response(status_code=204)

# API routes (must be registered before the catch-all proxy)
app.include_router(auth.router, prefix="/api")
app.include_router(api_keys.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(request_logs.router, prefix="/api")


@app.api_route("/{path:path}", methods=["GET", "POST", "DELETE", "PUT", "PATCH"])
async def proxy(
    request: Request,
    path: str,
    auth_ctx: AuthContext = Depends(require_api_key_or_jwt),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Forward requests to Ollama after auth; log each request."""
    log = RequestLog(
        user_id=auth_ctx.user_id,
        api_key_id=auth_ctx.api_key_id,
        path=path,
        method=request.method,
    )
    db.add(log)
    await db.flush()
    response = await proxy_to_ollama(request, path)
    log.status_code = response.status_code
    await db.flush()
    return response
