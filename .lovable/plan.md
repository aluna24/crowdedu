

# Group Fitness Pass System (Mock Data)

Since we're using mock data, the entire pass/purchase/verification system will live in React state with no database or payment integration needed.

## What gets built

### 1. Pass Context (`src/context/PassContext.tsx`)
A new React context to manage mock pass state per logged-in user:
- Stores purchased passes (type, classes remaining, expiration)
- `purchasePass(type)` — instantly "buys" a pass (no real payment)
- `usePass()` — decrements a class from the best available pass
- `getActivePass()` — returns current valid pass info
- Pass types: Single ($10), 3-Pack ($20), 5-Pack ($30), 10-Pack ($50), Semester ($70)

### 2. Purchase UI on Group Fitness page
- New section at the top: "Group Fitness Passes" with 5 cards showing pass options and prices
- "Buy" button on each card (requires login — shows "Log in to purchase" if not authenticated)
- Current pass status banner showing classes remaining or "No active pass"

### 3. Reserve button gating
- "Reserve" button checks for an active pass before allowing reservation
- If no pass: button shows "Buy a Pass" and scrolls to purchase section
- On successful reserve: decrements `classes_remaining` (except semester pass)
- Semester pass allows unlimited reservations

### 4. Wire into App
- Wrap app with `PassProvider` in `App.tsx`

## Files changed
- **New**: `src/context/PassContext.tsx`
- **Modified**: `src/pages/GroupFitness.tsx` (purchase cards, pass status, gated reservations)
- **Modified**: `src/App.tsx` (add PassProvider)

