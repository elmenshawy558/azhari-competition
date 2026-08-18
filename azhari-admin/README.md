# أزهري وأفتخر — Admin Panel (Supabase)

A single-admin competition management app: student registration, admin
approval/rejection, manual + bulk (Excel/CSV) scoring, and a single
publish/hide toggle for results — with every access rule enforced by
PostgreSQL Row Level Security, not by the app's UI.

## Why this is actually secure, not just "looks secure"

The most common way apps like this get built insecurely is checking
`if (user.role === 'admin')` in the frontend and calling it done — anyone who
opens devtools and calls the API directly walks right past that check. This
app doesn't have that problem, because the check isn't in the frontend:

- **Every table has Row Level Security enabled**, and the policies
  (`supabase/schema.sql`) are what decide whether a query returns rows —
  not application code. A student's Supabase session literally cannot
  retrieve another student's row, or any row from a hidden result set,
  no matter what request they craft.
- **There is exactly one admin, enforced by the database.** The `admins`
  table has a trigger that raises an error if you try to insert a second
  row. The app has no "become admin" flow anywhere — the only way to be
  the admin is to be the one row you manually inserted via SQL after
  creating your own account.
- **The fields a client is never allowed to set itself are overwritten
  server-side.** A student's `insert` into `students` gets its `user_id`
  and `approval_status` forced by a trigger regardless of what's submitted
  — so there's no way to insert a row claiming to be someone else, or to
  register as already-approved. Likewise, a score's `final` total and
  pass/fail `status` are always computed by a trigger from whatever score
  inputs — never trusted from the client.
- **The React components you'll see (`AdminGuard`, `StudentGuard`) are UX
  only.** They redirect an unauthorized visitor away from a page before it
  renders. If you deleted them entirely, the app would look broken for the
  wrong visitor, but no data would leak — that guarantee comes from RLS.

## Architecture

Because access control lives in the database, the app itself doesn't need
a custom backend or secret key at all — it's a fully static Next.js export
that talks straight to Supabase from the browser using the public anon key
(safe to expose by design; see above for what actually protects the data).
That means it deploys anywhere that serves static files: Vercel, Netlify,
GitHub Pages, or your own web server.

## Setup

### 1. Create a Supabase project
[supabase.com](https://supabase.com) → New Project. Note your Project URL
and anon/public key (Settings → API) — you'll need them for `.env.local`.

### 2. Run the schema
Supabase Dashboard → SQL Editor → paste the entire contents of
`supabase/schema.sql` → Run. This creates all four tables, every RLS policy,
the security triggers, and the grants those policies depend on.

### 3. Auth setting (important for one-step registration)
Dashboard → Authentication → Providers → Email → turn **off** "Confirm
email". With it on, `supabase.auth.signUp()` doesn't return an active
session immediately, so the app can't finish creating the student's profile
row in the same step (the registration form handles this gracefully with a
"check your email, then log in" message either way — but turning this off
gives the smoother one-step flow described in the brief).

### 4. Create yourself as the one admin
1. Dashboard → Authentication → Users → **Add user** (or just register
   through the app's normal `/register` page like a student would).
2. Copy that user's UUID from the Users table.
3. Open `supabase/seed-admin.sql`, paste your UUID in, run it in the SQL
   Editor. That's it — that account is now, and permanently, the only admin
   until you explicitly change it via SQL.

### 5. Local setup
```bash
npm install
cp .env.example .env.local     # fill in your Project URL + anon key
npm run dev
```

### 6. Build & deploy
```bash
npm run build      # outputs a static site to ./out
```
Point Vercel/Netlify at the repo (framework preset: Next.js, it'll detect
the static export automatically) or upload `./out` anywhere that serves
static files. Set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables on whichever host
you use, matching `.env.local`.

## What's built

- **Registration** — public sign-up creates a Supabase Auth account +
  a `students` row, always starting `PENDING` (can't be set otherwise, see
  the security section above)
- **Single unified login** — students and the admin use the same form;
  which dashboard they land on is decided by real database membership in
  `admins`, checked after authentication
- **Admin → Overview** — total / approved / pending / rejected counts, top-3
  winners once results are published, breakdown by governorate
- **Admin → Students** — search, filter by status, approve, reject (with a
  required reason the student sees on their dashboard), full edit modal
  (contact info, education fields, exam date/time/place), delete, CSV export
- **Admin → Results** — manual per-student score entry (autosaves on blur),
  Excel/CSV bulk import matched by registration number, and the single
  publish/hide toggle the brief asked for — when off, the `scores` RLS
  policy means literally nobody but the admin can read any score row; when
  on, each student's dashboard query for their own score succeeds and
  everyone else's still returns nothing
- **Student dashboard** — registration status (with rejection reason if
  applicable), exam schedule once set, and their result only once published

## Known simplifications (by design, given the brief's scope)

- No email notifications — the brief didn't ask for this round, and it
  would require a server-side function (Supabase Edge Functions + an email
  provider) since a static app can't hold an SMTP secret. Happy to add if
  you want it.
- No file upload for ID documents — same reasoning; Supabase Storage
  handles this well but wasn't in this round's brief. Let me know if you
  want it wired in.
- CSV export instead of a formatted Excel file — same output the admin
  actually needs (opens fine in Excel), without needing a bundled writer
  library.

## Regenerating types

`src/lib/types.ts` is hand-written to match `schema.sql` (no network access
in the environment this was built in to run `supabase gen types` against a
live project). Once your project is running, regenerate it for full,
guaranteed-accurate type safety:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/types-generated.ts
```

## A note on testing

This was built and reviewed line-by-line, including the RLS policies and
trigger logic, but not run end-to-end against a live Supabase project — this
environment has no network access to create one. Before relying on it,
walk through the actual attack surface yourself: sign up as a student, note
your session, and confirm in the Supabase Table Editor (or via the API
directly) that you can't read another student's row or any score while
results are hidden. That's the real test of an RLS-based app, more so than
the UI working correctly.
