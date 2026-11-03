# Skifa Backend

NestJS API for the Skifa internship placement platform.

## Requirements

- Node.js 24.15 or later
- pnpm 11 or later
- Visual Studio Code with the recommended workspace extensions

## Initial setup

```powershell
pnpm install
Copy-Item .env.example .env # Skip this if .env already exists
pnpm start:dev
```

The committed `.env.example` documents the required settings. Keep the local `.env` file uncommitted.

## Local endpoints

- API health: `http://localhost:4000/api/v1/health`
- Swagger documentation: `http://localhost:4000/docs`

The backend runs on port `4000` so the Next.js frontend can use port `3000`.

## Commands

```powershell
pnpm start:dev       # Development server with file watching
pnpm start:debug     # Development server with Node debugger
pnpm build           # Production build
pnpm start:prod      # Run the compiled application
pnpm test            # Unit tests
pnpm test:e2e        # End-to-end tests
pnpm test:cov        # Test coverage
pnpm lint            # OXLint checks
pnpm format          # Apply Prettier formatting
pnpm typecheck       # TypeScript validation
pnpm check           # Run all local quality checks
```

## Project structure

```text
src/
  config/       Environment validation and application configuration
  health/       Operational health endpoint
  app.module.ts Root NestJS module
  main.ts       Application entry point
  setup-app.ts  Shared HTTP, validation, security and Swagger setup
test/           End-to-end tests
```

New product capabilities should be added as feature modules under `src/`, for example `auth`, `interns`, `companies`, `assessments`, and `placements`.

Implemented modules now cover authentication, intern and company profiles, talent discovery, entitlements, mock checkout, email confirmation, identity verification, video CV uploads, notifications, placements, and wallets.

## Environment variables

Use `.env.example` as the committed reference. Never commit `.env` or production secrets.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `4000` | HTTP port |
| `API_PREFIX` | `api` | Global API path prefix |
| `API_VERSION` | `1` | Default URI API version |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated allowed frontend origins |
| `SWAGGER_ENABLED` | `true` | Enables Swagger at `/docs` |

See [Frontend API Integration](docs/FRONTEND_API.md) for the full route map and production requirements.
See [Code Walkthrough](docs/CODE_WALKTHROUGH.md) for a class-by-class explanation of the backend.

## Postman

Import both files from `postman/`:

- `Skifa_Backend.postman_collection.json`
- `Skifa_Local.postman_environment.json`

Start with **Auth → Register Intern**. The collection automatically saves access tokens and resource IDs into the environment.

## VS Code

Open this folder directly in VS Code. Accept the recommended extensions when prompted. Use:

- **Run and Debug → NestJS Debug** to start with the debugger.
- **Terminal → Run Task → Run quality checks** before pushing changes.
