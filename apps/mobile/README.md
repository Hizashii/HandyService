# Håndmatch mobile app

Expo Router client for the Håndmatch marketplace. Signed-out users can register or log in. Marketplace tabs, provider details, and profile are protected routes.

## Local setup

```bash
npm install
```

Copy `.env.example` to `.env` and set the API base URL:

```bash
EXPO_PUBLIC_API_URL=http://localhost:8787
```

Use the host machine's reachable address for a physical device or emulator. Do not use `localhost` unless the API runs on that same device.

Start Expo:

```bash
npx expo start
```

Run validation:

```bash
npm run lint
npx tsc --noEmit
npm test
```

## Production configuration

Set `EXPO_PUBLIC_API_URL` to the deployed HTTPS Worker URL before building:

```bash
EXPO_PUBLIC_API_URL=https://api.example.com
```

Never ship session traffic over plain HTTP. Native platforms store the session token in Expo SecureStore. Web stores it in `localStorage`; deploy web over HTTPS so browser storage and API requests remain protected.

## Session lifecycle

The app restores a stored token on startup with `GET /api/auth/me`. A valid token enters the authenticated navigator. A `401` removes the token and shows login. Network errors, API `5xx` responses, and storage failures keep the token and expose a retry action instead of signing the user out.
