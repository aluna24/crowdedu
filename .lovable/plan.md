## Goal
Display fitness classes in chronological order (earliest → latest) within the selected day on the Group Fitness page.

## Change
In `src/pages/GroupFitness.tsx`, replace the current `filtered` line with a memoized version that sorts by parsed class time using the existing `parseClassTime` helper.

```ts
const filtered = useMemo(() => {
  const list = effectiveDay === "All" ? classes : classes.filter((c) => c.day === effectiveDay);
  return [...list].sort((a, b) => {
    const ta = parseClassTime(a.time) ?? Number.MAX_SAFE_INTEGER;
    const tb = parseClassTime(b.time) ?? Number.MAX_SAFE_INTEGER;
    return ta - tb;
  });
}, [classes, effectiveDay]);
```

When viewing "All" days, classes still group by their listed day but each day's classes will appear earliest-first. For a single-day view, the schedule reads top-to-bottom from morning to evening.
