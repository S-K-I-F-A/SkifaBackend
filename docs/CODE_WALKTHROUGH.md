# SKIFA Backend Code Walkthrough

This document explains the backend from the perspective of the engineer who will maintain it. The main architectural rule is simple: controllers handle HTTP, DTOs validate input, services contain business rules, and entities describe persisted data.

## How a request moves through the application

```text
Frontend/Postman
  -> Nest route and global /api/v1 prefix
  -> Helmet, CORS, cookies and ValidationPipe
  -> JWT guard and role guard when the route is protected
  -> Controller
  -> Service
  -> TypeORM repository / SQL database
  -> JSON response
```

The frontend should use `http://localhost:4000/api/v1` locally. The backend accepts either the HTTP-only `skifa_session` cookie or `Authorization: Bearer <token>`.

## Bootstrap and configuration

### `src/main.ts`

`bootstrap()` creates the Nest application from `AppModule`, passes it through `configureApp()`, and starts the HTTP server on the validated port.

### `src/app.module.ts`

`AppModule` is the root dependency graph. It loads environment variables once, initializes the database, and imports every feature module:

- `AuthModule`
- `ProfilesModule`
- `TalentModule`
- `BillingModule`
- `VerificationModule`
- `MediaModule`
- `NotificationsModule`
- `PlacementsModule`
- `WalletModule`
- `HealthModule`

`CommunicationsModule` and `StorageModule` are global because many features use email or private file storage.

### `src/setup-app.ts`

`configureApp()` configures behavior shared by production and tests:

- Helmet security headers.
- Cookie parsing.
- `/api` global prefix.
- URI versioning, producing `/api/v1/...` routes.
- Credential-aware CORS for the frontend origin.
- A strict `ValidationPipe` that strips unknown fields, rejects unexpected fields, and converts query values to declared DTO types.
- Swagger at `/docs`, with cookie and Bearer authentication definitions.

### `src/config/env.validation.ts`

`envValidationSchema` validates configuration before the server starts. Local development receives safe local defaults. Production refuses to start without PostgreSQL, frontend/CORS URLs, and strong JWT and NIN hashing secrets. Mock checkout is not a production default.

## Database layer

### `DatabaseModule`

`src/database/database.module.ts` selects the database driver:

- No `DATABASE_URL`: SQL.js stored in `data/skifa.sqlite`, useful for local work.
- `DATABASE_URL` present: PostgreSQL with optional TLS.
- Test mode: isolated in-memory SQL.js database, dropped between test application instances.

PostgreSQL uses `InitialSchema1762074000000`. `DB_SYNCHRONIZE` stays disabled for production because migrations are the safe way to change schemas.

### Entities in `src/database/entities.ts`

Each class maps to one SQL table:

- `UserEntity`: login identity, role, password hash, email/reset tokens, account status, and the four frontend entitlements. Password and token hashes are excluded from normal queries.
- `InternProfileEntity`: intern onboarding data, skills, education, stipend range, media paths, and verification status.
- `CompanyProfileEntity`: company details, contact person, location, description, and logo path.
- `WalletEntity`: one wallet per user, currency, and balance stored as integer cents to avoid floating-point money errors.
- `WalletTransactionEntity`: immutable-looking wallet ledger entries such as top-ups, salaries, withdrawals, and fees.
- `IdentityVerificationEntity`: verification submission metadata and private document paths. It stores an HMAC of the NIN and only the last three digits, never the raw NIN.
- `CheckoutSessionEntity`: checkout purpose, price, status, return URL, and provider reference.
- `PlacementEntity`: a company-to-intern placement request, role, start date, stipend, lifecycle status, and replacement request state.
- `NotificationEntity`: per-user notification category, title, description, read timestamp, and creation timestamp.

The interfaces `SkillValue` and `EducationValue` define JSON values persisted inside intern profiles. The type aliases constrain roles, verification states, and placement states in TypeScript.

### `InitialSchema1762074000000`

The migration creates the production PostgreSQL tables, indexes, unique constraints, and foreign keys. Its `down()` method removes them in reverse dependency order for rollback.

## Authentication and authorization

### DTO classes in `auth.dto.ts`

DTOs are runtime validation contracts:

- `SkillDto` and `EducationDto`: nested intern profile structures.
- `RegisterInternDto`: intern account plus onboarding profile.
- `RegisterCompanyDto`: company account plus profile and contact details.
- `LoginDto`: email and password.
- `EmailDto`: email-only requests such as resend and forgot password.
- `TokenDto`: email confirmation token.
- `ResetPasswordDto`: reset token and new password.

### `AuthService`

`AuthService` owns account security and session creation:

- Normalizes emails to lowercase.
- Rejects duplicate accounts.
- Hashes passwords with bcrypt using cost 12.
- Creates the user, matching profile, wallet, and initial notification inside a database transaction.
- Signs seven-day JWT access tokens.
- Generates random email/reset tokens but stores only SHA-256 token hashes.
- Expires password reset tokens after one hour.
- Optionally bootstraps an administrator from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Returns a safe public user object and the frontend entitlement object.

### `AuthController`

The controller exposes registration, login, logout, forgot/reset password, email confirmation, and `GET /auth/me`. Registration and login set the signed JWT in an HTTP-only cookie and also return it for Postman/mobile clients.

### `ConfirmationController`

This is the frontend compatibility route `POST /confirmation-email`. It delegates to `AuthService` and returns `{ sent: boolean }`.

### `JwtAuthGuard`

The guard extracts a Bearer token first, then falls back to the `skifa_session` cookie. It verifies the signature, loads the active user, and attaches that user to the request. Invalid or expired sessions return `401`.

### `OptionalJwtAuthGuard`

Talent browsing is public, but an authenticated active company should receive more profile detail. This guard attaches a valid user when present without rejecting anonymous visitors.

### `RolesGuard`, `Roles`, and `CurrentUser`

- `@Roles(...)` stores allowed roles on a controller method.
- `RolesGuard` compares the authenticated user's role against those values and returns `403` when needed.
- `@CurrentUser()` extracts the user attached by `JwtAuthGuard`.
- `AuthenticatedRequest` and `JwtPayload` provide the TypeScript shapes used by guards and controllers.

### `AuthModule`

This global module registers the JWT service, user repository, controllers, services, and guards. It exports authentication dependencies so every feature module can protect routes consistently.

## Email and storage

### `EmailService`

The service supports three modes:

- `log`: local-only delivery that prints the link to the server log.
- `smtp`: real delivery through Nodemailer and configured SMTP credentials.
- `disabled`: no delivery.

It builds frontend confirmation and password-reset URLs and never knows account business rules.

### `StorageService`

`savePrivate()` creates a user-specific directory, generates a random filename, maps allowed MIME types to safe extensions, and writes the upload with exclusive creation. Controllers enforce type and size before calling it. The returned value is a private relative path, not a public URL.

## Profiles

### `UpdateInternProfileDto` and `UpdateCompanyProfileDto`

These reuse registration validation while removing email/password and making remaining fields optional for updates.

### `ProfilesService`

The service loads and updates the profile belonging to the authenticated user. It also stores intern headshot/full-body files and a company logo through `StorageService`.

### `ProfilesController`

Routes are split by account role:

- `GET/PUT /intern/profile`
- `POST /intern/profile/photos`
- `GET/PUT /company/profile`
- `POST /company/profile/logo`

Upload interceptors keep files in memory long enough to validate and pass them to private storage. Images are limited to 2 MB.

## Talent discovery

### `TalentQueryDto`

Validates query, skill, state, level, experience, availability, verification, maximum stipend, sort, page, and page size.

### `TalentService`

The service only selects active interns whose visibility entitlement is enabled. It applies frontend-equivalent filters and sorting, paginates the results, and converts internal profile fields into the frontend `Talent` shape.

Anonymous visitors receive summary data with private profile sections empty. An authenticated company only receives bio, education, certifications, and work samples after company activation.

### `TalentController`

Provides public `GET /talent` and `GET /talent/:id`, using optional authentication to decide the response detail level.

## Billing and entitlements

### `CheckoutDto`

Allows only the three frontend purposes: `profile_visibility`, `company_activation`, and `pro`. The return URL must be a complete HTTP(S) URL.

### `BillingService`

The service returns the exact frontend entitlement shape. In local mock mode, checkout:

1. Confirms the purpose belongs to the user's role.
2. Confirms the return URL uses the configured frontend origin, preventing open redirects.
3. Records a completed mock checkout.
4. Grants the requested entitlement.
5. Creates a payment notification.
6. Returns a redirect URL with checkout status and session ID.

Mock checkout explicitly fails in production. A live provider must replace that branch before accepting real money.

### `BillingController`

Provides the existing frontend routes `GET /entitlements` and `POST /checkout`.

## Identity verification

### `SubmitVerificationDto` and `ReviewVerificationDto`

Submission requires an 11-digit NIN and explicit ownership consent. Admin review accepts only `verified`, `resubmit`, or `rejected`, plus an optional review note.

### `VerificationService`

Submission stores front, back, and selfie files privately, HMAC-hashes the NIN, marks the intern pending, and returns safe metadata. Admin review updates both the verification record and intern profile. A verified decision activates the user's wallet and creates a notification.

### `VerificationController`

- Intern: `GET /verification`, `POST /verification/identity`.
- Admin: `GET /admin/verifications`, `PATCH /admin/verifications/:id`.

Identity documents allow JPG, PNG, or PDF up to 10 MB; the selfie must be an image.

## Video CV

### `MediaController`

`POST /video-cv` matches the current frontend upload helper. It permits WebM, MP4, or MOV up to 50 MB, requires an intern with Pro enabled, saves the video privately, and returns `{ saved: true }`.

## Notifications

### `NotificationsService`

Lists newest notifications, calculates unread count, marks one notification as read, or updates all unread notifications in one SQL statement.

### `NotificationsController`

Provides `GET /notifications`, `PATCH /notifications/:id/read`, and `PATCH /notifications/read-all`.

## Placements

### Placement DTOs

- `CreatePlacementDto`: talent profile ID, role, ISO start date, and monthly stipend in whole dollars.
- `ReplacementDto`: optional reason.
- `PlacementStatusDto`: accepted, active, ended, or rejected.

### `PlacementsService`

Only activated companies can request a placement. The service resolves the public talent ID to its intern owner, stores stipend in cents, and notifies the intern. It lists placements from the current user's perspective, records replacement requests, and enforces who can change status. Interns can only accept or reject.

### `PlacementsController`

Exposes create, list, replacement, and status routes under `/placements` with role checks.

## Wallet

### `AmountDto` and `SalaryPaymentDto`

Money input is validated as positive whole-dollar amounts. `SalaryPaymentDto` also requires the target talent profile UUID.

### `WalletService`

- Returns wallet status and balance in both cents and display dollars.
- Lists ledger transactions.
- Provides development-only mock company top-ups.
- Creates pending intern withdrawals after checking wallet activation and balance.
- Moves salary funds between company and intern wallets inside one database transaction and records matching debit/credit ledger entries.

Real top-ups and withdrawals require a payment/payout provider before production.

### `WalletController`

Provides wallet summary, transactions, top-ups, withdrawals, and salary-payment routes under `/wallet`.

## Health, tests, and Postman

### `HealthController`

`GET /health` returns service name, `ok` status, and a timestamp for uptime checks.

### Tests

- `health.controller.spec.ts`: unit test for the health controller.
- `app.e2e-spec.ts`: boots the full Nest application and calls the versioned health endpoint.
- `mvp-workflow.e2e-spec.ts`: registers an intern, uses authenticated mock checkout, verifies entitlements, and confirms the visible profile appears in talent search while private fields remain hidden.

### Postman

`postman/Skifa_Backend.postman_collection.json` contains the API folders and test scripts. Registration/login scripts save tokens automatically. Talent search saves `talentId`; placement and verification requests save their generated IDs.

`postman/Skifa_Local.postman_environment.json` contains local URLs, test accounts, tokens, generated IDs, and file path placeholders.

## What the frontend must change

The frontend currently calls four backend routes but leaves login, onboarding, wallet actions, notifications, and placement requests as browser-only demos. The integration work is:

1. Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:4000/api/v1`.
2. Extend `backendRequest` so callers can choose `POST`, `PUT`, and `PATCH` and send `FormData` without forcing JSON headers.
3. Replace signup `sessionStorage` saves with registration/profile API calls.
4. Replace local talent and notification arrays with API queries.
5. Submit actual NIN files to the verification multipart endpoint.
6. Connect placement and wallet modal forms to their routes.
7. Load `/auth/me` when the app starts and route users according to role and entitlements.

## Production services still required

- Managed PostgreSQL.
- Strong JWT and NIN hashing secrets.
- A live checkout and payout provider.
- SMTP provider and verified sender domain.
- Private persistent/object storage with backups and retention controls.
- Final production frontend URL and CORS configuration.
- Initial admin credentials and an operational verification-review process.
