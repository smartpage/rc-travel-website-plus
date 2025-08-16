# TODO – API Endpoints for Live Design Editing

Current dev setup:
- The Design Inspector writes to a local JSON DB (json-server) via Vite proxy:
  - GET `/design-api/design`
  - PUT `/design-api/design`
- This enables instant local edits without backend changes.

Required production endpoints (to replace local DB):
- `GET /organizations/:orgId/sites/:siteId/design`
  - Response: `{ design: DesignConfig }`
- `PUT /organizations/:orgId/sites/:siteId/design`
  - Body: `{ design: DesignConfig }`
  - Persist to Firestore under `design/designConfig` (and optionally `designProfiles`, `activeDesignProfileId`).

Notes:
- Preserve current structure so the frontend inspector remains unchanged.
- Add auth/role checks (editor/admin) and basic validation on server side.
- Optional: implement PATCH (RFC6902) for smaller writes; frontend can switch easily.

Migration steps:
1) Implement endpoints in `intuitiva-client-dashboard/functions`.
2) Enable CORS for the website origin.
3) Switch frontend URLs in `DesignContext` from `/design-api/design` to the new API paths.
4) Remove json-server from dev flow once the API is stable.


