# AeroRUL GitHub Actions CI

The canonical workflow is [`ci.yml`](./ci.yml). It replaces the previous directory-only check with four independent, read-only quality gates.

| Job | Automated checks | Needs live services? |
|---|---|---|
| Repository structure | Required folders/lockfiles/schema/migration and no committed private `.env` | No |
| Backend | `npm ci`, JavaScript syntax, existing Node.js `node:test` auth tests, APIDoc build | No |
| Frontend | `npm ci`, existing pure Node.js tests, Vite production build | No |
| RUL integrity | Python 3.11 syntax, JSON parsing, SHA-256 package checksums | No |

## Triggers and safety

- Push to `week-3` or `main`.
- Pull requests targeting `week-3` or `main`.
- `workflow_dispatch` when available through GitHub's workflow UI (GitHub requires the workflow to exist on the default branch to enable manual dispatch).
- `permissions: contents: read`; no secrets, cloud deployment, Postgres service, SMTP, FastAPI runtime, card processing, or inference.
- Workflow jobs do not mutate the repository, commit, deploy, or run migrations. CI test execution is separate from the planned full integration and E2E QA.

## Important boundaries

- The backend has existing offline unit tests under `backend/tests/`; these do not require a running PostgreSQL server. Current scripts define no `npm test`, so the workflow invokes Node's native test runner directly.
- The frontend has a native Node test suite under `frontend/tests/`; there is no configured ESLint/lint command or browser E2E suite yet. Do not claim lint or WCAG compliance from a Vite build.
- The Python tests under `rul-service/tests/` import TensorFlow and run real offline inference. They are **not** part of the fast baseline CI; run them in the planned, controlled RUL verification phase (or add an explicit heavyweight job later).
- The RUL SHA-256 manifest covers the model and service source files. If a *deliberate* change modifies a covered file, review the change and refresh the manifest as a separate, traceable maintenance step. Never disable a failing checksum check just to make CI green.
- SQL migrations, checkout/payment transaction locks, inventory restoration, ADMIN/Supplier API checks and full RUL → recommendation → cart → payment E2E are reserved for the forthcoming database-backed QA.

## First rollout

1. Review `ci.yml`, commit only the CI workflow and this README on the `week-3` branch.
2. Push `week-3` manually. This should trigger the CI workflow on GitHub; a manual-dispatch button may be unavailable until this workflow exists on the default branch.
3. Open the repository's **Actions** tab → **AeroRUL CI** and inspect each independent job. If a job fails, expand the failed step and fix the root cause in a follow-up commit. Do not weaken test assertions or skip a failing job.
4. After all jobs pass, optionally set branch rules requiring the relevant CI checks for pull requests into `main`.
5. Full local QA and cloud deployment remain separate future phases.

### Local commands matching the CI steps

Run from the repository root:

```powershell
npm --prefix backend ci
Push-Location backend; node --test tests/*.test.cjs; npm run doc; Pop-Location
npm --prefix frontend ci
Push-Location frontend; node --test tests/*.test.mjs; npm run build; Pop-Location
```

For Unix/Linux shell checks:

```bash
find backend/src -type f -name '*.js' -print0 | xargs -0 -r -n 1 node --check
python3.11 -m compileall -q rul-service
(cd rul-service && sha256sum --check checksums.sha256)
```

The Linux shell examples are the checks executed in GitHub-hosted Ubuntu runners. On Windows, use native PowerShell equivalents if needed.
