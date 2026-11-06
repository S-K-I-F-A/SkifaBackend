# Skifa Backend Setup

## What was created

The repository was initialized as a NestJS 12 backend using TypeScript, ESM, strict type checking, Vitest, OXLint, Prettier, and pnpm.

The project uses Node.js 24 and pnpm 11, as declared in `package.json`.

## Application foundation

- Environment variables are loaded and validated during startup.
- The API uses the global `/api` prefix and URI versioning.
- CORS, Helmet security headers, and global DTO validation are enabled.
- Swagger documentation is available at `/docs`.
- A health endpoint is available at `/api/v1/health`.
- Authentication, profiles, talent discovery, billing entitlements, verification, media, notifications, placements, and wallet APIs are available.
- Local development uses SQL.js; PostgreSQL is supported for deployments.
- Uploaded secrets and local `.env` files are excluded from Git.
- The unused Nest deployment package was removed.
- The optional `@scarf/scarf` install script used by Swagger UI is explicitly blocked.
- Unused static assets and unrelated recovery artifacts were removed.

## Environment variables

The committed `.env.example` contains:

```env
NODE_ENV=development
PORT=4000
API_PREFIX=api
API_VERSION=1
CORS_ORIGIN=http://localhost:3000
SWAGGER_ENABLED=true
```

Create a local ignored `.env` from `.env.example` when setting up a fresh clone.

## VS Code setup

The `.vscode` directory includes:

- Recommended extensions for Prettier, OXLint, Vitest, and REST requests.
- Format-on-save settings.
- A `NestJS Debug` launch configuration.
- Tasks for dependency installation, development startup, and quality checks.

## Useful commands

```powershell
pnpm install
pnpm start:dev
pnpm start:debug
pnpm check
pnpm build
```

Local URLs:

- Health: `http://localhost:4000/api/v1/health`
- Swagger: `http://localhost:4000/docs`

## Verification completed

The following checks passed:

- Prettier formatting check
- OXLint
- Strict TypeScript type checking
- Unit tests
- End-to-end tests
- Production build
- Peer-dependency check
- Live health endpoint request
- Live Swagger page request

## Git configuration

The repository is connected to:

`https://github.com/S-K-I-F-A/Skifa_Backend.git`

Development work is performed on the `dev` branch. Do not commit local secrets, generated output, dependency folders, or IDE-specific user state.
