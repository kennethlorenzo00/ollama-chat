"""Proxy requests to the Ollama backend with streaming support."""

import logging
from typing import Any

import httpx
from fastapi import Request, Response
from fastapi.responses import StreamingResponse

from app.core.config import settings

logger = logging.getLogger(__name__)

# Headers we do not forward to the backend (auth consumed by us; Host is for backend).
SKIP_HEADERS = frozenset({"authorization", "x-api-key", "host"})


def _forward_headers(request: Request) -> dict[str, str]:
    """Build headers to send to Ollama, excluding auth and host."""
    return {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in SKIP_HEADERS
    }


async def proxy_to_ollama(request: Request, path: str) -> Response:
    """
    Forward the request to OLLAMA_BACKEND_URL + path.
    Streams response when backend returns application/x-ndjson.
    """
    base = settings.OLLAMA_BACKEND_URL.rstrip("/")
    url = f"{base}/{path}" if path else base
    if request.url.query:
        url = f"{url}?{request.url.query}"

    try:
        body = await request.body()
    except Exception as e:
        logger.exception("Failed to read request body: %s", e)
        return Response(status_code=400, content="Bad request")

    headers = _forward_headers(request)

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            req = client.build_request(
                method=request.method,
                url=url,
                content=body,
                headers=headers,
            )
            resp = await client.send(req, stream=True)
    except httpx.TimeoutException:
        logger.warning("Backend timeout for %s %s", request.method, path)
        return Response(status_code=504, content="Backend timeout")
    except Exception as e:
        logger.exception("Backend request failed: %s", e)
        return Response(status_code=502, content="Bad gateway")

    content_type = resp.headers.get("content-type", "")

    if "application/x-ndjson" in content_type or "ndjson" in content_type:
        # Stream NDJSON chunks back to the client.
        async def stream() -> Any:
            async for chunk in resp.aiter_bytes():
                yield chunk

        return StreamingResponse(
            stream(),
            status_code=resp.status_code,
            headers={"content-type": content_type},
            media_type=content_type.split(";")[0].strip(),
        )

    # Non-streaming: read full body and return.
    body_bytes = await resp.aread()
    return Response(
        content=body_bytes,
        status_code=resp.status_code,
        headers={"content-type": content_type},
        media_type=content_type.split(";")[0].strip() if content_type else None,
    )
