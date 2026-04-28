## Goal

Transform the Admin page from a simple form panel into a **data dashboard** with operational controls across the rec center's domains: Capacity, Group Fitness, Reservations, Intramurals, and Events.

## New Admin Page Structure

Replace the current narrow `max-w-3xl` layout with a wider dashboard layout. Top of page = at-a-glance KPIs. Below = tabbed sections for each functional area.

```text
┌──────────────────────────────────────────────────────────┐
│ Admin Dashboard                                           │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │Today │ │Avg % │ │Open  │ │Pending│ │Active│  KPI cards │
│ │count │ │full  │ │tickts│ │ resvs │ │teams │             │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘             │
│                                                           │
│ [Overview][Capacity][Classes][Reservations]              │
│ [Intramurals][Events][Tickets][Announcement]             │
│ ─────────────────────────────────────────────             │
│ <tab content>                                             │
└──────────────────────────────────────────────────────────┘
```

## Tab-by-Tab Plan

### 1. Overview (default)
- 5 KPI cards (already shown above): today's total scans, avg % full this week, open equipment tickets, pending reservation requests, active intramural teams.
- Recent activity feed: last 10 reservations + tickets + team registrations.

### 2. Capacity (trends)
- Reuse `CapacityTrends` component for total + per-area.
- Add **Busiest day of week** and **Busiest area** computed from `facility_count`.
- Stacked area chart of past 7 days by area.

### 3. Classes (Group Fitness management) — biggest new section
Sub-sections:

**a. Class roster table** — pulled from `fitness_classes`. Each row: name, instructor, day/time, location, enrolled/max, actions.
- **Edit**: opens dialog to change `name`, `instructor`, `day`, `time`, `location`, `max_spots`. Updates the row via `supabase.from("fitness_classes").update(...)`.
- **Cancel class**: confirm dialog → marks class cancelled. Since the table has no `status` column today, we'll add one (`status text default 'active'`); cancelled classes are hidden from the student schedule, listed in admin with a "Restore" action.
- Filter by day/category.

**b. Popularity insights** — derived from `class_reservations` joined to `fitness_classes`:
- **Most popular classes** (top 5 by reservation count) — bar chart.
- **Least popular classes** (bottom 5, excluding cancelled).
- **Popular times**: bucket reservations by class `time` (morning / midday / evening) and by exact slot.
- **Popular days**: bar chart by class `day`.

**c. Student attendance & milestones** — from `class_reservations` grouped by `user_id`, joined to `profiles` for names:
- Leaderboard table: Student, # classes reserved, milestone badge (50/100/250/500).
- "Newly hit milestones this week" highlight strip.
- Note: this counts reservations as proxy for attendance (current schema has no separate attended flag); we'll label the column "Classes reserved" so it's accurate. If the user later wants check-in tracking, we can add an `attended` boolean.

### 4. Reservations
- Keep existing `ReservationRequestsAdmin` (approve/deny with reason).
- Add small chart: requests by space, requests by status.

### 5. Intramurals (kept relatively simple, per request)
- Read-only summary: teams per sport, pending approval count, link/button to existing intramurals page for full management.
- No structural changes to the intramurals flow itself.

### 6. Events (new full management UI)
Currently `Events.tsx` uses a hard-coded `mockEvents` array. We'll move events to the database so admins can manage them.

**Schema change** — new `events` table:
- `id uuid pk`, `title text`, `description text`, `date_label text` (free-form like "Apr 18" or "Mar 29 – Mar 31"), `type text` (event/closure/news), `priority int` (lower = higher in list), `created_at timestamptz`.
- RLS: anyone can SELECT; only admins can INSERT/UPDATE/DELETE (using `has_role(auth.uid(),'admin')`). Since the app uses mock auth (not real Supabase auth), we'll mirror the existing pattern used by other tables and allow public write — staff routes are gated client-side. Confirm preferred approach in implementation.

**Admin Events tab**:
- List all events with drag-handle for reorder (updates `priority`).
- "Add event" button → dialog with title, type, date_label, description.
- Edit / delete actions per row.
- Up/Down arrows as a non-DnD fallback.

**Events.tsx (student view)**:
- Switch from `mockEvents` to fetching from `events` table, ordered by `priority`.

### 7. Equipment tickets — keep `EquipmentTicketList mode="admin"` as is.

### 8. Announcement — keep current form as is.

## New Files

- `src/pages/Admin.tsx` — rewritten as dashboard layout.
- `src/components/admin/AdminKpiCards.tsx` — top KPI strip.
- `src/components/admin/AdminOverview.tsx` — overview tab + recent activity.
- `src/components/admin/AdminCapacity.tsx` — capacity insights wrapper.
- `src/components/admin/ClassesManager.tsx` — roster table + edit/cancel dialogs.
- `src/components/admin/ClassPopularity.tsx` — popularity charts.
- `src/components/admin/StudentAttendance.tsx` — leaderboard + milestones.
- `src/components/admin/EventsManager.tsx` — admin events CRUD + reorder.
- `src/components/admin/IntramuralsSummary.tsx` — read-only summary.

## Modified Files

- `src/pages/Admin.tsx` — new tabbed dashboard.
- `src/pages/Events.tsx` — fetch from `events` table instead of `mockEvents`.

## Database Migrations

1. `alter table fitness_classes add column status text not null default 'active';`
2. Create `events` table with columns above + RLS policies (public read, public write to match existing app pattern; document this in security memory).

## Out of Scope (call out to user)

- Real "attendance" tracking — current schema only records reservations. Leaderboard will be labeled "Classes reserved". Adding a separate check-in flow can be a follow-up.
- Drag-and-drop events reorder will use up/down buttons initially; full DnD can be added if desired.
- Intramural team management beyond viewing remains on the existing Intramurals page.
