from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.core.redis import close_redis, init_redis
from app.api.ws.chat import router as ws_router
from app.api.v1.voice import router as voice_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    yield
    await close_redis()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root-level mount so path is /ws/chat/{room_id}
app.include_router(ws_router)
# Voice routes under /api/v1/voice
app.include_router(voice_router, prefix="/api/v1/voice")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}