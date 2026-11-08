# GUDANGKU Web

Next.js App Router + TypeScript web client.

## Current foundation
- Next.js 16 with React 19
- TypeScript strict mode
- Supabase browser/server clients using `@supabase/ssr`
- Next.js `proxy.ts` session refresh foundation
- Initial inventory workspace landing page

## Setup
1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the GUDANGKU project's Connect dialog.
3. Run `npm install`.
4. Run `npm run dev`.

Node.js 20.9 or newer is required by Next.js 16. Do not use a service-role or secret key in browser-exposed environment variables.

Authentication screens and protected workspace routes are the next implementation step.
