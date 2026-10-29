# Orchestrate Lab

Companion web app for the training **Orchestrating Human Intelligence & Artificial Intelligence for the Future of Work**.

- Participant app: `https://hi-day.github.io/orchestrate/`
- Presenter live board: `https://hi-day.github.io/orchestrate/live.html`

## Deploy to GitHub Pages

1. Open your `Hi-Day/Hi-Day.github.io` repository.
2. Copy this whole `orchestrate/` folder into the root of that repo.
3. Commit and push. The app is live at the URL above within a minute or two.

## Optional: live board (Google Sheet)

Without this, everything still works and results stay on each participant's device.

1. Create a new Google Sheet, then go to **Extensions → Apps Script**.
2. Replace the code with `apps-script.gs` and save.
3. **Deploy → New deployment → Web app**. Execute as: *Me*. Who has access: *Anyone*.
4. Copy the `/exec` URL into `config.js` (`LIVE_URL`), then commit and push.
5. Open `live.html` on the projector. It refreshes every 5 seconds.
6. Between sessions, delete every row except the header row.

## Tips

- If a participant needs to start over, they can open `…/orchestrate/?reset`.
- Edit scenarios in `data.js`. Run `node selftest.js` afterwards to sanity-check the scoring.

## v2: AI Ops Tycoon (90-minute session)

- Player app: `https://hi-day.github.io/orchestrate/v2/`
- Leaderboard: `https://hi-day.github.io/orchestrate/v2/live.html`
- Uses the same Google Sheet as v1 (rows are tagged `v2…`). Clear it between sessions.
- Unlock codes for the facilitator: Act 2 (Q3) = `VERIFY`, Act 3 (Q5) = `GOVERN`. Change them in `v2/game.js` (`ACT_CODES`).
- After changing numbers in `v2/game.js`, run `node v2/selftest.js` to check that balanced orchestration still beats the extremes.
