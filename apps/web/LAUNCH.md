# Web launch runbook

Postdiff Web is a static Next.js marketing site. It has no database, API
authentication, user data, or production environment variables.

## Pre-launch checks

Run from the repository root:

```bash
npm -w @postdiff/web run typecheck
npm -w @postdiff/web run build
npm audit --workspace @postdiff/web --audit-level=high
```

The app's production scripts are intentionally limited to `build` and
`start`; there is no test or lint script configured yet.

Before enabling the production domain, verify:

- `/` loads and the primary CTA scrolls to the install section.
- `/docs`, `/pricing`, `/privacy`, and `/tos` render successfully.
- `/health` returns HTTP 200 with `{"status":"ok"}`.
- The mobile drawer opens, closes with Escape, and restores page scrolling.
- The install command copies successfully, including the clipboard fallback.
- Keyboard focus reaches the skip link, navigation, CTAs, drawer, FAQ, and copy controls.

## Deployment

Deploy the `apps/web` workspace using the hosting provider's Next.js
integration. The build command is:

```bash
npm -w @postdiff/web run build
```

The app does not require environment variables. Configure the production
domain, DNS, and TLS in the hosting provider. The app emits security headers
from `next.config.mjs`; HSTS is enabled only in production builds.

## First-hour verification

Check these immediately after deployment:

1. `GET https://<domain>/health` returns `200` and `{"status":"ok"}`.
2. The response includes CSP, HSTS, `X-Content-Type-Options`,
   `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` headers.
3. Review the hosting provider's request and runtime logs for new errors.
4. Test the critical path: landing page → install CTA → copy command.
5. Check the browser console for new JavaScript or CSP violations.
6. Confirm the deployment's previous version is still available for rollback.

## Rollback plan

### Trigger conditions

- `/health` does not return HTTP 200.
- Any primary route fails to render.
- New client-side errors or CSP violations block navigation or copying.
- A security issue is found in the deployed build.

### Steps

1. Repoint the production deployment to the last known-good deployment in the
   hosting provider dashboard.
2. Verify `/health` and the landing-page critical path.
3. Check logs for the failed deployment and record the incident.
4. Fix the issue, rerun the pre-launch checks, and redeploy incrementally.

There are no database migrations or user records to roll back. The expected
rollback is a previous immutable web deployment and should take less than
five minutes when the provider's deployment history is available.
