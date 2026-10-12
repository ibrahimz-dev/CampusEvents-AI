# CampusEvents AI

A React Native (Expo) mobile app for managing campus events, powered by AI. Students can browse, search, favorite, and register for events. Admins can create, edit, and delete events.

## Features

- **Student**: Browse catalog, filter by category, search, save favorites, register for events, view registrations
- **Admin**: View all events, create/edit/delete events
- **AI Assistant**: Natural language search, recommendations, schedule planning, and Q&A powered by Groq/OpenAI/Mistral
- **Profile**: View and edit your display name, email, and role
- **Local-first**: All data stored locally via SQLite — no backend required
- **Offline-ready**: Fully functional without internet (AI features require connectivity)

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Routing**: Expo Router (file-based routing, similar to Next.js App Router)
- **Database**: SQLite via `expo-sqlite`
- **Auth**: SecureStore-based session with preconfigured accounts
- **AI**: Groq / OpenAI / Mistral APIs
- **Navigation**: Tab navigator (student) + Stack navigator (admin)
- **Icons**: `@expo/vector-icons` (Ionicons)

## Getting Started

### Prerequisites

- Node.js >= 18
- Expo CLI (`npx expo`)
- iOS Simulator or Android Emulator (or Expo Go app on device)

### Installation

```bash
git clone <repo-url>
cd CampusEvents
npm install
```

### Run

```bash
npm start
```

Then press `a` for Android, `i` for iOS, or `w` for web.

## Preconfigured Accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@campus.ma` | `admin123` | Admin |
| `etudiant@campus.ma` | `etudiant123` | Student |

## Navigation

### Student tabs

| Tab | Screen | Description |
|-----|--------|-------------|
| Home | Catalog | Browse and search events, filter by category |
| ♥ | Favorites | View saved events |
| ⚡ | AI Assistant | Chat with the AI for recommendations and Q&A |
| 📅 | Registrations | Events you've signed up for |
| 👤 | Profile | View/edit profile and logout |

### Admin stack

| Screen | Description |
|--------|-------------|
| Events | List all events |
| Create | Add a new event |
| Edit | Modify an existing event |

## Project Structure

```
CampusEvents/
├── app/                     # Expo Router pages (file-based)
│   ├── _layout.tsx          # Root layout (AuthProvider + Stack)
│   ├── index.tsx            # Login screen
│   ├── (admin)/             # Admin route group (stack)
│   │   ├── _layout.tsx
│   │   ├── events.tsx
│   │   ├── create.tsx
│   │   └── edit.tsx
│   └── (student)/           # Student route group (tabs)
│       ├── _layout.tsx
│       ├── catalog.tsx
│       ├── favorites.tsx
│       ├── assistant.tsx
│       ├── registrations.tsx
│       ├── profile.tsx
│       └── event-detail.tsx
├── assets/                  # App icons and splash
├── components/
│   └── ui/                  # Reusable UI components
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Chip.tsx
│       ├── EmptyState.tsx
│       ├── Header.tsx
│       ├── Screen.tsx
│       ├── SearchBar.tsx
│       └── TextField.tsx
├── constants/
│   └── theme.ts             # Colors, Spacing, FontSize, BorderRadius, Shadow
├── contexts/
│   └── AuthContext.tsx       # Auth provider, User model, login/logout/update
├── database/
│   ├── init.ts              # SQLite schema + seed data
│   ├── events.ts            # Events CRUD
│   ├── favorites.ts         # Favorites CRUD
│   ├── registrations.ts     # Registrations CRUD
│   └── llmResults.ts        # LLM result caching
├── services/
│   └── llm.ts               # LLM API integration (Groq/OpenAI/Mistral)
├── utils/
│   └── uuid.ts              # UUID generator
├── .env.example
├── app.json
└── package.json
```

## UI Components

All reusable components are in `components/ui/` and exported from `components/ui/index.ts`:

| Component | Description |
|-----------|-------------|
| `Button` | Styled pressable button with variants (primary, danger, etc.) and sizes |
| `TextField` | Text input with optional label, error state, and placeholder styling |
| `Card` | Event card used in catalog and listings |
| `SearchBar` | Search input with icon |
| `Chip` | Category/tag pill |
| `Badge` | Status or count badge |
| `Header` | Screen header |
| `EmptyState` | Placeholder for empty lists (with icon and message) |
| `Screen` | Root layout wrapper |

## Database Schema

SQLite tables created on first launch:

- **events** — id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, imageUrl, tags, createdAt
- **registrations** — id, eventId, userId, createdAt, status (FK → events)
- **favorites** — eventId, userId, createdAt (composite PK, FK → events)
- **llm_results** — id, eventId, userId, type, inputText, outputText, createdAt

Seed data includes 8 sample events across categories: Workshop, Talk, Club, Exam, and Other.

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```
EXPO_PUBLIC_LLM_API_KEY=your_api_key_here
EXPO_PUBLIC_LLM_PROVIDER=groq
EXPO_PUBLIC_LLM_MODEL=llama-3.3-70b-versatile
```

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_LLM_API_KEY` | — | API key for the LLM provider |
| `EXPO_PUBLIC_LLM_PROVIDER` | `groq` | Provider: `groq`, `openai`, or `mistral` |
| `EXPO_PUBLIC_LLM_MODEL` | `llama-3.3-70b-versatile` | Model identifier for the chosen provider |

At least one provider must be configured for the AI assistant to work.
