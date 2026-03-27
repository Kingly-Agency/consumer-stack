<p align="center">
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
</p>

<h1 align="center">🐾 PetPix — AI Pet Art</h1>

<p align="center">
  <strong>Transform your pet photos into stunning AI-generated portraits.</strong><br/>
  Upload a photo, pick a creative art style, and let AI do the magic ✨
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#license">License</a>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎨 **AI Art Generation** | Transform pet photos into artistic portraits using OpenAI's `gpt-image-1` model across 8 unique styles |
| 📱 **5-Tab Experience** | Home feed · Community · Create (floating ＋) · My Pets · Profile |
| 🌐 **Community Feed** | Browse, like, comment, and save AI portraits from other users with pet-type filters and sort toggles |
| 🐶 **Pet Management** | Add, view, and delete your pets with breed info and profile photos |
| 👤 **Instagram-Style Profile** | Cover banner, avatar, stats pill, portrait grid, and full profile editing |
| 💬 **Social Features** | Comments, saves/bookmarks, likes with spring animations, and real-time notifications |
| 🔔 **Notifications** | In-app notification center for social interactions |
| 🍞 **Toast System** | Global toast notifications via a custom provider + hook |

### 🎨 Art Styles

Choose from **8 AI art styles** — each with a unique 3-color gradient swatch, emoji, and personality:

> Watercolor · Pop Art · Oil Painting · Cartoon · Pixel Art · Anime · Sketch · Neon

---

## 🛠 Tech Stack

### Mobile Client — `artifacts/petpix`
- **Expo** (React Native) with file-based routing via Expo Router
- **React Query** for server-state management
- **Reanimated** for spring-based like animations
- **Ionicons** for consistent iconography
- Warm orange `#FF6B35` + cream `#FAFAF8` design system

### API Server — `artifacts/api-server`
- **Express 5** with modular route handlers
- **Drizzle ORM** + **PostgreSQL** for persistence
- **Zod v4** for request/response validation
- **esbuild** for production CJS bundling
- Auto-seed with 12 sample posts on startup

### Shared Libraries — `lib/`
- **`api-spec`** — OpenAPI 3.1 specification + Orval codegen config
- **`api-client-react`** — Auto-generated React Query hooks & fetch client
- **`api-zod`** — Auto-generated Zod schemas from the OpenAPI spec
- **`db`** — Drizzle schema, connection pool, and migration config

---

## 📐 Architecture

```
Pet-Pal-Art/
├── artifacts/
│   ├── api-server/          # Express 5 backend
│   │   └── src/
│   │       ├── routes/      # posts, pets, profile, comments,
│   │       │                # notifications, saves, openai, seed
│   │       └── lib/         # autoSeed, logger, seedImages
│   └── petpix/              # Expo React Native app
│       ├── app/
│       │   ├── (tabs)/      # Home, Community, Create, Pets, Profile
│       │   ├── post/[id]    # Post detail (deep link)
│       │   ├── edit-profile # Profile editing modal
│       │   └── notifications
│       ├── components/      # PostCard, StyleCard, Toast, ErrorBoundary
│       ├── constants/       # Colors design tokens
│       └── context/         # AppContext (userId, userName, displayName)
├── lib/
│   ├── api-spec/            # openapi.yaml + orval.config.ts
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod validation schemas
│   └── db/                  # Drizzle ORM schema + PostgreSQL pool
├── scripts/                 # Utility scripts
├── tsconfig.base.json       # Shared TS config (composite projects)
└── pnpm-workspace.yaml      # Workspace package globs
```

### Data Flow

```
┌─────────────┐     React Query      ┌──────────────┐     Drizzle ORM     ┌────────────┐
│  Expo App   │ ◄──────────────────►  │  Express API │ ◄─────────────────► │ PostgreSQL │
│  (PetPix)   │   api-client-react    │   (Port 3000)│     + api-zod       │            │
└──────┬──────┘                       └──────┬───────┘                     └────────────┘
       │                                     │
       │  Upload pet photo + style           │  POST /api/openai/generate-image
       └─────────────────────────────────────┘
                                             │
                                    ┌────────▼────────┐
                                    │   OpenAI API    │
                                    │  gpt-image-1    │
                                    └─────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20 LTS
- **pnpm** (enforced — npm/yarn will be rejected)
- **PostgreSQL** database
- **OpenAI API key** (or Replit AI Integrations proxy)

### Installation

```bash
# Clone the repo
git clone https://github.com/Kingly-Agency/consumer-stack.git
cd consumer-stack

# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in `artifacts/api-server/` (or set in your environment):

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/petpix
OPENAI_API_KEY=sk-...
```

### Running Locally

```bash
# Start the API server (dev mode)
pnpm --filter @workspace/api-server run dev

# Start the Expo app
pnpm --filter @workspace/petpix run start
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm run build` | Typecheck + build all packages |
| `pnpm run typecheck` | Run `tsc --build` across all project references |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate React Query hooks + Zod schemas from OpenAPI |
| `pnpm --filter @workspace/db run push` | Push Drizzle schema to PostgreSQL |

---

## 📡 API Reference

The API server exposes the following endpoints under `/api`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/healthz` | Health check |
| `POST` | `/openai/generate-image` | Generate AI-styled pet portrait |
| `GET` | `/posts` | List all community posts |
| `POST` | `/posts` | Create a new post |
| `POST` | `/posts/:id/like` | Like / unlike a post |
| `GET` | `/pets` | List user's pets |
| `POST` | `/pets` | Add a new pet |
| `DELETE` | `/pets/:id` | Delete a pet |
| `GET` | `/profile` | Get user profile |
| `PUT` | `/profile` | Update user profile |

> Full spec available in [`lib/api-spec/openapi.yaml`](lib/api-spec/openapi.yaml)

---

## 🗄 Database Schema

Powered by **Drizzle ORM** with the following tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (username, display name, bio, avatar) |
| `pets` | Pet records (name, type, breed, photo) |
| `posts` | Community AI art posts |
| `comments` | Post comments |
| `saves` | Bookmarked/saved posts |
| `notifications` | In-app notification events |
| `conversations` | Chat conversations |
| `messages` | Chat messages |

---

## 🧩 Key Components

### `PostCard`
Instagram-style feed card with Ionicons heart toggle, spring animation via Reanimated, user avatar, pet info, and caption.

### `StyleCard`
Art style selector with a 3-color gradient swatch, emoji badge, style name, and description. Powers the 8-style selection grid in the Create flow.

### `Toast`
Global notification system using a React context provider (`ToastProvider`) and `useToast()` hook for success/error/info messages across the app.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with 🧡 by <a href="https://github.com/Kingly-Agency">Kingly Agency</a>
</p>
