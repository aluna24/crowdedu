## Real authentication with Supabase Auth

Replace the in-memory mock with Supabase Auth so sessions persist, passwords are stored securely (hashed), and roles are enforced server-side.

### What changes for each user type

- **Students** — sign up themselves on a new "Sign Up" tab in the Login page. Email must end in `@gwu.edu` (validated client-side via Zod and server-side via a database trigger). They pick their own password (min 8 chars).
- **Employees & admins** — you give me the email + password for each (in your next message). I'll create those accounts directly in Supabase Auth so they exist immediately, with their role pre-assigned. They cannot be created via self-signup, and the `@gwu.edu` rule is bypassed for staff seeding.
- **Anyone signed in** stays signed in across page reloads (Supabase persists the session to localStorage automatically).

### Roles done safely

Per Lovable's security rules, roles live in their own table, never on a profile, and are checked via a `SECURITY DEFINER` function so RLS can't be bypassed.

```text
auth.users (managed by Supabase)
    │
    ├── public.profiles            (id, full_name, email)
    └── public.user_roles          (user_id, role)  ← role enum: student | employee | admin
```

A trigger on `auth.users` auto-creates a `profiles` row and assigns the `student` role on signup. The signup trigger also rejects any student email that doesn't end in `@gwu.edu` (staff accounts are seeded with the service role, which bypasses this check, so they can use any domain).

A `has_role(user_id, role)` SQL function lets RLS policies and the app check roles without recursion.

### Login page

Single card with two tabs:

- **Sign In** — email + password, works for all three roles.
- **Sign Up** — email (must be `@gwu.edu`) + full name + password + confirm password. After signup, the user is logged in immediately (email confirmation will be disabled in Supabase settings so there's no waiting for a verification email — I'll note this clearly so you can flip it on later if you want).

Errors shown inline. The existing demo-account hint box is replaced with: *"Students: sign up with your @gwu.edu email. Staff: use the credentials provided by your admin."*

### Header, ProtectedRoute, and the rest of the app

- `AuthContext` is rewritten to wrap Supabase Auth: subscribes to `onAuthStateChange`, exposes `user`, `isAuthenticated`, `login`, `signUp`, `logout`, plus the user's `role` (loaded from `user_roles`).
- `ProtectedRoute` keeps its current API (`allowedRoles`) — no changes needed in `App.tsx`.
- `Header` keeps showing the user's first name and the staff/admin links based on role.
- `Intramurals.tsx` and any other place that reads `user.email`/`user.id`/`user.name` keeps working — `AuthContext` exposes the same shape.

### Files

- **`src/context/AuthContext.tsx`** — rewrite to use `supabase.auth`. Same exported shape (`user`, `isAuthenticated`, `login`, `logout`) plus a new `signUp(email, name, password)`.
- **`src/pages/Login.tsx`** — Tabs for Sign In / Sign Up; Zod validation; `@gwu.edu` enforcement.
- **DB migration** — create `app_role` enum, `profiles` table, `user_roles` table with RLS, `has_role()` function, `handle_new_user()` trigger that creates the profile + assigns `student` role + rejects non-`@gwu.edu` student emails.
- **Seed staff accounts** — once you give me the credentials, I'll create them via an edge function using the Supabase Admin API and assign their roles in `user_roles`.

### What I need from you next

Reply with the four values and I'll proceed:

1. Admin email
2. Admin password
3. Employee email
4. Employee password

I'll also disable "Confirm email" in the Supabase Auth settings so signup is instant. Tell me if you'd rather keep email confirmation on.

### Not changing

Routes, intramurals data flow, capacity, fitness, equipment tickets, or any visual style outside the Login page.
