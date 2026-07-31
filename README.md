# Lingo-Latency

A distributed, low-latency translation wire for real-time multi-lingual communication.

---

## Overview

Lingo-Latency connects multi-lingual correspondents in real-time chat rooms. When a user sends a message in their native language, every participant in the room views, reads, and listens to the dispatch translated instantly into their selected target language.

By decoupling room state from individual server instances using a Redis Pub/Sub mesh, the application scales statelessly across multiple FastAPI nodes behind Nginx without dropping WebSockets or message continuity.

---

## Key Capabilities

- **Real-Time Translation Fan-Out:** Messages land instantly in each user's native language, with one-click toggles to inspect original untranslated dispatches.
- **Voice Integration (STT/TTS):** Native WebSpeech Speech-to-Text dictation for composing messages and Text-to-Speech audio playback for listening to incoming transmissions.
- **Custom Rooms & Dynamic Language Switching:** Room slug generation, shareable invite codes, and inline language switching on the fly without session reloads.
- **Transcript Logs & Presence Tracking:** Export complete room logs as formatted `.txt` transcripts with timestamps, alongside live typing indicator broadcasts over WebSockets.

---

## Architecture & System Design

### Distributed Pipeline

1. **Gateway Layer:** Nginx acts as the single ingress gateway (Port 8080), handling SSL termination, WebSocket connection upgrading, and load balancing across application nodes.

2. **Application Cluster:** Multiple stateless FastAPI instances process WebSocket framing, message validation, and REST requests.

3. **Message Broker & Cache:** Redis Pub/Sub manages cross-node message fan-out and presence tracking. Translation payloads are cached per target language to minimize latency on concurrent broadcasts.

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** FastAPI, Python 3.11+, Uvicorn
- **Data & Messaging:** Redis Pub/Sub, Redis In-Memory KV
- **Infrastructure:** Nginx, Docker, Docker Compose

---

## API & Protocol Reference

| Protocol | Route | Description |
|----------|-------|-------------|
| `WS` | `/ws/chat/{room_id}` | Persistent WebSocket wire for messages, presence, and typing broadcasts |
| `GET` | `/api/v1/chat/history/{room_id}` | Fetch recent room dispatch history for client initialization |
| `GET` | `/health` | Ingress gateway and backend cluster health check |

---

## Getting Started

### Prerequisites

- Docker Engine `v20.10+`
- Docker Compose `v2.0+`
- Node.js `v18+` *(for local frontend development)*

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sachi070/lingo_latency.git
   cd lingo_latency
   ```

2. **Start the complete stack**
   ```bash
   docker compose up --build
   ```

3. **Frontend**
   ```
   http://localhost:3000
   ```

4. **API Gateway**
   ```
   http://localhost:8080
   ```

5. **Health Check**
   ```
   http://localhost:8080/health
   ```
