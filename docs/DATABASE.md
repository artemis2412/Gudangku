# Database Notes

The dedicated GUDANGKU Supabase project has an initial database foundation.

## Initial public tables
1. organizations
2. organization_members
3. warehouses
4. product_categories
5. units
6. products
7. stock_documents
8. stock_document_items
9. stock_balances
10. suppliers
11. stock_movements
12. stock_counts
13. stock_count_items
14. audit_logs

## Security baseline
- RLS is enabled on all 14 public application tables.
- Organization membership scopes tenant access.
- Roles include owner, admin, manager, staff, and viewer.
- Stock posting is handled by a restricted database function in the private schema.

## Important
The initial schema was provisioned directly in the Supabase database during foundation setup. Before relying on automated deployments or fresh environment provisioning, capture and review a canonical SQL migration from the live schema, then commit it under `supabase/migrations/`.

Do not create a second competing schema definition. The live Supabase schema is the source of truth until the baseline migration is captured and verified.
