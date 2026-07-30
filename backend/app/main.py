from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.redis import close_redis, init_redis
from app.core.db import init_db
from app.api.ws.chat import router as ws_router
from app.api.v1.voice import router as voice_router
from app.api.v1.chat import router as chat_router
from app.middleware.rate_limit import HTTPRateLimitMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    await init_db()
    yield
    await close_redis()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTP Rate Limiting Middleware (60 requests per minute per IP)
app.add_middleware(HTTPRateLimitMiddleware, max_requests=60, window_seconds=60)

# Mount Routers
app.include_router(ws_router)
app.include_router(voice_router, prefix="/api/v1/voice")
app.include_router(chat_router, prefix="/api/v1/chat")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}