
## Intramural Team Registration — Authenticated + Email Invitations

Upgrade the Intramurals page so registration requires login, captures captain + member contact info, persists teams to the database, and emails each invited member a link to accept.

## What changes for the user

- **Must be logged in** to register a team. The "Register Team" button routes guests to `/login` (with a return path back to `/intramurals`).
- **New registration form fields**:
  - Team name
  - Captain name, captain email (prefilled from the logged-in user)
  - Team members — repeatable rows of `name` + `email`. Add up to **10 at a time** via an "Add 10 more rows" action; no cap on total members.
- **On submit**: team is saved, each member gets a unique invite token, and an email is sent to each member with an "Accept invitation" link.
- **Invite acceptance page** at `/intramurals/accept?token=…` — shows team/sport details and an Accept / Decline button. Status persists.
- **My Teams** section reads from the database and shows each member's invite status (Pending / Accepted / Declined).

## Database (new tables)

1. `intramural_teams`
   - `id uuid pk`, `sport_id text`, `team_name text`, `captain_user_id text`, `captain_name text`, `captain_email text`, `created_at timestamptz`
2. `intramural_team_members`
   - `id uuid pk`, `team_id uuid → intramural_teams`, `member_name text`, `member_email text`, `invite_token uuid unique`, `status text default 'pending'` (`pending` | `accepted` | `declined`), `responded_at timestamptz`, `created_at timestamptz`

RLS:
- `intramural_teams`: anyone authenticated can SELECT and INSERT; UPDATE restricted to captain.
- `intramural_team_members`: anyone authenticated can SELECT/INSERT (for team creation flow); UPDATE allowed publicly **only when matched by `invite_token`** (token acts as the auth for invitees who may not have accounts). Achieved via a SECURITY DEFINER RPC `respond_to_invite(p_token uuid, p_response text)` rather than a broad UPDATE policy.

## Email sending

Use Lovable's built-in transactional email system (no third-party service).

1. Run `email_domain--check_email_domain_status`.
   - If no domain → show `<lov-open-email-setup>` so the user configures one.
2. Run `email_domain--setup_email_infra` (idempotent).
3. Run `email_domain--scaffold_transactional_email`.
4. Add a new template `intramural-invite.tsx` with props `{ captainName, teamName, sportName, acceptUrl }` and subject `"You've been invited to join {teamName}"`. Register it in `registry.ts`.
5. Deploy the edge functions.
6. After the team insert, the client calls `supabase.functions.invoke('send-transactional-email', …)` once per member with `idempotencyKey: invite-${member.id}` and `templateData` carrying the invite link `${origin}/intramurals/accept?token=${invite_token}`.

## Frontend changes

- **`src/pages/Intramurals.tsx`**
  - Gate the "Register Team" dialog behind `useAuth().isAuthenticated`. If not logged in, button becomes "Log in to register" and navigates to `/login`.
  - Replace local `useState` team list with a Supabase fetch (filtered to `captain_user_id === user.id`).
  - New form: team name, captain name (prefilled), captain email (prefilled, editable), member rows (name + email each). Buttons: **Add member**, **Add 10 more rows**, **Remove row**. Validate with zod (non-empty names, valid emails, unique emails per team).
  - On submit: insert team → insert members (generates `invite_token` per row) → invoke send email per member → toast success.
- **`src/pages/IntramuralAccept.tsx`** (new)
  - Reads `?token=` param, fetches the invite + team + sport info, shows Accept / Decline buttons that call the `respond_to_invite` RPC. Handles already-responded and invalid-token states.
  - Public route (no auth required) added in `src/App.tsx`.
- **My Teams card**: list members with a status badge (Pending/Accepted/Declined).

## Files

- **New migration**: create `intramural_teams`, `intramural_team_members`, RLS policies, `respond_to_invite` RPC.
- **New**: `supabase/functions/_shared/transactional-email-templates/intramural-invite.tsx` + registry update.
- **New**: `src/pages/IntramuralAccept.tsx`.
- **Modified**: `src/pages/Intramurals.tsx`, `src/App.tsx` (add `/intramurals/accept` route).

## Notes

- Sports list stays as the existing in-file mock (`mockSports`) — no schema change needed there.
- "10 at a time" is implemented as a UX helper (button adds 10 empty rows); total team size is unlimited.
- Invite emails are 1-to-1 transactional sends triggered by a specific user action (team registration) — fully compliant with transactional rules.
- Idempotency keys ensure that retrying a failed registration won't double-send invites.
