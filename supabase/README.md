# Supabase

This directory holds reviewed SQL migrations for the dedicated GUDANGKU Supabase project.

## Migrations
- `migrations/202611090001_expose_authenticated_stock_document_posting.sql`: exposes a narrowly scoped authenticated RPC wrapper around the private role-checked atomic stock posting function. The wrapper is SECURITY INVOKER; the underlying private function performs the manager-role check and all stock mutations in one transaction.

The initial database baseline is already provisioned in the live project and documented in `../docs/DATABASE.md`. Capture and verify the canonical baseline migration before using automated database resets or deployment pipelines.
