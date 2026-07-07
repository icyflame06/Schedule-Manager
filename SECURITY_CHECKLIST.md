# Security Checklist

Ensure the following manual tasks are completed before going to production:

- [ ] **Supabase Dashboard - RLS**: Run the SQL migration to add the `role` column to the `profiles` table. Enable RLS on all tables if not already active. Update policies to include `role = 'admin'` bypass.
- [ ] **Supabase Dashboard - JWT**: Ensure JWT Expiry is set to a reasonable time (e.g., 3600 seconds).
- [ ] **Environment Variables**:
  - Add `ARCJET_KEY` to `.env.local` and Vercel/production.
  - Add `NEXT_PUBLIC_SENTRY_DSN` to `.env.local` and Vercel/production.
- [ ] **Google Cloud Platform**:
  - Ensure the OAuth Consent Screen is strictly configured.
  - Restrict the API Keys to your production domain only.
- [ ] **DNS & HTTPS**: Ensure your domain is proxied through Cloudflare or similar, with strict HTTPS enforcement (HSTS is already in code).
