# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Plane is an open-source project management platform built as a monorepo. The codebase consists of multiple frontend applications (React Router v7), a Django REST API backend, and shared packages for code reuse.

## Repository Structure

This is a **pnpm workspace monorepo** managed with Turbo:

### Applications (apps/)
- `web` - Main frontend application (port 3000)
- `admin` - Admin dashboard/god-mode (port 3001)
- `space` - Public shared space application (port 3002)
- `api` - Django REST API backend (Python)
- `live` - WebSocket real-time collaboration service
- `proxy` - Proxy service

### Shared Packages (packages/)
- `@plane/shared-state` - MobX state management stores
- `@plane/services` - API client layer (axios)
- `@plane/propel` - Primary UI component library (40+ components)
- `@plane/ui` - Additional UI components
- `@plane/hooks` - Shared React hooks
- `@plane/types` - TypeScript type definitions with Zod validation
- `@plane/constants` - Shared constants
- `@plane/editor` - Rich text editor (TipTap-based)
- `@plane/i18n` - Internationalization
- `@plane/utils` - Utility functions
- `eslint-config`, `tailwind-config`, `typescript-config` - Shared tooling configs

## Common Commands

### Development

```bash
# Start all development servers (18 concurrent)
pnpm dev

# Start only specific apps
turbo run dev --filter=web
turbo run dev --filter=admin

# Start backend services (Docker)
docker compose -f docker-compose-local.yml up

# Initial setup
./setup.sh
```

### Building

```bash
# Build all packages and apps
pnpm build

# Build specific workspace
turbo run build --filter=web
```

### Code Quality

```bash
# Run all checks (format, lint, types)
pnpm check

# Individual checks
pnpm check:format  # Check formatting
pnpm check:lint    # ESLint check
pnpm check:types   # TypeScript type check

# Fix issues
pnpm fix           # Fix format and lint
pnpm fix:format    # Auto-format with Prettier
pnpm fix:lint      # Auto-fix ESLint issues
```

### Testing

```bash
# Run all tests
turbo run test

# Python API tests
cd apps/api
python run_tests.py
# Or
./run_tests.sh
```

### Cleanup

```bash
# Clean all build artifacts and dependencies
pnpm clean
```

## Architecture

### Frontend Architecture

**Stack:**
- React 18.3.1
- React Router 7.9.5 (migrated from Next.js)
- MobX 6.12.0 for state management
- SWR 2.2.4 for data fetching/caching
- Vite 7.1.11 for builds
- Tailwind CSS for styling

**Key Patterns:**
- File-system routing: `app/(all)/[workspaceSlug]/...` structure
- MobX stores injected via `StoreProvider` at root
- API calls through `@plane/services` abstraction layer
- Component library from `@plane/propel` and `@plane/ui`
- Lazy-loaded providers for PostHog, Intercom, etc.

**Application Flow:**
```
root.tsx → provider.tsx (StoreProvider + ThemeProvider + SWRConfig + TranslationProvider)
  → AppProgressBar → StoreWrapper (MobX initialization) → Routes (Outlet)
```

### Backend Architecture (Django)

**Location:** `apps/api/plane/`

**Structure:**
- `api/` - REST API endpoints (views, serializers, urls)
- `db/models/` - 34 Django models (Issue, Project, User, Workspace, Cycle, Module, etc.)
- `authentication/` - Auth system (OAuth, JWT)
- `bgtasks/` - Celery background tasks
- `app/` - Main application logic
- `settings/` - Django configuration
- `middleware/` - Custom middleware

**Database:** PostgreSQL (v14+)
**Task Queue:** Celery with Redis (v6.2.7+)

### Frontend-Backend Communication

1. Components access MobX stores via hooks
2. Stores call API methods from `@plane/services`
3. Services layer uses axios with credentials
4. Django REST API handles authentication, permissions, business logic
5. Responses update MobX state
6. React auto-rerenders subscribed components
7. SWR provides caching and background refresh

### State Management Pattern

- MobX stores are single source of truth
- Components observe stores using `mobx-react`
- Async operations triggered through store actions
- API calls encapsulated in store layer
- Types from `@plane/types` ensure type safety

## Development Guidelines

### Package Manager
Use **pnpm** for all Node.js operations. The workspace is configured with `pnpm-workspace.yaml`.

### Python Environment
The Django API uses:
- Python 3.8+
- Requirements in `apps/api/requirements/`
- Main requirements file: `apps/api/requirements.txt` (references production.txt)

### Adding Dependencies

**Frontend packages:**
```bash
# To a specific app
pnpm add <package> --filter=web

# To a shared package
pnpm add <package> --filter=@plane/ui
```

**Python packages:**
```bash
cd apps/api
# Add to appropriate requirements file in requirements/ folder
```

### Code Style

- **Frontend:** ESLint + Prettier (Oxc plugin)
  - Max warnings: 934 (gradually decreasing)
  - Config in `packages/eslint-config`
- **Backend:** Ruff for linting and formatting
  - Line length: 120
  - Config in `apps/api/pyproject.toml`

### TypeScript

- All packages use TypeScript 5.8.3
- Shared config in `packages/typescript-config`
- Use `tsdown` for faster builds (not tsc directly)
- Types should be defined in `@plane/types` when shared

### Testing

- Unit tests required for new features and bug fixes
- Frontend tests in respective app directories
- Backend tests in `apps/api/plane/tests/`

## Local Setup Requirements

- **Docker Engine** (running)
- **Node.js** 22.18.0+ (see package.json engines)
- **pnpm** 10.21.0 (specified in packageManager)
- **Python** 3.8+
- **PostgreSQL** v14
- **Redis** v6.2.7
- **Memory:** Minimum 12 GB RAM (8 GB may cause failures)

## Environment Variables

Frontend apps use Vite environment variables (prefix: `VITE_`). Key variables:
- `VITE_API_BASE_URL` - API endpoint
- `VITE_ADMIN_BASE_URL`, `VITE_ADMIN_BASE_PATH`
- `VITE_SPACE_BASE_URL`, `VITE_SPACE_BASE_PATH`
- `VITE_WEB_BASE_URL`
- See `.env.example` for full list

Backend variables in `apps/api/.env.example`

## Key URLs

- Main app: http://localhost:3000
- Admin/God mode: http://localhost:3001/god-mode/
- Space app: http://localhost:3002

## Turbo Configuration

The monorepo uses Turbo for task orchestration:
- Tasks run in dependency order (via `^build` dependencies)
- Caching enabled for build tasks
- Dev tasks run persistently
- Concurrency: 18 for dev mode

## Internationalization

Translations are in `packages/i18n/src/locales/`:
- Nested JSON structure
- Uses IntlMessageFormat for pluralization and variables
- Adding new languages requires updating type definitions and import logic

## Migration Notes

The project migrated from Next.js to React Router 7. Some compatibility shims exist in `app/compat/next/` for gradual migration.
