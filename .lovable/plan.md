## Add Microsoft Azure (Entra ID) SSO to Login Page

Add a "Continue with Microsoft" button to the login page using Supabase's Azure OAuth provider, plus a small diagnostic button to verify the provider is configured.

### Changes

**1. `src/context/AuthContext.tsx`**
- Add `signInWithAzure()` that calls:
  ```ts
  supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${window.location.origin}/`,
      scopes: 'email openid profile',
    },
  })
  ```
- Expose it in the `AuthContext` value and type.

**2. `src/pages/Login.tsx`**
- Add a "Continue with Microsoft" button (outline variant, Microsoft logo SVG inline) at the top of both the Sign In and Sign Up tabs.
- Add an "or" divider between the SSO button and the email/password form.
- On click, call `signInWithAzure()`; surface any error in the existing error state.
- Add a small secondary "Check SSO status" link/button below the SSO button:
  - Calls `supabase.auth.signInWithOAuth({ provider: 'azure', options: { skipBrowserRedirect: true, redirectTo: ... } })`.
  - If the call returns `data.url` with no error → toast success: "Azure SSO is configured."
  - If error (typically "Unsupported provider" / "provider is not enabled") → toast error with the message and a hint to enable Azure in Supabase.
  - Uses `sonner` `toast` for feedback. No actual redirect happens because `skipBrowserRedirect: true`.

**3. `handle_new_user` trigger compatibility**
- Existing trigger requires student emails to end in `@gwu.edu`. Azure sign-ins from `@gwu.edu` tenant accounts will pass; others will fail at the trigger and the OAuth callback will surface an error. No DB change needed for MVP. (Noted for the user.)

### Required user setup (cannot be done from code)

For the button to actually sign users in, Azure must be configured. I'll include this after implementation:

1. **Azure Portal → Microsoft Entra ID → App registrations → New registration**
   - Supported account types: choose Single tenant (GWU) or Multitenant as needed.
   - Redirect URI (Web): `https://bzifwbdeqnyvwviikxsh.supabase.co/auth/v1/callback`
2. Copy the **Application (client) ID** and **Directory (tenant) ID**.
3. Certificates & secrets → New client secret → copy the value.
4. API permissions → add Microsoft Graph delegated: `openid`, `email`, `profile`, `User.Read` → Grant admin consent.
5. **Supabase Dashboard → Authentication → Providers → Azure**
   - Enable, paste Client ID, Client Secret, and Azure Tenant URL: `https://login.microsoftonline.com/<TENANT_ID>/v2.0`
6. **Supabase → Authentication → URL Configuration**
   - Site URL: `https://crowdedu.lovable.app`
   - Add redirect URLs: preview URL + published URL.

Until these are set, the "Check SSO status" button will report the provider as not enabled — which is exactly its purpose.

### Notes
- No database migration required.
- Uses `sonner` for the diagnostic toast (already wired up in `App.tsx`).
- Microsoft branding follows their button guidelines (white bg, Microsoft logo, "Continue with Microsoft" label).
