# GUDANGKU Architecture

## Goals
Build a reliable inventory application for Web and Android Native, initially for internal use.

## System boundaries
- Web client: Next.js + TypeScript.
- Android client: Kotlin native.
- Backend: dedicated GUDANGKU Supabase project.
- Database: PostgreSQL with organization-scoped records and RLS.

## Data domains
- Organizations and organization members
- Warehouses
- Product categories, units, products
- Suppliers
- Stock documents and document items
- Stock balances and immutable stock movements
- Stock counts and count items
- Audit logs

## Inventory rules
- Draft documents do not affect stock.
- Posting a stock document is an authorized, atomic operation.
- Stock-out and transfer-out must reject insufficient stock.
- Transfers create an outbound and inbound movement.
- Posted stock records must not be edited as ordinary drafts; corrections should use a controlled reversal/adjustment workflow.
- Stock balances are a query-friendly projection; movement history is the audit trail.

## Tenant isolation
Every tenant-owned row carries an organization identifier. RLS policies and database constraints enforce organization boundaries. Never rely only on client-side filtering.

## Secrets
Only public/publishable Supabase client credentials may be included in client configuration. Service-role keys and other secrets must remain server-side.
