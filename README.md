# NSBE 2026 International Student Sponsorship Tracker
## Setup Guide — Estimated time: 15–20 minutes

---

## STEP 1 — Create your Supabase database (free)

1. Go to **https://supabase.com** and sign up (free)
2. Click **"New Project"** → give it a name like `nsbe-tracker` → set a password → click Create
3. Wait ~2 minutes for it to provision
4. Go to the **SQL Editor** (left sidebar) and run this query to create the table:

```sql
create table reports (
  id uuid default gen_random_uuid() primary key,
  company text not null,
  sponsors_opt boolean default false,
  sponsors_cpt boolean default false,
  requires_work_auth boolean default false,
  requires_citizenship boolean default false,
  requires_advanced_degree boolean default false,
  does_not_sponsor boolean default false,
  offering_interviews boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Allow anyone to read and insert (no login required for students)
alter table reports enable row level security;

create policy "Anyone can read reports"
  on reports for select using (true);

create policy "Anyone can insert reports"
  on reports for insert with check (true);
```

5. Go to **Settings → API** (left sidebar)
6. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (long string under "Project API keys")

---

## STEP 2 — Set up the project locally

```bash
# Install dependencies
npm install

# Create your env file
cp .env.example .env.local
```

Open `.env.local` and paste your Supabase values:
```
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...your_key_here
```

Test it works locally:
```bash
npm start
```
Open http://localhost:3000 — you should see the app.

---

## STEP 3 — Deploy to Vercel (free, gives you a public URL)

### Option A: Via GitHub (recommended)
1. Push this folder to a new GitHub repo:
```bash
git init
git add .
git commit -m "NSBE Sponsorship Tracker"
git remote add origin https://github.com/YOUR_USERNAME/nsbe-tracker.git
git push -u origin main
```
2. Go to **https://vercel.com** → Sign up with GitHub → **"Add New Project"**
3. Import your `nsbe-tracker` repo
4. Under **"Environment Variables"**, add:
   - `REACT_APP_SUPABASE_URL` → your Supabase URL
   - `REACT_APP_SUPABASE_ANON_KEY` → your Supabase anon key
5. Click **Deploy** → done!

### Option B: Via Vercel CLI (no GitHub needed)
```bash
npm install -g vercel
vercel
# Follow the prompts, add env vars when asked
```

Your app will be live at something like:
`https://nsbe-tracker.vercel.app`

---

## STEP 4 — Share with students

Just send them the Vercel URL. That's it.
- No login required
- All students see the same live data
- New reports appear in real-time for everyone

---

## What the database looks like

| Column | Type | Description |
|---|---|---|
| id | uuid | Auto-generated unique ID |
| company | text | Company name |
| sponsors_opt | boolean | Sponsors OPT |
| sponsors_cpt | boolean | Sponsors CPT |
| requires_work_auth | boolean | Requires work auth |
| requires_citizenship | boolean | Requires US citizenship |
| requires_advanced_degree | boolean | Requires MS/PhD to sponsor |
| does_not_sponsor | boolean | Does not sponsor |
| offering_interviews | boolean | In-person interviews at fair |
| notes | text | Free text notes from student |
| created_at | timestamptz | Auto timestamp |

---

## Troubleshooting

**"Could not load reports"** → Check your `.env.local` values are correct, no spaces or quotes around them.

**Blank page on Vercel** → Make sure the env vars are set in Vercel dashboard under Project → Settings → Environment Variables.

**Real-time not working** → Enable Replication in Supabase: Database → Replication → toggle on `reports` table.
