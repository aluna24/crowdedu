## Replace intramural sport images with your uploads

Swap the AI-generated sport images on the Intramurals page with the 5 photos you uploaded.

### Mapping

| Sport | New image (uploaded) |
|---|---|
| Dodgeball | `lerner_dodgeball.png` |
| Basketball | `2024.2.24_TN_IntermuralRef_0001.jpg` |
| Volleyball | `volleyball.png` |
| Badminton | `Badminton.jpg` |
| Soccer | `soccer.jpg` |

### Steps

1. Copy each uploaded file into `src/assets/`, overwriting the existing AI-generated files so no other code needs to change:
   - `sport-dodgeball.jpg` ← lerner_dodgeball.png
   - `sport-basketball.jpg` ← 2024.2.24_TN_IntermuralRef_0001.jpg
   - `sport-volleyball.jpg` ← volleyball.png
   - `sport-badminton.jpg` ← Badminton.jpg
   - `sport-soccer.jpg` ← soccer.jpg
2. Leave `src/pages/Intramurals.tsx` imports and the `SPORT_IMAGES` map as-is — Vite will pick up the new file contents on rebuild.
3. Verify the cards on `/intramurals` show the new photos.

### Note

The existing files are named `.jpg` but a couple of your uploads are `.png`. That's fine — the file extension on disk doesn't have to match the actual image format for Vite's asset pipeline; browsers detect format from content. Keeping the existing filenames means zero code changes.

Approve and I'll make the swap.