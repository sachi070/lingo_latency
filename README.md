
# 🌐 LingoLatency — Real-Time Multi-Lingual Translation Mesh

A low-latency, real-time distributed chat application built with **FastAPI**, **WebSockets**, **Redis**, **PostgreSQL**, and **Groq AI (Llama 3.1)**.

Users can chat in their native languages while messages are automatically translated and delivered in real-time to other participants with minimal latency.

---

## 🏗️ System Architecture

* **Backend Cluster**: Scaled FastAPI instances (`backend1`, `backend2`, `backend3`) handling WebSocket sessions and REST endpoints.
* **Load Balancer**: **Nginx** routing WebSocket traffic and REST requests round-robin across backend replicas.
* **Cache & Pub/Sub Layer**: **Redis** for broadcasting real-time WebSocket payloads across nodes and caching repeated translation frames.
* **Database**: **PostgreSQL** (via `asyncpg` & SQLAlchemy) managing user accounts and chat room states.
* **Translation Engine**: **Groq Cloud API (`llama-3.1-8b-instant`)** for high-speed LLM translation execution.

---

## ⚡ Quickstart Guide

### 1. Prerequisites

* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* [wscat](https://www.npmjs.com/package/wscat) (for testing WebSocket connections)
```bash
npm install -g wscat

```



---

### 2. Environment Setup

Create a `.env` file in the project root directory:

```env
# Groq API Configuration
GROQ_API_KEY=gsk_your_actual_groq_api_key_here

# JWT Authentication
JWT_SECRET=super_dense_secret_key_change_in_production_32_bytes_min

# Database & Cache Connection Strings
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/lingo_db
REDIS_URL=redis://redis:6379/0

```

---

### 3. Build & Launch Containers

Run Docker Compose to build and start the entire cluster in detached mode:

```bash
docker compose up -d --build

```

Verify that all services are active:

```bash
docker compose ps

```

---

### 4. Initialize Database Schemas

Compile the database tables inside the running cluster:

```bash
docker compose exec -T backend1 python -c "
import asyncio
from app.db.session import engine
from app.models.user import Base

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(init())
print('Database schemas compiled successfully!')
"

```

---

## 🧪 Quick Test Script

Run this bash script in your terminal to create two users (Hindi & Spanish), generate a room, and output authentication tokens:

```bash
# 1. Register Users
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user_hindi", "password": "securepassword123", "preferred_language": "hi"}'

curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user_spanish", "password": "securepassword123", "preferred_language": "es"}'

# 2. Get Access Tokens
TOKEN_A=$(curl -X POST http://localhost/api/auth/login \
  -d "username=user_hindi&password=securepassword123" \
  | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

TOKEN_B=$(curl -X POST http://localhost/api/auth/login \
  -d "username=user_spanish&password=securepassword123" \
  | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

# 3. Create a Chat Room
ROOM_DATA=$(curl -X POST "http://localhost/api/rooms/create?name=GlobalMesh" \
  -H "Authorization: Bearer $TOKEN_A")

ROOM_ID=$(echo $ROOM_DATA | grep -o '"room_id":"[^"]*' | grep -o '[^"]*$')

# Display connection parameters
echo "================================================="
echo "ROOM_ID:  $ROOM_ID"
echo "TOKEN_A:  $TOKEN_A"
echo "TOKEN_B:  $TOKEN_B"
echo "================================================="

```

---

## 💬 Live WebSocket Translation Demo

Open **two terminal windows** side-by-side to simulate a cross-language conversation.

### Terminal Tab #1 — User A (Hindi Profile)

```bash
wscat -c "ws://localhost/ws/<ROOM_ID>?token=<TOKEN_A>"

```

### Terminal Tab #2 — User B (Spanish Profile)

```bash
wscat -c "ws://localhost/ws/<ROOM_ID>?token=<TOKEN_B>"

```

### Send a Message:

In **Terminal Tab #2 (Spanish)**, paste:

```json
{"type": "message", "text": "¡Hola amigos, bienvenidos a nuestra aplicación!", "timestamp": "2026-07-29T12:00:00Z"}

```

### Watch the Output:

**Terminal Tab #1 (Hindi)** instantly receives the translated payload:

```json
{
  "type": "message",
  "sender_id": "2",
  "sender_name": "user_spanish",
  "text": "नमस्ते दोस्तों, हमारे एप्लिकेशन में आपका स्वागत है!",
  "original_text": "¡Hola amigos, bienvenidos a nuestra aplicación!",
  "source_lang": "es",
  "target_lang": "hi",
  "cached": false,
  "confidence": 1.0,
  "timestamp": "2026-07-29T12:00:00Z"
}

```

---

