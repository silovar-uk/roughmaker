# SECURITY: Never make the application publicly readable

1. Cloudflare Workers `assets.run_worker_first` MUST stay `true`. All assets and API requests pass through `verifyAccess`.
2. The Worker rejects every request until `ACCESS_ISSUER`, `ACCESS_AUD`, `OWNER_EMAIL` are set. No demo bypass in production code.
3. Access application must match ALL Worker environments and hostnames: production `workers.dev`, preview, and custom domains.
4. Allow policy must be an exact authorized user email (not all emails in a domain). JWT cryptographic signature, issue time, expiration, issuer and audience are verified by the Worker.
5. Do not commit secret values to GitHub. `.dev.vars` and `.env` are gitignored. The local development server is insecure by design and binds loopback only.
6. D1 owner checks and SQL revision guards avoid cross-owner requests and blind overwrites. No CORS policy is enabled for public calls. State-changing requests verify same-origin `Origin`.
7. Exported PPTX/JSON files are NOT protected by Cloudflare Access once downloaded.
8. GitHub Actions deployment is blocked unless the operator sets `DEPLOY_APPROVED=true` after Access is verified.

### Negative tests before entering real data

- An unauthenticated `curl -i https://<worker-host>/` returns 401 / Access challenge, never the HTML.
- An unauthenticated `curl -i https://<worker-host>/app.js` returns 401 / Access challenge, never JavaScript.
- An unauthenticated `/api/projects` request fails (401 / Access challenge).
- An arbitrary JWT value and a JWT from a different Access App are rejected.
- A valid JWT for another email is rejected.
- The same checks pass on any preview hostname and all routes.
- Editing project in two sessions returns 409 instead of silently overwriting.
