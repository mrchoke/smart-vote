# 🗳️ Smart Vote

ระบบโหวตอัจฉริยะแบบ Realtime บน Cloudflare Workers

## Features

- 🔴 **Realtime** — WebSocket (Durable Objects) อัพเดตผลโหวตทันที
- 📊 **Racing Bar Chart** — กราฟสวยงามเรียงลำดับตามคะแนนแบบ animated
- 🔒 **Admin Mode** — ผู้สร้างได้รับ token พิเศษ ไม่ต้องมี user system
- 🛡️ **Anti-duplicate** — ป้องกันโหวตซ้ำด้วย cookie fingerprint  
- ⏱️ **Auto-expire** — ลบ session อัตโนมัติหลัง 10 วัน
- 📱 **Mobile-first** — UI responsive รองรับมือถือ

## Vote Types

| ประเภท | คำอธิบาย |
|--------|---------|
| `single` | เลือกได้ 1 ข้อ (radio) |
| `multiple` | เลือกได้หลายข้อ (checkbox) |
| `datetime` | ตัวเลือกเป็นวัน-เวลา |
| `time` | ตัวเลือกเป็นเวลา |

## Tech Stack

- **Backend**: [Hono](https://hono.dev/) on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Realtime**: Cloudflare Durable Objects + WebSocket Hibernation API
- **Frontend**: Vue 3 + TypeScript + Vite + Tailwind CSS v4
- **Deploy**: Cloudflare Workers (static assets served from same Worker)

## Project Structure

```
smart-vote/
├── worker/                  # Hono backend
│   ├── src/
│   │   ├── index.ts         # Entry point, exports DO, cron handler
│   │   ├── types.ts         # Shared types
│   │   ├── utils.ts         # Helper functions
│   │   ├── cron.ts          # Session cleanup
│   │   ├── routes/
│   │   │   ├── api.ts       # REST API endpoints
│   │   │   └── ws.ts        # WebSocket proxy to DO
│   │   ├── middleware/
│   │   │   ├── admin.ts     # Admin token validation
│   │   │   └── fingerprint.ts  # Client fingerprint cookie
│   │   └── durable-objects/
│   │       └── VoteRoom.ts  # WebSocket hub, vote handling, broadcast
│   ├── migrations/
│   │   └── 0001_initial.sql # D1 schema
│   └── wrangler.toml
└── frontend/                # Vue 3 SPA
    └── src/
        ├── views/
        │   ├── HomeView.vue    # Create vote session
        │   ├── VoteView.vue    # Voter interface
        │   ├── AdminView.vue   # Admin dashboard
        │   └── ResultsView.vue # Live results
        ├── components/
        │   ├── RacingBarChart.vue  # Animated racing bar chart
        │   ├── VoteForm.vue        # Vote selection UI
        │   ├── ShareLink.vue       # Copy/share link
        │   └── ConnectionStatus.vue
        └── composables/
            ├── useWebSocket.ts   # WS with auto-reconnect
            └── useVoteSession.ts # Session state management
```

## Setup & Deployment

### Prerequisites

```bash
npm install -g pnpm wrangler
wrangler login
```

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create D1 database

```bash
cd worker
wrangler d1 create smart-vote-db
```

Update the `database_id` in `worker/wrangler.toml` with the ID returned.

### 3. Apply migrations

```bash
# Local development
wrangler d1 migrations apply smart-vote-db --local

# Production
wrangler d1 migrations apply smart-vote-db --remote
```

### 4. Development

```bash
# Build frontend first
cd frontend && pnpm build && cd ..

# Start worker dev server
cd worker && wrangler dev
```

Or use the Vite proxy for frontend hot reload:

```bash
# Terminal 1: Worker
cd worker && wrangler dev --local

# Terminal 2: Frontend with hot reload
cd frontend && pnpm dev
```

### 5. Deploy to Cloudflare

```bash
# From root
pnpm build   # builds frontend/dist
cd worker && wrangler deploy
```

## API Reference

### Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/sessions` | — | Create session |
| GET | `/api/sessions/:id` | — | Get session + results |
| PUT | `/api/sessions/:id` | Admin | Update session |
| POST | `/api/sessions/:id/close` | Admin | Close voting |
| POST | `/api/sessions/:id/reopen` | Admin | Reopen voting |
| DELETE | `/api/sessions/:id` | Admin | Delete session |
| POST | `/api/sessions/:id/options` | Admin/Any | Add option |
| POST | `/api/sessions/:id/vote` | — | Cast vote |
| GET | `/api/sessions/:id/results` | — | Get results |

Admin auth: `X-Admin-Token: <token>` header or `?token=<token>` query param.

### WebSocket

Connect to `wss://<host>/ws/<sessionId>?admin_token=<token>`

**Incoming messages (client → server):**
```json
{ "type": "vote", "option_ids": [1, 2] }
{ "type": "add_option", "label": "New option" }
{ "type": "admin_close", "admin_token": "..." }
{ "type": "admin_reopen", "admin_token": "..." }
```

**Outgoing messages (server → client):**
```json
{ "type": "init", "session": {...}, "voted_option_ids": [] }
{ "type": "results_update", "options": [...], "total_votes": 42 }
{ "type": "option_added", "option": {...} }
{ "type": "vote_accepted", "option_ids": [1] }
{ "type": "session_closed" }
{ "type": "session_reopened" }
{ "type": "error", "message": "..." }
```

## User Flows

### Create & Share

1. เปิด `/` → กรอกหัวข้อ เลือกประเภท ใส่ตัวเลือก → สร้าง
2. ได้รับ **admin URL** (เก็บไว้ใน localStorage ด้วย)  
3. แชร์ **voter URL** (`/vote/:id`) ให้ผู้เข้าร่วม

### Vote

1. เปิด `/vote/:id` → เลือกตัวเลือก → ยืนยันโหวต
2. เห็นผลลัพธ์ Racing Bar Chart แบบ realtime

### Admin

1. เปิด `/admin/:id?token=<adminToken>`
2. ดูสถิติ, ปิด/เปิดโหวต, เพิ่มตัวเลือก, แชร์ลิงก์, ลบ session

## Duplicate Prevention

ใช้ `HttpOnly; Secure; SameSite=Strict` cookie (`voter_id`) — UUID ที่ generate ครั้งแรก
- ป้องกันได้ดีสำหรับ normal use
- Incognito/private mode จะได้ voter_id ใหม่ (ข้อจำกัดที่ยอมรับได้)
- `UNIQUE(session_id, client_fp)` constraint ใน D1 เป็น last line of defense

## License

MIT
