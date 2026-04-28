# Homepage Redesign — Premium Dashboard

Redesign `src/pages/Home.tsx` into a polished, modern SaaS-style dashboard for the recreation center. Existing branding, header/navbar, routes, and `GymContext` data stay intact.

## Design language

- Palette: blue + white with subtle gradients. Introduce a soft "brand-blue" accent on top of the existing navy primary, while keeping current tokens working elsewhere on the site.
- Soft shadows (`shadow-sm` → custom `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`), large rounded corners (`rounded-2xl`), generous spacing (`gap-6`, `p-6/8`), Space Grotesk display font (already loaded).
- Subtle on-load fade-in using existing `animate-fade-in` keyframe in `tailwind.config.ts` plus small staggered delays via inline style.
- Hover lift on cards: `transition-all hover:-translate-y-0.5 hover:shadow-md`.

## Page structure (top → bottom)

```text
[Top alert banner — dismissible]
[Hero: headline, subtitle, live chips, occupancy card, 2 CTAs]
[Quick stats row: 4 cards]
[Feature grid: 6 premium cards w/ badges]
[Two columns: Today's Classes | Operating Hours]
[Footer]
```

### 1. Top alert banner
- Slim full-width strip above hero, inside the page container.
- Uses existing `useGym().announcement` if present, otherwise a default: "Lerner Center closes early Friday at 8 PM".
- Warning icon (`AlertTriangle`) + text + dismiss `X` button. Local `useState` controls visibility (per-session).
- Soft amber gradient background, rounded-full pill on desktop / rounded-2xl on mobile.

### 2. Hero
- Headline: "Recreation Center Dashboard" (large, bold, tracking-tight).
- Subtitle: "Live facility updates, classes, reservations, and campus wellness tools."
- Live status chips row:
  - Green pulsing dot + "Live Now"
  - Clock icon + "Updated {hh:mm AM/PM}" — formatted from `lastUpdated` in `GymContext`.
- Centered occupancy card (`max-w-xl`):
  - "Current Occupancy" label
  - Large number `{totalCount} / {totalCapacity}` (real values from context)
  - "{totalPercent}% Capacity"  ·  "Status: {totalStatus}" colored chip
  - Animated progress bar (Tailwind `transition-all duration-700 ease-out` width %).
- CTA buttons under card:
  - `[View Capacity]` → `/capacity` (primary)
  - `[Reserve Space]` → `/group-fitness` (outline)

### 3. Quick stats row
Four equal cards (grid 2 cols on mobile, 4 cols on `md`):
- Students Inside — `totalCount` (live from context) — icon `Users`
- Classes Today — `8` — icon `Dumbbell`
- Open Courts — `3` — icon `Trophy` / `LayoutGrid`
- Intramural Signups — `124` — icon `UserPlus`

Each card: icon in soft blue circle, label, big number. Subtle hover lift.

### 4. Feature grid
Six premium clickable cards in a responsive grid (1 / 2 / 3 columns):

| Title | Description | Badge | Route |
|---|---|---|---|
| Capacity Tracker | See real-time occupancy by area | Live (green) | `/capacity` |
| Group Fitness | Browse classes & reserve spots | 8 Today (blue) | `/group-fitness` |
| Intramurals | Join leagues & manage teams | Open (emerald) | `/intramurals` |
| Events & News | Closures, announcements & events | New (amber) | `/events` |
| FAQ | Hours, policies & support | — | `/faq` |
| Reservations | Book gym floors or spaces | — | `/group-fitness` |

Card style: white bg, rounded-2xl, soft shadow, gradient icon tile, badge top-right, hover lift + border highlight.

### 5. Two-column secondary section
- Left card — Today's Classes (static list for now):
  - Yoga · 9:00 AM
  - HIIT · 12:00 PM
  - Spin · 5:00 PM
  - Pilates · 7:00 PM
  - Each row: time pill on left, class name, "Reserve" link → `/group-fitness`.
- Right card — Operating Hours:
  - Render from `useGym().operatingHours`.
  - Highlight today's row with a soft blue background and bold text.

### 6. Footer
- Slim divider, centered text: "© CrowdEDU | Built for George Washington University Recreation".
- Small "Made with care" subtext optional.

## Implementation details

- Only edit `src/pages/Home.tsx` (full rewrite). No router/context changes needed.
- Use existing components/utilities: `Button`, `Card`, `Badge`, `cn`, `useGym`. No new deps.
- Icons (lucide-react): `Activity`, `AlertTriangle`, `X`, `Dumbbell`, `Users`, `UserPlus`, `Trophy`, `Megaphone`, `HelpCircle`, `CalendarDays`, `MapPin`, `ArrowRight`, `Clock`, `BarChart3`.
- Animations: apply `animate-fade-in` on top-level sections with staggered `style={{ animationDelay: "60ms" }}` etc. (keyframe already exists in `tailwind.config.ts`).
- Responsive: stat row → 2 cols on mobile, 4 on `md+`; feature grid → 1 / `sm:grid-cols-2` / `lg:grid-cols-3`; secondary section → stacked on mobile, `lg:grid-cols-2`.
- Today highlight uses `new Date().toLocaleDateString("en-US", { weekday: "long" })` against `operatingHours`.
- Banner dismissal stored only in component state (no persistence needed for this pass).

## Files changed

- `src/pages/Home.tsx` — full rewrite to the new dashboard layout described above.

No DB, routing, or auth changes.
