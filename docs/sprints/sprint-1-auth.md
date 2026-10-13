# Sprint 1: Authentication

**Status:** Done (2026-10-13)
**Depends on:** Sprint 0
**Requirements covered:** FR1, NFR3

## Goal

Users can register, log in and log out. Only logged-in users can see the app pages.

## Scope

- **In:** User model, register/login/logout/"current user" endpoints, password hashing, JWT cookie, protected routes, login and register pages
- **Out:** password reset, email verification, user roles, social login

## Tasks (high level)

- **Shared:** Zod schemas for the register and login inputs
- **API:**
  - `User` Prisma model and migration
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
  - Password hashing with bcrypt
  - JWT stored in an httpOnly, `SameSite=Lax` cookie (same origin through the Vite proxy, so no CORS setup)
  - `requireAuth` middleware
- **Web:**
  - Login and Register pages built with shadcn/ui (`Form`, `Input`, `Button`, `Card`), validated with the shared Zod schemas
  - Auth state (current user) loaded from `/api/auth/me` (TanStack Query)
  - Protected route wrapper that redirects to the login page
  - Logout button

## Acceptance criteria

- [x] A new user can register and is logged in automatically
- [x] A wrong password or unknown email shows an error message
- [x] After a page refresh, the user stays logged in
- [x] After logout, protected pages redirect to the login page
- [x] Passwords are never stored or returned in plain text

## Tests

- Unit tests: input validation and token helpers (sign/verify)
- Manual check: register, login, `/api/auth/me` with and without the cookie, logout

## Deliverables for the thesis

- Sequence diagram of the login flow
- Short description of the security approach (bcrypt, httpOnly cookie)

## Notes / decisions

- **bcryptjs instead of `bcrypt`:** the same bcrypt algorithm (cost 10) in pure JavaScript, so it needs no native build or install-script approval. Passwords are capped at 72 characters because bcrypt ignores everything after 72 bytes.
- **JWT with `jose`** (HS256, 7-day expiry, subject = user id) in an httpOnly, `SameSite=Lax` cookie named `session`. `secure` is off because the demo runs over plain `http://localhost`.
- **No user enumeration:** login returns the same "Invalid email or password" for unknown emails and wrong passwords, and runs a bcrypt comparison against a dummy hash either way so both take the same time.
- **Emails are normalized** (trimmed, lowercased) by the shared Zod schema, so `Ana@Example.com` and `ana@example.com` are the same account. A unique index guards against duplicate registrations racing each other.
- **Error format:** every API error is `{ error, fields? }`. Validation errors list one message per field, and the forms show them under the matching input. Unexpected errors return a generic 500 without internal details.
- **Session expiry while the app is open:** any 401 from any request marks the user as logged out, and protected pages redirect to `/login`. After logging in, the user returns to the page they originally wanted.
- **shadcn `Form` is deprecated** in the current registry; forms use the newer `Field` components with react-hook-form and the shared Zod schemas via `@hookform/resolvers`.
- **Prisma 7:** `migrate dev` no longer regenerates the client, so `npm run db:migrate` now runs `prisma generate` afterwards.
- **First migration:** `20261013213256_add_user`.
