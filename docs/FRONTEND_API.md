# Frontend API Integration

## Local connection

Run the backend on port `4000` and add this to the frontend `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000/api/v1
```

The frontend already sends credentials with requests. Authentication also returns an `accessToken` for Postman and non-browser clients. Browser sessions use the HTTP-only `skifa_session` cookie.

## Frontend-compatible routes

These routes match calls that already exist in `Skifa_Frontend/lib/backend.ts`:

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/checkout` | Start profile visibility, company activation, or Pro checkout |
| `GET` | `/entitlements` | Read Pro, wallet, profile visibility, and company activation state |
| `POST` | `/confirmation-email` | Resend email confirmation |
| `POST` | `/video-cv` | Upload an intern's Pro video CV |

## Routes the frontend still needs to wire

| Area | Routes |
| --- | --- |
| Authentication | `POST /auth/register/intern`, `POST /auth/register/company`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/confirm-email`, `GET /auth/me` |
| Profiles | `GET/PUT /intern/profile`, `POST /intern/profile/photos`, `GET/PUT /company/profile`, `POST /company/profile/logo` |
| Talent | `GET /talent`, `GET /talent/:id` |
| Identity | `GET /verification`, `POST /verification/identity` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| Placements | `POST /placements`, `GET /placements`, `PATCH /placements/:id/status`, `POST /placements/:id/replacement` |
| Wallet | `GET /wallet`, `GET /wallet/transactions`, `POST /wallet/top-ups`, `POST /wallet/withdrawals`, `POST /wallet/salary-payments` |
| Admin | `GET /admin/verifications`, `PATCH /admin/verifications/:id` |

The current frontend stores onboarding and notification state in `sessionStorage` and uses local demo talent data. Those screens need to replace preview-store writes with the routes above. The existing `backendRequest` helper also needs support for `PUT` and `PATCH` before profile and notification updates are connected.

## Local versus production behavior

- Local development uses a SQL.js database at `data/skifa.sqlite`.
- PostgreSQL is used whenever `DATABASE_URL` is configured.
- Local `PAYMENTS_MODE=mock` immediately grants the requested entitlement and redirects to the supplied frontend return URL.
- Mock checkout is rejected in production. A live payment provider adapter is still required.
- Local `EMAIL_MODE=log` writes confirmation/reset links to the backend log.
- `EMAIL_MODE=smtp` sends through the configured SMTP service.
- Files are stored privately under `UPLOAD_DIR`. A production deployment needs a persistent private disk or an object-storage adapter.
- NIN values are never stored directly. Only an HMAC hash and the last three digits are retained.

## Production inputs still needed

1. A managed PostgreSQL connection string.
2. Two strong independent secrets for `JWT_SECRET` and `NIN_HASH_SECRET`.
3. The final frontend URL and CORS origin.
4. A payment provider decision and credentials. Currency and prices must be finalized before implementing live checkout.
5. SMTP credentials and a verified sender address.
6. Private persistent storage or an object-storage provider for identity documents, photos, and videos.
7. An initial `ADMIN_EMAIL` and strong `ADMIN_PASSWORD` for verification reviews.
8. A privacy/retention policy for NIN documents and video CVs.

Do not enable `DB_SYNCHRONIZE` in production. PostgreSQL migrations run automatically when `DB_MIGRATIONS_RUN=true`.
