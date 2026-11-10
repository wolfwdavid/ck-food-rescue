# Food Rescue Board

A one-page live board that shows what surplus produce is sitting at each pickup point right now — cabbages, carrots, squashes — so neighbors can walk over and take it. Volunteers keep a Google Sheet up to date; the page reads that sheet and refreshes itself every 60 seconds.

Plain HTML, CSS and JavaScript. No build step, no framework, no server. Hosted on GitHub Pages.

## Setup (5 steps)

1. **Create a Google Sheet.** Rename the first tab to `Stock`.
2. **Paste the header row** from [`data/SHEET-TEMPLATE.md`](data/SHEET-TEMPLATE.md) into row 1. The template also lists the three status words (`available`, `low`, `gone`) and an example row.
3. **Share it.** Share → *Anyone with the link* → *Viewer*. The page reads the sheet anonymously, so this step is required.
4. **Copy the sheet ID** — the long string in the sheet URL between `/d/` and `/edit` — into two places:
   - `js/config.js` → `SHEET_ID`
   - `ck.json` → `data.sheetId`

   Keep `SHEET_TAB` / `data.tab` in both files matching your tab name (`Stock` by default). Optionally set `SHEET_EDIT_URL` in `js/config.js` to the sheet's edit link; that turns on the **Update stock** button in the footer for volunteers.
5. **Push** to the `master` branch of the GitHub repo and enable GitHub Pages (Settings → Pages → Deploy from branch). The `.nojekyll` file is already in place.

Until a sheet is connected, the page shows `data/sample.csv` and says so in the footer.

### Fallback: published CSV

If the sheet ID route ever fails (for example the sheet gets un-shared), you can also do File → Share → *Publish to web* → CSV and paste that URL into `SHEET_PUBLISHED_CSV_URL` (and `ck.json` → `data.publishedCsvUrl`). Google caches published CSVs for about five minutes, so updates appear more slowly that way. The page tries the sheet ID first, then the published URL, then the bundled sample.

## How updates work

- Edit a cell in the sheet → it is visible on the board on the next refresh, within 60 seconds. Visitors can also hit **Refresh**.
- Rows with the same `location` are grouped into one card. A card whose items are all `gone` sinks to the bottom and is dimmed.
- `updated` is free text. If it parses as a date it shows as "updated 12 min ago"; otherwise it is shown as typed.
- Each card has **Directions** (Google Maps to the `address`) and **Share** (sends a link that opens the board filtered to that one location).
- **The sheet is public-read by design.** Anyone with the link can read every cell. Never put phone numbers, names of residents, apartment numbers, or any other personal information in it.

## Phase 2 (not built)

These need a backend or an API key, so they are out of scope for this static page:

- Push notifications / "tell me when something lands at my corner" subscriptions.
- An embedded map of all pickup points.

## Files

```
index.html          page shell
css/style.css       styles
js/config.js        sheet ID, tab, refresh interval, team name
js/csv.js           CSV parser
js/app.js           fetch, group, render, refresh
data/sample.csv     sample data shown until a sheet is connected
data/SHEET-TEMPLATE.md   header row + status vocabulary for the sheet
ck.json             site metadata read by the ck dashboard
```
