
The user wants a full semester schedule of group fitness classes seeded into the `fitness_classes` table, spanning the third week of January 2026 through the first week of May 2026, with ≥5 weekday classes/day and ≥3 weekend classes/day.

Looking at the current schema: `fitness_classes` has `day` (text like "Monday") and `time` (text) — no actual date column. The current UI filters by day-of-week ("Monday"–"Friday"). So a recurring weekly template fits the schema naturally — each row represents a recurring weekly class slot, not a single dated occurrence.

I'll seed a recurring weekly template (Mon–Sun) with the right counts. The "schedule runs Jan 19 – May 8" framing will be communicated via UI copy (a date range note on the Group Fitness page). The `days` filter array also needs Saturday/Sunday added.

# Plan: Seed semester group fitness schedule

## Schema fit
The `fitness_classes` table stores recurring weekly slots (`day` = weekday name, `time` = time string). I'll seed one row per recurring class slot. The semester date range (Jan 19 – May 8, 2026) is shown as page copy, not per-row dates.

## 1. Database migration — seed classes
Clear existing seeded classes, then insert a recurring weekly schedule:

**Weekdays (5 classes each, Mon–Fri = 25 classes):**
- 6:30 AM Sunrise Yoga, 12:00 PM HIIT, 4:30 PM Cycle, 5:30 PM Strength, 7:00 PM Pilates / Zumba / Bootcamp / Barre / Core (varies by day)

**Weekends (3 classes each, Sat–Sun = 6 classes):**
- 9:00 AM Yoga Flow, 10:30 AM Cycle, 12:00 PM Total Body / Dance Fitness

Each row gets: name, instructor, day, time, location (Multipurpose Room / 3M / Fitness Center), max_spots (15–25), category (Yoga, Cardio, Strength, Dance, Mind-Body), current_enrolled = 0.

Total: ~31 recurring class slots.

## 2. Frontend — `src/pages/GroupFitness.tsx`
- Add Saturday + Sunday to the `days` filter array
- Add a small note under the page header: "Spring 2026 schedule: January 19 – May 8"

## Files
- New migration: seed `fitness_classes`
- Modified: `src/pages/GroupFitness.tsx` (filter array + date note)
