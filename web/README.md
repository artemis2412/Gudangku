# GUDANGKU Web

Next.js App Router + TypeScript web client.

## Current foundation
- Next.js 16 with React 19 and TypeScript strict mode
- Supabase browser/server clients using `@supabase/ssr`
- Next.js `proxy.ts` session refresh
- Signup, login, email confirmation, logout, and organization workspace
- Live inventory overview
- Master products, warehouses, customers, categories, and units with organization-scoped APIs
- Stock document drafts for IN, OUT, and TRANSFER
- Manager-only posting through the atomic database stock-posting function
- Per-warehouse stock balances and filterable stock movement ledger
- Stock opname drafts with manager-only atomic stock adjustments and audit history

## Setup
1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the GUDANGKU project's Connect dialog.
3. Run `npm install`.
4. Run `npm run dev`.

Node.js 20.9 or newer is required by Next.js 16. Do not use a service-role or secret key in browser-exposed environment variables.

## Transaction behavior
Creating a stock document saves a DRAFT and does not change stock. An owner, admin, or manager must post it. Posting calls the database function, which validates stock availability and atomically updates balances, movements, document status, and audit log. A failed posting leaves stock unchanged.


### Packaging and sales pricing
- Products can optionally define pieces per carton, selling price per piece, and selling price per carton.
- Outbound stock documents support piece/carton quantities, convert carton quantities to base stock units, and snapshot the selling price and line total on each document item.
- Stock balances and stock movements continue to use the product's base stock unit; outbound sales totals are displayed in transaction history and the stock card.


### Penjualan dan pembayaran

Transaksi barang keluar menyimpan snapshot harga jual per pcs/dus, subtotal, diskon, total akhir, metode pembayaran (tunai, transfer bank, QRIS, atau tempo), jumlah uang diterima, kembalian, dan status pembayaran (belum dibayar, sebagian, atau lunas). Nilai pembayaran dan diskon dihitung ulang serta divalidasi pada API sebelum draft disimpan. Stok tetap baru berubah setelah dokumen diposting.

### Customers and sales receipts
- Maintain an organization-scoped customer directory with name, optional code, phone, address, and notes.
- Select an optional customer on outbound sales drafts; customer details are shown on the printable sales receipt.

### Customer payment collection
- Posted outbound sales with an outstanding balance can receive additional payments without creating a new stock transaction.
- Each subsequent payment is recorded in a separate customer_payments ledger and atomically updates the sales document's amount received and payment status.
- Only organization members with owner, admin, manager, or staff roles can record payments; amounts cannot exceed the outstanding balance.

### Sales and receivables report
- The organization dashboard links to `/dashboard/[organizationId]/reports/sales` for posted outbound sales, with date and customer filters.
- The report summarizes gross subtotal, discounts, net sales, allocated payments, and outstanding receivables; drafts are excluded.
- Payment collected is capped at each sale's grand total so cash change is not counted as revenue collected. The report currently displays up to 1,000 matching transactions; narrow the date range for larger histories.

### Inventory and stock movement report
- The organization dashboard links to `/dashboard/[organizationId]/reports/inventory` with date, product, and warehouse filters.
- The report shows current on-hand quantity, estimated inventory value using each product's current purchase price, and movement totals for the selected period.
- The movement ledger includes stock documents and stock-count adjustments. Movement cost values are indicative snapshots; inventory value is not a historical valuation or accounting valuation report.
- The report currently shows up to 1,000 matching movements and 10,000 balance rows; narrow filters for large organizations.

### Suppliers, purchases, and supplier payables
- Organization-scoped supplier directory with contact, phone, email, address, and notes; supplier master data is managed by owner/admin/manager.
- Incoming stock drafts can optionally be linked to a supplier. Purchase totals are calculated from quantity multiplied by unit purchase cost, with discount and initial payment details.
- Posting an incoming document updates stock through the existing atomic stock-posting workflow. Supplier balances are tracked on the same posted purchase document.
- Subsequent supplier payments are recorded in `supplier_payments` and atomically update the purchase's amount received and payment status. Payments are limited to the outstanding amount.
- Supplier payment history is visible in transaction history. Supplier payment creation is available only for posted purchases linked to a supplier.

### Purchase and supplier payable reporting
- `/dashboard/[organizationId]/reports/purchases` reports posted supplier-linked incoming stock documents, filtered by date and supplier.
- Summary metrics include purchase count, purchase total after discounts, allocated payments, and outstanding supplier payables.
- Supplier payments are stored separately from stock movement and cannot exceed the outstanding purchase balance.
