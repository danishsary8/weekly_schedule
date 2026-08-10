# Contributing to Daycraft

Keep changes scoped, preserve the API envelope, and run both test suites. New accounts remain empty by default and every schedule query stays scoped to its authenticated owner.

## Backend architecture

API changes follow one direction:

`Route → Controller → FormRequest → Service → Model → Resource → ApiResponse`

- Controllers translate HTTP input/output only; they do not validate payloads or query Eloquent directly.
- Form Requests own validation and authorization rules.
- Services own transactions, ownership-scoped queries, integrations, and cache invalidation.
- Models define persistence, casts, and relationships.
- API Resources define public fields; `ApiResponse` provides the shared envelope.
- Payload-free liveness and identity reads may use the base request, but still use the shared response layer.

Never resolve a child globally and check ownership afterward. Constrain it through the authenticated user's relationship in the service query so foreign records return 404.

## Frontend architecture

- `pages/` compose routes and flows.
- `components/` contains reusable UI; multi-file features use `auth/`, `assistant/`, and `onboarding/` folders.
- `hooks/` owns reusable stateful behavior; `store/` owns session-wide auth state.
- `api/` is the only layer that performs HTTP requests.
- `utils/` contains pure calculations and formatting.

Use `fetch…` for reads, `create…`/`update…`/`delete…` for mutations, and `save…` for idempotent settings or log writes.

## Verification

```bash
npm install
composer install --working-dir=backend
npm run test
npm run build
php backend/artisan test
composer audit --working-dir=backend
npm audit --omit=dev
```
