# Veridicus Frontend

Modern forensic investigation interface built with **Next.js 16** and **React 19**.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── cases/             # Investigation archive
│   ├── vault/             # Evidence management
│   ├── reasoning/         # AI chat interface
│   ├── vibe/              # Real-time audio analysis
│   ├── timeline/          # Event chronology
│   ├── contradictions/    # Conflict visualization
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
│
├── components/            # Reusable components
│   ├── sidebar.tsx        # Navigation sidebar
│   ├── audio-visualizer.tsx
│   ├── error-boundary.tsx
│   └── providers.tsx      # React Query, etc.
│
├── lib/                   # Utilities
│   ├── supabase.ts        # Supabase client
│   ├── config.ts          # Environment config
│   ├── audio-streaming.ts # WebSocket audio client
│   └── api-schemas.ts     # Zod validation schemas
│
└── store/                 # State management
    └── use-case-store.ts  # Zustand store
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 | App Router, React Server Components |
| React 19 | UI components |
| TailwindCSS 4 | Styling |
| Zustand | State management |
| TanStack Query | Server state & caching |
| Framer Motion | Animations |
| Zod | Runtime validation |

## 🎨 Design System

Custom forensic-inspired theme:

```css
--ocean: #2c365a;  /* Primary color */
--cream: #eee8df;  /* Background */
--beige: #c4bcb0;  /* Borders, muted */
```

Fonts:
- **Inter** - Body text
- **Playfair Display** - Headings

## 📡 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## 🧪 Testing

```bash
npm run lint           # ESLint
npx playwright test    # E2E tests
```

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## ♿ Accessibility

All pages include:
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Focus management
- Semantic HTML

---

See [main README](../README.md) for full documentation.
