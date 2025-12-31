# Veridicus 🔍

**Autonomous Forensic Reasoning Engine** powered by Gemini 3

Veridicus solves complex, multi-modal "cold cases" by identifying behavioral and logical contradictions across years of evidence. It replaces traditional, manual cross-referencing with an industrial-scale reasoning engine.

## 🚀 Features

- **Evidence Vault**: Upload and cache up to 1M+ tokens of case files (PDFs, audio, video, images)
- **Deep Reasoning**: Gemini 3 Pro with `thinking_level: high` for forensic analysis
- **Vibe Forensics**: Real-time audio analysis for stress and affect detection
- **Contradiction Map**: Visual timeline of evidence discrepancies
- **Audit Trail**: Immutable logging for legal compliance

## 📁 Project Structure

```
veridicus/
├── backend/           # Node.js + Fastify API
│   ├── src/
│   │   ├── api/       # REST endpoints
│   │   ├── gemini/    # Gemini 3 integration
│   │   ├── services/  # Business logic
│   │   └── websocket/ # Live Audio API
│   └── package.json
├── frontend/          # Flutter Web/Desktop
├── shared/            # Shared TypeScript types
└── docker-compose.yml
```

## 🛠 Tech Stack

| Layer     | Technology                            |
| --------- | ------------------------------------- |
| Backend   | Node.js 22+, Fastify 5, TypeScript    |
| AI Engine | Gemini 3 Pro & Flash, Context Caching |
| Database  | Supabase (PostgreSQL, Vector Buckets) |
| Frontend  | Flutter 3.38+, Riverpod 3.x           |
| Auth      | Supabase Auth                         |

## ⚡ Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Add your API keys to .env
npm run dev
```

### Frontend (coming soon)

```bash
cd frontend
flutter pub get
flutter run -d chrome
```

## 🔐 Environment Variables

Create `backend/.env` with:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
GOOGLE_AI_API_KEY=your_gemini_api_key
```

## 📖 Documentation

- [Implementation Plan](./docs/implementation_plan.md)
- [API Reference](./docs/api.md) _(coming soon)_
- [Database Schema](./docs/schema.md) _(coming soon)_

## 🏗 Status

**Phase 1: Foundation** _(In Progress)_

- [x] Repository setup
- [x] Backend scaffolding
- [x] Gemini 3 client integration
- [ ] Supabase schema migration
- [ ] Flutter project initialization

## 📜 License

MIT License - See [LICENSE](./LICENSE) for details.

---

Built with 🧠 by the Veridicus Team
