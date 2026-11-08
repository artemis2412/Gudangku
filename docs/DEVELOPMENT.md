# Development Guide

## Repository layout
- `web/`: Next.js web application.
- `android/`: Kotlin Android application.
- `supabase/`: Supabase configuration and reviewed SQL migrations.
- `docs/`: architecture and database documentation.

## Environment setup
1. Copy `web/.env.example` to `web/.env.local`.
2. Fill in the dedicated GUDANGKU Supabase project URL and public anon/publishable key.
3. Never place a service-role key in either client app or commit it to Git.

## Workflow
- Keep Web and Android in separate folders.
- Share backend contracts and business rules through documented APIs/database functions.
- Review RLS and database security after every schema or policy change.
- Test stock-in, stock-out, transfer, and stock-count flows, including insufficient-stock and cross-organization access cases.

## Current stage
Repository foundation only. Application screens, authentication flows, automated tests, and CI have not yet been implemented.
