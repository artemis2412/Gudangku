# Development Guide

## Repository layout
- `web/`: Next.js + TypeScript web application.
- `android/`: Kotlin + Jetpack Compose Android application.
- `supabase/`: reviewed SQL migrations and Supabase project notes.
- `docs/`: architecture and database documentation.

## Environment setup
1. Copy `web/.env.example` to `web/.env.local`.
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the dedicated GUDANGKU project's Connect dialog.
3. Never place a service-role/secret key in either client app or commit it to Git.

## Supabase Auth setup
1. Configure the production Site URL and allowed redirect URLs in the GUDANGKU Supabase dashboard.
2. Allow the local development callback, for example `http://localhost:3000/auth/confirm`.
3. For the SSR token-hash confirmation handler, set the Confirm signup email template link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.
4. Test signup, email confirmation, login, and logout using a dedicated test account before inviting real users.

## Workflow
- Keep Web and Android in separate folders.
- Share backend contracts and business rules through the dedicated GUDANGKU Supabase project.
- Review RLS and database security after every schema or policy change.
- Test stock-in, stock-out, transfer, and stock-count flows, including insufficient-stock and cross-organization access cases.

## Current stage
- Repository, database foundation, RLS, and organization membership trigger established.
- Web: auth, organization workspace, live inventory overview, product and warehouse master data, stock document drafts, and posting controls are implemented in source.
- Stock documents support IN, OUT, and TRANSFER. Draft creation does not affect stock; manager-level posting uses an atomic database function to update stock balances, stock movements, and audit logs.
- A public authenticated RPC wrapper for the private posting function is recorded in `supabase/migrations/202611090001_expose_authenticated_stock_document_posting.sql`.
- Android: Kotlin/Compose scaffold exists; Supabase Auth and transaction screens remain pending.
- Not yet verified: local Web install/build, end-to-end browser tests, Android build, and automated regression tests.
- The original database baseline still needs to be captured as a canonical migration before automated resets or deployment pipelines.
