# HelpDK API

Cloudflare Worker API backed by D1. Authentication uses salted PBKDF2 password hashes, opaque session tokens, hashed session storage, expiry, revocation, and server-side role and ownership checks.

## Local setup

Install dependencies and authenticate Wrangler:

```bash
npm install
npm exec wrangler login
```

Create the D1 database once:

```bash
npm run db:create
```

Copy the returned database UUID into `d1_databases[0].database_id` in `wrangler.jsonc`. Wrangler requires this ID for a D1 binding; it is account-specific and must not be invented or committed as an empty string.

Apply migrations to the local database:

```bash
npm run db:migrate:local
```

Start the Worker:

```bash
npm run dev
```

Run API tests and type checks:

```bash
npm test
npm run typecheck
```

## Production deployment

Deploy only over HTTPS. Apply migrations to the remote database before deploying code:

```bash
npm run db:migrate:remote
npm run deploy
```

Never point a production mobile build at `http://` or at a local Wrangler database. Use the HTTPS Worker URL in the mobile app's `EXPO_PUBLIC_API_URL`.

## Authentication lifecycle

1. `POST /api/auth/register` or `POST /api/auth/login` returns a random session token and its expiry timestamp.
2. The mobile app stores the token in Expo SecureStore on native platforms and `localStorage` on web.
3. Authenticated requests send `Authorization: Bearer <token>`.
4. `GET /api/auth/me` validates the hashed token, deletes expired sessions, and updates `last_seen_at`.
5. `POST /api/auth/logout` revokes the session server-side and the app clears local storage.
6. A `401` during startup clears the invalid token. Network and server failures keep the token and expose a retry state.

Login and registration have shared D1-backed limits for both client IP and account email. Expired limiter rows are removed during new attempts.
