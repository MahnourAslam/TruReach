---
name: Oriane API authentication
description: Undocumented authentication behavior confirmed against Oriane’s REST API.
---

Send the Oriane API key in the server-side `Authorization: Bearer <key>` header. Do not expose the key to browser code.

**Why:** Oriane’s published OpenAPI document currently omits its security scheme, but authenticated requests were confirmed to work with a Bearer token.

**How to apply:** Read `ORIANE_API_KEY` from Replit Secrets in server-side code and construct the authorization header there.