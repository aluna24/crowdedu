## Add Microsoft (Azure) SSO to Login Page

Add a "Continue with Microsoft" button to the login page using Supabase's built-in Azure OAuth provider.

### Code changes

**1. `src/context/AuthContext.tsx`**
- Add `signInWithAzure()` that calls:
  ```ts
  supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      scopes: 'email openid profile',
      redirectTo: `${window.location.origin}/`,
    },
  })
  ```
- Expose it via the `AuthContext` value.

**2. `src/pages/Login.tsx`**
- Add a "Continue with Microsoft" outline button (with Microsoft logo SVG) at the top of both Sign In and Sign Up tabs.
- Add an "or" divider between the SSO button and the email/password form.
- On click, call `signInWithAzure()` and surface errors in the existing error state.

**3. Domain restriction note**
- The existing `handle_new_user` trigger requires student emails to end with `@gwu.edu`. Microsoft sign-ins from non-GWU tenants will be rejected by the trigger, and the error will surface in the UI. No DB change needed.

### User-side setup required (one-time, cannot be automated)

Microsoft OAuth must be configured in Azure + Supabase before the button works:

1. **Azure Portal → App registrations → New registration**
   - Supported account types: choose "Accounts in any organizational directory and personal Microsoft accounts" (or restrict to your GWU tenant).
   - Redirect URI (Web): `https://bzifwbdeqnyvwviikxsh.supabase.co/auth/v1/callback`
2. **Certificates & secrets** → create a new client secret, copy the value.
3. **API permissions** → add Microsoft Graph delegated: `openid`, `email`, `profile`, `User.Read`.
4. **Supabase Dashboard → Authentication → Providers → Azure**
   - Paste Application (client) ID and client secret.
   - Azure Tenant URL: `https://login.microsoftonline.com/<tenant-id>` (or `common` for multi-tenant). For GWU-only, use the GWU tenant ID.
   - Enable the provider.
5. **Supabase → Authentication → URL Configuration**
   - Site URL: `https://crowdedu.lovable.app`
   - Add redirect URLs for the preview and published domains.

Until those steps are done, clicking the button returns a provider error.
