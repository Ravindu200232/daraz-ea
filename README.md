# DarazEA

DarazEA is a single-seller online store for Sri Lanka and the back office that runs it. One owner
sells their own products — it is not a marketplace — so the catalogue, the orders and the management
side all belong to one shop. Every price, delivery fee and total in it is in Sri Lankan Rupees (LKR,
shown as `Rs.`), and delivery is charged per area at checkout: it is never free.

It is for four kinds of people:

- **a guest** — browses, searches, filters and sorts the catalogue, fills a cart, checks out with a
  name, phone number and address, and tracks the order afterwards with the order number and phone;
- **a shopper** — an account holder (email and password) with a wishlist, saved addresses, reviews,
  coupons, an order history that follows placed → confirmed → shipped → delivered, and return
  requests on delivered items;
- **Staff** — the shop floor: products with photos, prices and per-variant stock, categories, order
  stages, returns, coupons, any customer's record, and hiding or showing reviews. Staff cannot touch
  payments or store settings;
- **the Store Owner** — everything Staff can do plus sales totals and best sellers for a period, the
  fixed delivery fee per area, which ways of paying are on, the customer's own staff accounts, and
  the store's settings.

## Live address

<https://daraz-ea.vercel.app>

That deployment runs on Vercel's free **Hobby** plan, which is licensed for personal, non-commercial
projects only, and it is deliberately gated: every page sits behind Vercel Authentication ("All
Deployments"), so anyone without access to the Vercel account that owns the project sees a sign-in
page instead of the shop. Take real orders somewhere on a paid plan before selling; see
[Known limitations](#known-limitations).

## Stack

- **Next.js 15** (App Router) — 38 pages, 27 route handlers under `app/api/`.
- **Supabase** — Postgres (20 tables plus `management_codes`), Auth (email/password), Storage for
  product photos, and Row Level Security on every table.
- **Tailwind CSS 3** with a small set of shared components (`components/ui/`), plus `globals.css` for
  the design tokens.
- **Vitest** for unit tests; **Playwright** for the journey, visual and accessibility layers;
  **Lighthouse CI** and an **OWASP ZAP** baseline for performance and security.

## Folder layout

```
app/                    pages (App Router) and route handlers under app/api/
components/             shared UI, shell, product, admin and auth components
lib/                    Supabase clients, queries, pricing, money, validation, session rules
supabase/migrations/    the schema and every RLS policy, applied in filename order
scripts/                schema, seed, and the QA runners
test/                   unit tests            e2e/   journey, visual and accessibility tests
```

## Prerequisites

- Node.js 20 or newer (the deployed build is pinned to Node 22 through `engines` in
  `package.json`).
- npm (the lockfile is committed — always install from it).
- A Supabase project of your own, or the connected one, reachable over the internet.

## Local setup

```bash
npm ci                     # install exactly what the lockfile pins
cp .env.example .env.local # then fill in the four values from your Supabase project
node scripts/apply-schema.mjs   # create the tables and RLS policies (safe to re-run)
npm run seed                    # optional: load the demo cast the store was designed around
npm run dev                     # http://localhost:3000
```

`node scripts/apply-schema.mjs` needs `SUPABASE_DB_URL` (the Postgres connection string, from
Supabase's *Connect* panel) as well as the variable names below; the app itself never uses a direct
database connection, it talks to Supabase over HTTPS.

## Environment variables

Every value comes from your own Supabase project's *Settings → API*. Never commit a real value —
`.env.example` is the only file with these names in it, and it carries no values.

| Name | Purpose | Required | Where it is set |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The project URL the browser and the server both call | yes | `.env.local` locally; Vercel → project → Settings → Environment Variables (production) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public key; every query it makes is still decided by RLS | yes | same as above |
| `SUPABASE_URL` | The same project URL, read on the server only | yes | same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key that bypasses RLS: seeds, uploads, management codes | yes | same as above — **never** give it a `NEXT_PUBLIC_` prefix |
| `SUPABASE_DB_URL` | Postgres connection string used only by `scripts/apply-schema.mjs` | for the schema step | local shell or CI secret; not needed by the deployed app |

Build-time values: the two `NEXT_PUBLIC_*` names are compiled into the browser bundle, so they have
to be set on the host **before** the deployment is built.

## Tests

```bash
npm test              # unit tests (Vitest) — pricing, coupons, cart caps, order stages, returns,
                      # roles, validation, and POST /api/checkout through its own HTTP shape
npm run qa:e2e        # the twelve business journeys and the smoke/refused-visitor checks
npm run qa:visual     # screenshot baselines (the first run records them, later runs compare)
npm run qa:a11y       # axe, serious and critical findings only
npm run qa:perf       # Lighthouse thresholds over ten pages
npm run qa:security   # an OWASP ZAP baseline against the running app
npm run audit         # dependency advisories at the high threshold
```

`npm run qa:*` start the built app themselves on a free port. Every layer above was run on this
build and passed; `npm run audit` currently reports advisories — see
[Known limitations](#known-limitations).

## Deploying

The deployment is made from this repository with the Vercel CLI, from a linked checkout:

```bash
npm ci && npm test && npm run build   # the gate: never deploy a red build
vercel link --yes --project daraz-ea  # once per machine
vercel deploy --prod --yes --logs     # builds in Vercel's cloud and aliases production
vercel inspect <deployment-url>       # state, region, functions and aliases
```

The store is served at the project's own `daraz-ea.vercel.app` address; functions run in `bom1`
(Mumbai), the region nearest the database and the shop's Sri Lankan visitors, set in `vercel.json`.
Deployment protection is switched on for **all** deployments in the project's settings; automated
callers (the QA suite, a monitor) need a Protection Bypass for Automation secret, which the tests
pick up as the `VERCEL_AUTOMATION_BYPASS_SECRET` environment variable.

To go back a step: `vercel ls` lists deployments and `vercel rollback <previous-production-url>`
points production at the previous one (the Hobby plan can only step back one deployment, and
`vercel promote <url>` undoes a rollback). `vercel remove daraz-ea` deletes the project and its
deployments; neither it nor a rollback touches the data in Supabase.

## Signing in

Shoppers sign in at `/login` with email and password; anyone can register at `/register` and a new
registration is always a shopper. Management signs in at `/admin/login` with the password **and** a
one-time code.

That one-time code is written server-side to the `management_codes` table, and no mail or SMS
provider is configured, so the message is recorded rather than delivered. To finish a management
sign-in, read the newest unused, unexpired code for that account in the Supabase dashboard
(*Table Editor → `management_codes`*) and type it into the second step. Enabling Supabase Auth's own
email, or a mail provider, is what turns that into a delivered code.

The store keeps three fictitious demo accounts, as the specification describes (all three use the
password in `scripts/seed.mjs`, where it is written down deliberately and is not used anywhere else):

| Account | Role | What it can do |
| --- | --- | --- |
| `store.owner@example.com` | Store Owner | everything, including payments and store settings |
| `staff@example.com` | Staff | catalogue, orders, returns, customers, coupons, reviews |
| `shopper@example.com` | Shopper | the shopper account: wishlist, orders, returns, reviews |

Because those demo accounts can change prices, read every customer record and record payments,
switch them off or change their passwords on the Staff Members page as soon as the store is shared
with anyone.

## Known limitations

Taken from the build and test records; none of them is hidden by the deployment.

- **Online payments are refused.** No live card (LankaPay/PayHere), mobile wallet (eZ Cash, mCash,
  KOKO), bank transfer or PayPal credentials are configured, so an online attempt is refused before
  anything is recorded — no order, no coupon use, no stock movement. Cash on delivery records the
  order straight away; bank transfer records it and stays unpaid until Staff record the money.
- **Order emails and text messages are recorded, not delivered.** Every order stage writes its
  `order_messages` row (email sent, SMS recorded as "Not sent" while the channel is off). No
  transactional email provider is configured.
- **Google sign-in is not complete.** The button starts the real Supabase OAuth flow, but the Google
  provider has to be enabled in the Supabase project's Auth settings before it can finish.
- **Management codes are read from the database** (see [Signing in](#signing-in)).
- **Dependency advisories.** `npm audit` reports advisories in the tool chain (Lighthouse's
  Puppeteer chain, Vitest's `tinypool`, Tailwind's `chokidar`/`braces`, Lighthouse CI's `tmp`) and in
  the PostCSS that Next.js bundles for its own build. None of them is reachable from the running
  store — they are build- and test-time tools — and every one of them only clears with a breaking
  major upgrade (`next` 16, `vitest` 5, `tailwindcss` 4), which was not forced. The audit is not
  suppressed; it reports what it finds.
- **Free-plan ceilings.** The host's free plan allows 100 GB of fast data transfer a month, 1,000,000
  function invocations, 4 CPU-hours and one hour of runtime logs; Supabase's free plan allows a
  500 MB database, 5 GB egress, 1 GB file storage, no automatic backups, and pauses a project after
  a week of low activity.
- **Nothing is ever deleted by a deploy.** `npm run seed` only ever upserts on a natural key
  (email, slug, code, order number). Running it against production adds or refreshes those rows and
  never truncates, so orders and customers created later are untouched.
