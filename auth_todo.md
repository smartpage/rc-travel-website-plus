# Auth TODO (2-Step Plan)

## What is an SPA?
Single-Page Application. The app loads once in the browser and routes client-side without full page reloads. UI gating can hide features, but real security must be enforced server-side. We'll use Firebase Security Rules in Step 2 for server-side enforcement without running our own server.

## Step 1 — Client gate via login.intuitiva.pt (no Firebase SDK in site)
- Remove Firebase Web SDK from the site bundle.
- `AuthProvider` calls `POST ${API_BASE_URL}/refreshSession` with `credentials: 'include'` to validate the HTTP-only cookie and load the user.
- Authorization = `user.isSuperAdmin === true` OR `user.organizations[ORG_ID]` exists.
- `LoginGate` redirects to `https://login.intuitiva.pt/login?redirect=<current>&siteId=<SITE_ID>&orgId=<ORG_ID>`.
- `signOut()` calls `POST ${API_BASE_URL}/logout` and reloads.

Files edited:
- `src/contexts/AuthContext.tsx` — session check + redirect handlers using login API
- `src/components/LoginGate.tsx` — gates editor by authz state
- `src/lib/firebaseClient.ts` — removed (stubbed) to avoid bundling Firebase

Env vars:
- None required for the site. `API_BASE_URL` comes from `db_connect.ts` (defaults to localhost:5001 in dev).

How it works:
- If URL has `?design=1`, we show the editor wrapper.
- `AuthProvider` refreshes session; `LoginGate` blocks until authenticated and authorized.

## Step 2 — Secure persistence (server APIs)
- Persist edits via Cloud Functions endpoints (already exist in dashboard repo) that verify the session cookie.
- No tokens in localStorage; no Firebase SDK in the site.
- Rate-limit and apply CSRF for mutating actions where needed.

## Optional — site scoping
- Store per-site access at `siteEditors/{siteId}/{uid}` if multi-tenant.
- Gate editor on `(exists siteEditors)` as well.

## Notes
- Client cookies/JWTs minted by the UI are not security. Use Firebase Auth + Rules for enforcement.
- Keep json-server only for local dev.


