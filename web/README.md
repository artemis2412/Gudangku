# GUDANGKU Web

Next.js App Router + TypeScript web client.

## Current foundation
- Next.js 16 with React 19 and TypeScript strict mode
- Supabase browser/server clients using `@supabase/ssr`
- Next.js `proxy.ts` session refresh
- Signup, login, email confirmation, logout, and organization workspace
- Live inventory overview
- Master products, warehouses, categories, and units with organization-scoped APIs
- Stock document drafts for IN, OUT, and TRANSFER
- Manager-only posting through the atomic database stock-posting function
- Per-warehouse stock balances and filterable stock movement ledger

## Setup
1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the GUDANGKU project's Connect dialog.
3. Run `npm install`.
4. Run `npm run dev`.

Node.js 20.9 or newer is required by Next.js 16. Do not use a service-role or secret key in browser-exposed environment variables.

## Transaction behavior
Creating a stock document saves a DRAFT and does not change stock. An owner, admin, or manager must post it. Posting calls the database function, which validates stock availability and atomically updates balances, movements, document status, and audit log. A failed posting leaves stock unchanged.
