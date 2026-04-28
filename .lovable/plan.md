## Goal

1. Only signed-in students can submit reservation requests.
2. Capture the requester's email on the form.
3. Admins get a third action — "Request More Info" — which requires them to specify what info is needed.

## Changes

### 1. Reservation context (`src/context/ReservationRequestsContext.tsx`)
- Extend `RequestStatus` to: `"pending" | "approved" | "denied" | "info_requested"`.
- Add `email: string` and `infoRequest?: string` to `ReservationRequest`.
- Add `requestInfo(id, message)` function that sets status to `info_requested` and stores the admin's message.
- Treat `info_requested` like `pending` for conflict checks (still occupies the slot, not denied).
- Sort order in admin: pending → info_requested → approved → denied.

### 2. Reserve dialog (`src/components/ReserveSpaceDialog.tsx`)
- Gate access via `useAuth`. If not signed in OR not a student, show a disabled trigger with a tooltip / toast prompting login. Simplest: render a "Sign in to Reserve" button that links to `/login` when no user.
- Pre-fill and require an `email` input (default `user.email`, editable but required, validated).
- Submit calls `addRequest({ email, ... })`.

### 3. Reservations page (`src/pages/Reservations.tsx`)
- Continue to show `<ReserveSpaceDialog />` only for students; the dialog itself handles the not-signed-in case.

### 4. Admin view (`src/components/ReservationRequestsAdmin.tsx`)
- Add third button **"Request Info"** alongside Approve / Deny on pending and info_requested rows.
- Opens a dialog with required textarea: "What information do you need from the requester?" (max 500 chars).
- Display requester `email` on each card.
- Show new badge for `info_requested` (amber/secondary with `MessageCircleQuestion` icon).
- If the row is already `info_requested`, show the previously sent message and allow updating it.

### 5. Student view (`src/components/MyReservationRequests.tsx`)
- Render `info_requested` badge with the admin's question highlighted, and instruct the student to contact the rec center / resubmit. (No edit flow for now — just visibility. Clear button available like denied.)

## Technical notes
- All state is in-memory (existing pattern); no DB migration required.
- Email validation: simple regex + non-empty trim, max 255 chars.
- Auth gate uses `user?.role === "student"` and `isAuthenticated`. Header `/login` redirect is the existing flow.
