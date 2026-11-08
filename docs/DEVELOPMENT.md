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

## Workflow
- Keep Web and Android in separate folders.
- Share backend contracts and business rules through the same GUDANGKU Supabase project.
- Review RLS and database security after every schema or policy change.
- Test stock-in, stock-out, transfer, and stock-count flows, including insufficient-stock and cross-organization access cases.

## Current stage
- Repository and database foundation established.
- Web: Next.js app scaffold, initial responsive workspace landing page, and SSR-aware Supabase client utilities added.
- Android: Kotlin/Compose Gradle scaffold and initial native screen added.
- Not yet completed: local dependency installation/build verification, authentication screens and flows, authenticated organization selection, operational inventory screens, Android Supabase integration, automated tests, and CI.
- The initial database schema still needs to be captured and reviewed as a canonical migration before automated resets/deployments.
