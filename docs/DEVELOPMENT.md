# Development Guide

## Repository layout
- `web/`: Next.js + TypeScript web application.
- `android/`: Kotlin + Jetpack Compose Android application.
- `supabase/`: Supabase configuration and reviewed SQL migrations.
- `docs/`: architecture and database documentation.

## Environment setup
1. Copy `web/.env.example` to `web/.env.local`.
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the dedicated GUDANGKU project's Connect dialog.
3. Never place a service-role/secret key in either client app or commit it to Git.

## Supabase Auth setup
1. In the GUDANGKU Supabase dashboard, configure the production Site URL and allowed redirect URLs.
2. Allow the local development callback, for example `http://localhost:3000/auth/confirm`.
3. For the SSR token-hash confirmation handler, set the Confirm signup email template link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.
4. Test signup, email confirmation, login, and logout using a dedicated test account before inviting real users.

## Workflow
- Keep Web and Android in separate folders.
- Share backend contracts and business rules through the same GUDANGKU Supabase project.
- Review RLS and database security after every schema or policy change.
- Test stock-in, stock-out, transfer, and stock-count flows, including insufficient-stock and cross-organization access cases.

## Current stage
- Repository and database foundation established.
- Web: Next.js app scaffold, responsive landing page, Supabase SSR utilities, signup/login, email confirmation endpoint, logout, organization creation, protected organization workspace, and live inventory overview queries added.
- Database: existing organization/member schema and RLS policies inspected; organization owner membership is created by a database trigger.
- Android: Kotlin/Compose scaffold and initial native screen added; Supabase Auth integration remains pending.
- Not yet completed: local dependency installation/build verification, automated tests, full Android Auth integration, role management/invitations, dedicated product/warehouse/transaction screens, and CI.
- The initial database schema still needs to be captured and reviewed as a canonical migration before automated resets/deployments.
