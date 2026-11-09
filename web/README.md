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
