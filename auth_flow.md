## Auth flow – Editor gate via login.intuitiva.pt (no Firebase SDK)

### Purpose
- Gate the design editor so it only loads for authenticated and authorized users, without shipping any Firebase config to the client.

### TL;DR
- When `?design=1` is present, the app checks an HTTP-only session cookie with `POST https://login.intuitiva.pt/refreshSession`.
- If valid, it returns a user object. We authorize if the user is super-admin or belongs to the site’s organization.
- If not logged in, the UI shows a sign-in modal that redirects to `https://login.intuitiva.pt/login?...`.
- If logged in but unauthorized, the UI blocks the editor and offers Sign out.

### Files
- `src/contexts/AuthContext.tsx` — performs session refresh, computes `isAuthorized`, exposes `signIn()` and `signOut()`.
- `src/components/LoginGate.tsx` — blocks editor UI until authenticated and authorized.
- `db_connect.ts` — provides `ORG_ID` and `SITE_ID` identifiers used for authorization and redirects.
- `src/App.tsx` — reads `design` URL param and wraps editor components with `LoginGate` when enabled.

### Endpoints (all on `https://login.intuitiva.pt`)

**Note**: The server uses two-tier CORS:
- **Public API** (content, settings): All origins allowed
- **Auth endpoints**: Credentials restricted to trusted origins only

- `POST /refreshSession` (requires credentials)
  - Request: `credentials: 'include'`, `Content-Type: application/json`.
  - Response (200): `{ success: true, user: { userId, email, userName, isSuperAdmin, organizations } }`.
  - Effect: renews the HTTP-only session cookie if valid.
- `POST /logout` (requires credentials)
  - Clears the session cookie.
- `GET /login?redirect=<url>&siteId=<SITE_ID>&orgId=<ORG_ID>` (no credentials needed)
  - UI route for magic-link login. After verification, sets the session cookie and redirects back.
- `POST /ai-enhance-content` (requires credentials)
  - Requires a valid session (any authenticated user).
  - Body example:
    ```json
    {
      "data": { /* current design JSON */ },
      "prompt": "Make headings bolder; keep structure identical",
      "sectionType": "design",
      "aiModel": { "provider": "openai", "id": "gpt-4o-mini", "name": "GPT-4o mini" }
    }
    ```
  - Response: `{ success: true, enhancedData: { /* full enhanced JSON */ } }`
  - Usage: the editor applies `enhancedData` locally; click “Save All Changes” to persist.

### Client flow
1) On app load (and only when `?design=1`):
   - `AuthContext` runs `POST https://login.intuitiva.pt/refreshSession` with `credentials: 'include'`.
   - If 200 + `success`, set `user` and compute `isAuthorized`.
   - Else, `user = null`.
2) `LoginGate` behavior:
   - No user → show sign-in modal (button calls `signIn()` which redirects to `/login`).
   - User but not authorized → show “Access denied” and a Sign out button.
   - Authorized → render editor overlay components.

### Authorization logic
- For now, access is allowed only if the user is super admin:

```ts
const allowed = !!(user && user.isSuperAdmin === true);
```

### Code reference (session check)
```ts
// src/contexts/AuthContext.tsx (essence)
const AUTH_API_BASE = 'https://login.intuitiva.pt';

useEffect(() => {
  (async () => {
    const res = await fetch(`${AUTH_API_BASE}/refreshSession`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user || null);
      setIsAuthorized(!!(data.user && (data.user.isSuperAdmin || data.user.organizations?.[ORG_ID])));
    } else {
      setUser(null);
      setIsAuthorized(false);
    }
    setLoading(false);
  })();
}, []);
```

### Sign in / Sign out
- Sign in (redirect):

```ts
const url = new URL('/login', 'https://login.intuitiva.pt');
url.searchParams.set('redirect', window.location.href);
url.searchParams.set('siteId', SITE_ID);
url.searchParams.set('orgId', ORG_ID);
window.location.href = url.toString();
```

- Sign out:

```ts
await fetch('https://login.intuitiva.pt/logout', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
});
window.location.reload();
```

### Security model
- No Firebase SDK or keys in the site bundle.
- Auth cookie is HTTP-only and validated server-side; the client never sees raw tokens.
- Authorization is checked for `ORG_ID` membership (or super-admin) on the client to gate UI; server-side APIs must re-validate on write.
- Use HTTPS everywhere. Avoid localStorage for tokens.

### Design mode
- Editor overlay is only mounted when the URL contains `?design=1`.
- Regular visitors never see auth prompts or editor UI.

### Troubleshooting
- If `refreshSession` returns 401/403, the cookie is missing or expired → user must sign in again.
- If the editor stays blocked while logged in, verify the user has a role on organization `ORG_ID`.

### Hardening plan (server-enforced security)
- Server must always enforce security; the client gate is only UX.
- Required checks on all mutating endpoints used by the editor (TODO tracked in Intuitiva docs):
  - verifySession on every request; do NOT trust client-provided identifiers (like email).
  - Role check: super admin only (current policy) or org-scoped roles in the future.
  - Origin/Referer allowlist: reject writes unless the request comes from an allowed site origin.
  - Shorter session TTL and rotation.
  - Rate limiting and audit logs for sensitive routes.

### TODO (cross-repo)
- Intuitiva: automatically build the CORS/Origin allowlist from Firestore websites and enforce write blocking when Origin is not allowed.
- Website: no changes needed; once server write checks are live, the editor will be protected even if the client gate is bypassed in DevTools.


