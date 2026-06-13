-- Enable Row Level Security on every table in the `public` schema.
--
-- Why: Supabase exposes `public` through its auto-generated Data API (PostgREST),
-- reachable by the `anon` / `authenticated` roles. With RLS off, anyone holding
-- the project's anon key could read these tables directly. The app never uses the
-- Data API — it talks to Postgres via Prisma as the `postgres` role, which both
-- OWNS these tables and has the BYPASSRLS attribute — so enabling RLS is
-- invisible to the app but denies the Data API by default.
--
-- No policies are added on purpose: RLS with zero policies = deny-all for the
-- Data API roles, while `postgres` (owner + BYPASSRLS) keeps full access. This
-- clears the Supabase Security Advisor "RLS Disabled in Public" findings.
ALTER TABLE public."NIModel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ModelSample" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ModelSampleLatest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Incident" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
