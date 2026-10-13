# Sprint 1: Authentication

**Status:** Planned
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
- [ ] A new user can register and is logged in automatically
- [ ] A wrong password or unknown email shows an error message
- [ ] After a page refresh, the user stays logged in
- [ ] After logout, protected pages redirect to the login page
- [ ] Passwords are never stored or returned in plain text

## Tests
- Unit tests: input validation and token helpers (sign/verify)
- Manual check: register, login, `/api/auth/me` with and without the cookie, logout

## Deliverables for the thesis
- Sequence diagram of the login flow
- Short description of the security approach (bcrypt, httpOnly cookie)

## Notes / decisions
_Filled in during the sprint._
