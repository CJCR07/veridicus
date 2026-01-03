# Veridicus Backend

High-performance forensic reasoning API built with **Fastify 5** and **TypeScript**.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

Server runs at [http://localhost:3001](http://localhost:3001)

## 📁 Structure

```
backend/
├── src/
│   ├── api/                    # REST Endpoints
│   │   ├── cases.ts           # Case CRUD
│   │   ├── evidence.ts        # File upload & processing
│   │   ├── analysis.ts        # Reasoning queries
│   │   ├── analyses.ts        # Analysis history
│   │   └── contradictions.ts  # Conflict data
│   │
│   ├── gemini/                # Gemini Integration
│   │   └── gemini-client.ts   # Thinking mode, caching, tools
│   │
│   ├── websocket/             # Real-time
│   │   └── live-audio.ts      # Vibe Forensics endpoint
│   │
│   ├── services/              # Business Logic
│   │   ├── supabase.ts        # Database client
│   │   ├── evidence-processor.ts
│   │   └── reasoning-service.ts
│   │
│   ├── middleware/            # Request Processing
│   │   └── auth.ts            # JWT validation
│   │
│   ├── types/                 # TypeScript Declarations
│   │   └── fastify.d.ts       # Request augmentation
│   │
│   ├── constants.ts           # App configuration
│   └── index.ts               # Entry point
│
├── dist/                      # Compiled output
├── package.json
└── tsconfig.json
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Fastify 5 | HTTP framework (fastest Node.js) |
| TypeScript 5 | Type safety |
| Zod | Request validation |
| @google/genai | Gemini 3 SDK |
| @supabase/supabase-js | Database & Auth |
| pino | Structured logging |

## 📡 API Endpoints

### Cases
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cases` | ✅ | List user's cases |
| GET | `/api/cases/:id` | ✅ | Get case with evidence |
| POST | `/api/cases` | ✅ | Create case |
| DELETE | `/api/cases/:id` | ✅ | Delete case |

### Evidence
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/evidence/case/:caseId` | ✅ | List evidence |
| POST | `/api/evidence/upload?caseId=:id` | ✅ | Upload file |
| POST | `/api/evidence/:id/process` | ✅ | Trigger AI processing |

### Analysis
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/analysis/query` | ✅ | Run reasoning query |
| GET | `/api/analyses/case/:caseId` | ✅ | Get analysis history |
| GET | `/api/analyses/:id` | ✅ | Get single analysis |

### Contradictions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/contradictions/case/:caseId` | ✅ | List contradictions |
| GET | `/api/contradictions/:id` | ✅ | Get contradiction |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `ws://host/ws/vibe` | Real-time audio analysis |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health |

## 🔧 Configuration

### Environment Variables

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_AI_API_KEY=your_gemini_api_key

# Optional
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
```

### Constants (`src/constants.ts`)

```typescript
MAX_FILE_SIZE_MB = 500      // Upload limit
MAX_AUDIO_PAYLOAD_MB = 10   // WebSocket payload
RATE_LIMIT_WINDOW_MS = 1000 // Rate limit window
MAX_MESSAGES_PER_WINDOW = 10 // Max WS messages/sec
```

## 🔒 Security

| Feature | Implementation |
|---------|----------------|
| **Auth** | JWT validation via Supabase |
| **Ownership** | Every endpoint verifies case ownership |
| **Validation** | UUID format, file size, request body |
| **Rate Limiting** | WebSocket message throttling |
| **Logging** | All actions logged to audit_logs |

## 🧪 Testing

```bash
npm run test              # Unit tests (vitest)
npm run test:integration  # Integration tests
npm run lint              # ESLint
npm run format            # Prettier
```

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development with hot reload (tsx) |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run production build |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |

## 🧠 Gemini Integration

### Models Used

| Model | Purpose | Config |
|-------|---------|--------|
| `gemini-3-pro` | Deep reasoning | thinking_level: high |
| `gemini-3-flash` | Fast analysis | Quick processing |
| `gemini-live-3-flash` | Audio streaming | Real-time |

### Context Caching

Evidence corpora are cached for cost-effective analysis:

```typescript
const cache = await createContextCache(
  contents,      // Evidence data
  systemPrompt,  // Forensic instructions
  24             // TTL in hours
);
```

### Tool Calling

The engine supports forensic tools:
- `search_evidence` - Semantic search across case
- `get_evidence_metadata` - Retrieve exhibit details

---

See [main README](../README.md) for full documentation.

