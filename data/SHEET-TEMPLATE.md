# Google Sheet template

Create a new Google Sheet. Rename the first tab to **Stock** (exact spelling, capital S).

## Row 1 — paste this header row

Paste this into cell A1; Google Sheets will split it into columns A–H:

```
location	address	item	quantity	unit	status	updated	notes
```

Column names are matched by name (not position), case-insensitive, so you can reorder them — just keep the spelling.

| Column     | What goes in it                                                    |
|------------|--------------------------------------------------------------------|
| `location` | Short pickup-point name shown as the card title, e.g. `1392 President Street`. Rows with the same name are grouped into one card. |
| `address`  | Full street address used for the Directions button, e.g. `1392 President Street, Brooklyn, NY 11225`. |
| `item`     | The produce, e.g. `Green cabbage`.                                 |
| `quantity` | A number or short text, e.g. `12` or `a few`.                      |
| `unit`     | `heads`, `bunches`, `lb`, `bags`, `crates`… Leave blank if none.   |
| `status`   | One of the three words below.                                      |
| `updated`  | When you last checked. `2026-11-10 14:30` or `Nov 10 2:30pm` both work. |
| `notes`    | Anything a neighbor should know. Commas and line breaks are fine.  |

## Status vocabulary

| Value       | Meaning                               | Shown as        |
|-------------|---------------------------------------|-----------------|
| `available` | Plenty left                           | green badge     |
| `low`       | Running out, hurry                    | amber badge     |
| `gone`      | Nothing left (keep the row so people know it was here) | grey, struck through |

Anything else is shown as-is and treated as available.

## Example row

```
1392 President Street	1392 President Street, Brooklyn, NY 11225	Green cabbage	12	heads	available	2026-11-10 14:30	Big ones, take two if you can use them
```

## Sharing (required)

Share → **Anyone with the link** → **Viewer** → Done. The board reads the sheet anonymously; without this step the fetch fails and the page falls back to sample data.

Then copy the ID from the sheet URL (the long string between `/d/` and `/edit`) into `js/config.js` (`SHEET_ID`) and `ck.json` (`data.sheetId`).
