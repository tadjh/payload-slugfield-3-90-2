# Payload 3.90.2: `slugField` fails "Slug is required" when the slug is left out

Minimal reproduction on an unmodified `npx create-payload-app@latest -t website` scaffold (Payload **3.90.2**, Postgres).

Since 3.90.2, creating a **published** document without a `slug` fails with `ValidationError: The following field is invalid: Slug`. On 3.90.1 the slug is generated from the title and the create succeeds. Drafts are unaffected because they skip required-field validation.

## What was added to the scaffold

- `tests/int/slug.int.spec.ts`: creates a published post without a slug and expects `slugField` to generate one, plus a control that passes a slug by hand.
- `pnpm-workspace.yaml`: allows the build scripts pnpm 11 otherwise refuses (the scaffold's `pnpm.onlyBuiltDependencies` field is ignored by pnpm 11).

Nothing under `src/` was changed.

## Run it

```sh
docker run -d --name slug-repro-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17-alpine
cp .env.example .env
# set DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres and PAYLOAD_SECRET to any string
pnpm install
pnpm test:int tests/int/slug.int.spec.ts
```

On `main` (3.90.2):

```
× generates the slug when a published post is created without one
✓ keeps a slug given by hand (control)
ValidationError: The following field is invalid: Slug
```

On the `control-3.90.1` branch (every `payload` / `@payloadcms/*` package pinned to 3.90.1), both tests pass.

## Likely cause

3.90.2 includes "fix: await slugify func to match type" (payloadcms/payload#18181, commit `3fad98e`), which changed the `generateSlug` hook from `data[slugFieldName] = slugify(...)` to `data[slugFieldName] = await slugify(...)`.

That hook is a `beforeChange` hook on the `generateSlug` checkbox, a sibling of the required `slug` field. `beforeChange` starts every sibling field's hooks-then-validation step and awaits them together with `Promise.all` (`fields/hooks/beforeChange/traverseFields.js`). Before the change, the default (synchronous) slugify assigned `data.slug` before anything yielded, so the value was there when the `slug` field validated. With the `await`, the hook yields first, the `slug` field's required check runs against `undefined`, and the create fails.
