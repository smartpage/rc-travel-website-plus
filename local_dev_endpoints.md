# Local Development Endpoints Configuration

## Overview

The RC Travel Website automatically switches between localhost and production endpoints based on the environment, enabling seamless local development and testing.

## Dynamic Endpoint Logic

### Detection Method
```typescript
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
```

### Endpoint Mapping

| Environment | Auth/AI Endpoints | Login UI |
|-------------|------------------|----------|
| **Local Dev** | `http://localhost:5001` | `http://localhost:5001` |
| **Production** | `https://login.intuitiva.pt` | `https://login.intuitiva.pt` |

## Implementation

### AuthContext.tsx
```typescript
// Dynamic endpoints: localhost in dev, production in deploy
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const AUTH_API_BASE = isLocalhost ? 'http://localhost:5001' : 'https://login.intuitiva.pt';
const LOGIN_UI_BASE = isLocalhost ? 'http://localhost:5001' : 'https://login.intuitiva.pt';

// Used for:
await fetch(`${AUTH_API_BASE}/refreshSession`, { credentials: 'include' })
await fetch(`${AUTH_API_BASE}/logout`, { credentials: 'include' })
window.location.href = `${LOGIN_UI_BASE}/login?redirect=${redirectTo}&siteId=${SITE_ID}&orgId=${ORG_ID}`
```

### AIEnhancePanel.tsx
```typescript
// Dynamic API endpoint: localhost in dev, production in deploy
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const AI_API_BASE = isLocalhost ? 'http://localhost:5001' : 'https://login.intuitiva.pt';

// Used for:
await fetch(`${AI_API_BASE}/ai-enhance-content`, { credentials: 'include' })
```

## Local Development Workflow

### Prerequisites
1. **Intuitiva server running locally**:
   ```bash
   cd /Users/admin/intuitiva-client-dashboard/functions
   npm run dev
   # Server starts on http://localhost:5001
   ```

2. **Travel website running locally**:
   ```bash
   cd /Users/admin/SMARTPAGE/rc-travel-website-plus
   npm run dev
   # Website starts on http://localhost:8080
   ```

### Authentication Flow (Local)
1. **Visit**: `http://localhost:8080?design=1`
2. **Auth check**: Calls `http://localhost:5001/refreshSession`
3. **If not logged in**: Redirects to `http://localhost:5001/login`
4. **After login**: Redirects back to website with session cookie

### AI Enhancement Flow (Local)
1. **Open editor**: Click AI Enhancement panel
2. **Select model**: Choose Claude Haiku, Grok 3 Mini, etc.
3. **Generate preview**: Calls `http://localhost:5001/ai-enhance-content`
4. **Apply changes**: Updates local design state
5. **Save**: Persists to local `db.json` via design API

## Benefits

### Development
- **No URL changes needed**: Automatically detects environment
- **Local testing**: Test auth and AI features against local server
- **Faster iteration**: No network latency to production servers
- **Debug friendly**: Console logs from local server visible

### Production
- **Zero config**: Same code works in production
- **Secure**: Production still uses HTTPS endpoints
- **Reliable**: Falls back to production endpoints automatically

## CORS Considerations

### Local Development
- Intuitiva server allows `http://localhost:8080` in `ALLOWED_CREDENTIAL_ORIGINS`
- Cookies work cross-origin between localhost:8080 ↔ localhost:5001
- `credentials: 'include'` enables session cookie transmission

### Production
- Production domains must be in the CORS allowlist
- Cross-site cookies work via `SameSite=None; Secure` settings
- See `cors_credential_list.md` in intuitiva docu for details

## Troubleshooting

### Common Issues

**Auth not working locally**:
1. Check intuitiva server is running on port 5001
2. Verify `http://localhost:8080` is in CORS allowlist
3. Check browser console for CORS errors

**AI enhancement failing**:
1. Verify OpenRouter API key in `functions/.env`
2. Check server logs for AI provider errors
3. Ensure session cookie is valid

**Wrong endpoints being called**:
1. Check `window.location.hostname` in browser console
2. Verify hostname detection logic
3. Hard refresh browser to clear any cached endpoints

## Related Documentation

- `auth_flow.md` - Authentication flow documentation
- `DESIGN_FLOW.md` - Editor and token system
- `/Users/admin/intuitiva-client-dashboard/docu/cors_credential_list.md` - CORS configuration
- `/Users/admin/intuitiva-client-dashboard/docu/ENDPOINTS.md` - API endpoint documentation
