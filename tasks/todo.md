# Food Rescue Board — tasks

## Built

- [x] Static page shell (`index.html`) with status line, filter chips, location list, footer
- [x] CK design tokens, paper texture background, citrus header band (`css/style.css`)
- [x] Config file with sheet ID / tab / published URL / edit URL / refresh interval (`js/config.js`)
- [x] State-machine CSV parser mapping columns by header name (`js/csv.js`)
- [x] Fetch chain: gviz CSV → published CSV → bundled sample, `cache: no-store`
- [x] Group rows by location, all-gone cards sink and dim
- [x] Status badges (available / low / gone), relative "updated X ago" times
- [x] Directions (Google Maps) and Share (Web Share → clipboard fallback) per card
- [x] `?loc=<slug>` single-location view with "show all" link
- [x] "Available only" chip
- [x] 60 s refresh with visible countdown; paused while hidden, immediate on return
- [x] Error path keeps last good render and shows the time it came from
- [x] Sample CSV with quoted comma and embedded line break
- [x] Sheet template, README, ck.json, .nojekyll, .gitignore

## Team follow-ups

- [ ] Create the Google Sheet with a tab named `Stock` and paste the header row from `data/SHEET-TEMPLATE.md`
- [ ] Share the sheet: Anyone with the link → Viewer
- [ ] Put the sheet ID into `js/config.js` (`SHEET_ID`) and `ck.json` (`data.sheetId`)
- [ ] Set `SHEET_EDIT_URL` in `js/config.js` so volunteers get the Update stock button
- [ ] Push to GitHub and enable Pages
