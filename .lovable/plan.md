## Add "Forgot password?" — students only

Standard Supabase password reset, but gated so only student accounts can use it. Staff (admin / employee) accounts are excluded — if they forget their password, the admin re-issues credentials manually.

### User flow

```text
Login page  ──▶  "Forgot password? (students)"  link
                          │
                          ▼
              /forgot-password  (enter @gwu.edu email, submit)
                          │
                          ▼
        Edge function: check-student-eligibility
            │ looks up user_roles for that email
            │
            ├─ role = student  ──▶  send reset email
            │
            └─ role = employee/admin OR not found
                              │
                              ▼
              Generic success message either way
              ("If a student account exists for that email,
                a reset link is on its way.")
```

We always show the same success message so the page never reveals whether an email belongs to a staff account or doesn't exist at all.

### Code changes

**New edge function: `supabase/functions/request-student-password-reset`**
- Public function (no JWT required) — takes `{ email }`.
- Uses the service role key to:
  1. Validate email ends with `@gwu.edu` (cheap pre-check; same rule as signup).
  2. Look up the user by email via `auth.admin.listUsers` or a profile query.
  3. Check `user_roles` — only proceed if role is `student`.
  4. If eligible, call `supabase.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: \`${origin}/reset-password\` } })` — this sends the standard Supabase recovery email.
- Always returns `{ ok: true }` (never reveals eligibility) so the UI shows the same message in all cases.
- Rate limited in-memory (best-effort) to slow down enumeration attempts.

**New page: `src/pages/ForgotPassword.tsx`**
- Email input + Submit.
- Calls the edge function above (NOT `resetPasswordForEmail` directly from the client, because the client can't safely check role).
- Shows the generic success message on submit.
- Header text makes it clear: *"For student accounts only. Staff: contact your admin to reset your password."*

**New page: `src/pages/ResetPassword.tsx`** (public route, no auth guard)
- Listens for the `PASSWORD_RECOVERY` event from `supabase.auth.onAuthStateChange` to pick up the recovery session from the URL.
- New password + confirm inputs. Zod: min 8 chars, must match.
- Calls `supabase.auth.updateUser({ password })`.
- After success → toast + redirect to `/`.
- If opened without a valid recovery session (link expired/invalid), shows a friendly error and a link back to `/forgot-password`.

**`src/pages/Login.tsx`**
- Add a small link under the password field on the Sign In tab: *"Forgot password? (students)"* → `/forgot-password`.

**`src/App.tsx`**
- Register two new public routes: `/forgot-password` and `/reset-password`.

### Why route through an edge function

If we used `supabase.auth.resetPasswordForEmail()` directly from the browser, Supabase would email a reset link to anyone — including staff. There's no client-side way to enforce "students only" without an admin check, and admin checks require the service role key, which only the edge function has.

### Email delivery

Reset emails use Supabase's default sender for now. Branded CrowdEDU emails from your own domain are a separate setup — happy to do that as a follow-up if you want.

### Not changing

- Microsoft SSO flow, staff seeding, `user_roles`, `profiles`, RLS, or any other pages.

### Approve and I'll build it.
