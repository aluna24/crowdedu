## Remove Microsoft Azure SSO from Login Page

Revert the login page and auth context to their pre-SSO state.

### Changes

**1. `src/pages/Login.tsx`**
- Remove the `MicrosoftIcon` SVG component.
- Remove `signInWithAzure` and `checkAzureSSO` from the `useAuth()` destructure.
- Remove the `handleAzure` and `handleCheckSSO` handlers.
- Remove the "Continue with Microsoft" button, "Check SSO status" button, and "or" divider from both the Sign In and Sign Up tabs.
- Remove unused imports: `ShieldCheck`, `toast` from sonner.

**2. `src/context/AuthContext.tsx`**
- Remove `signInWithAzure` and `checkAzureSSO` methods.
- Remove them from the `AuthContextType` interface.
- Remove them from the `AuthContext.Provider` value.

### Notes
- No database changes.
- The standard email/password Sign In and Sign Up flows remain unchanged.
- If Azure was enabled in the Supabase dashboard, you can disable it there at your convenience — it won't affect the app once the buttons are removed.
