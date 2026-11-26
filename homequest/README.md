# HomeQuest

HomeQuest is a static family gamification MVP for a child aged 4–5.

## Deploy
This app lives in `/homequest/` so the existing academic homepage at the repository root is untouched. Once committed to the default branch, the expected URL is:

https://hi-day.github.io/homequest/

## Current status
- Responsive child and parent demo dashboards.
- Quest catalogue, child completion submission, parent approval, XP, coins, levels, achievements, rewards, and history.
- Demo persistence uses browser localStorage; it is device/browser-specific and does not sync across devices.
- Parent mode is a prototype toggle, not authentication or a security boundary.
- Supabase authentication, secure server-side approval/RPCs, RLS, and cross-device synchronization are not yet connected. Do not use this prototype to store sensitive data.

## Local test
Open `index.html` in a modern browser.
