# Stefanx — Frontend (Phase 4, mock-data mode)

This is the SvelteKit frontend running **without** the Supabase backend
connected — everything (accounts, wallet balance, transactions) lives
in `localStorage` so you can build and demo the full user experience
before wiring up the database and Edge Functions from earlier phases.

## Open access (temporary)

Login is currently **not required** — `AUTH_REQUIRED` in
`src/routes/+layout.svelte` is set to `false`, so anyone landing on
the app is auto-signed into a shared local "Guest" account (₦5,000
starter balance) instead of being sent to `/login`. This is purely so
the app can be browsed/demoed freely right now. To re-enable the login
requirement later, flip that one constant back to `true` — the actual
login/register pages and their logic are untouched and still work
exactly as before.

## Run it

```bash
npm install
npm run dev
```

Open the printed localhost URL. Register an account (any email/phone/
password — nothing is verified against a real backend), fund your
wallet from the dashboard, and try a purchase.

## What's real vs. mocked

| Piece | Right now | Once Supabase is connected |
|---|---|---|
| Sign up / sign in | `src/lib/stores/db.ts` — `localStorage`, fake password hash | Supabase Auth (email + Google), from the `sveltekit-google-auth` scaffold built earlier |
| Wallet balance | A number in `localStorage`, updated synchronously | `wallets.balance`, updated only via `process_wallet_credit/debit` |
| Fund wallet | Instantly credits, no real payment | Redirect to Paystack/Flutterwave → `fund-wallet-webhook` Edge Function |
| Buy airtime/data/electricity/cable | Instantly "succeeds", debits local balance | `buy-airtime` / `buy-data` / `buy-electricity` / `buy-cable` Edge Functions |
| Transaction history | Array in `localStorage` | `service_transactions` + `wallet_transactions`, queried via Supabase client |

## The one file that matters when we reconnect the backend

**`src/lib/stores/db.ts`** is the single seam between the UI and its
data source — every page imports `currentProfile`, `walletBalance`,
`transactions`, `purchaseService()`, etc. from there, and nothing else
touches `localStorage` directly. When it's time to go live:

1. Swap the mock `register`/`login`/`loginWithGoogleMock` functions
   for real `supabase.auth.*` calls (see the `sveltekit-google-auth`
   scaffold — `hooks.server.ts`, `login/+page.svelte`, the OAuth
   callback route).
2. Replace the derived stores (`walletBalance`, `transactions`) with
   Supabase queries — either `load` functions per route, or Supabase's
   realtime subscriptions if you want live updates.
3. Replace `purchaseService()` and `fundWallet()` with `fetch()` calls
   to the deployed Edge Functions (`buy-airtime`, etc.) instead of
   mutating local state directly.

None of the page components (`dashboard`, `buy-airtime`, `buy-data`,
`electricity-bill`, `tv-subscription`, `transaction-history`,
`profile`) should need to change — they only ever talk to the store,
never to `localStorage` or Supabase directly.

## Structure

```
src/
├── lib/
│   ├── components/     # WalletCard, FundWalletModal, TransactionRow, BottomNav, PageHeader, ToastHost
│   ├── data/catalog.ts # mock networks/data plans/discos/cable packages
│   ├── stores/db.ts    # the seam — see above
│   ├── format.ts       # Naira/date formatting
│   └── types.ts        # Profile/Transaction types, shaped like the real schema
└── routes/
    ├── login/, register/, complete-profile/
    ├── dashboard/
    ├── buy-airtime/, buy-data/, electricity-bill/, tv-subscription/
    ├── transaction-history/
    └── profile/
```

## Not built yet (deferred, per MVP scope)

Support/help page, admin dashboard (that's Phase 7, and will likely
be a separate route group like `/admin/*` once we're back on
Supabase, following the same pattern as the React admin pages from
the very first version of this project).
