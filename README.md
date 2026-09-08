# hidayaturrahman.github.io — Academic Profile

Static single-page academic profile for **Dr. Hidayaturrahman, S.Kom., M.T.**
(Lecturer & Concentration Content Coordinator — Intelligent Systems, School of Computer Science, BINUS University).

No build step. Just `index.html` + Tailwind CDN + vanilla JS. Ready for **GitHub Pages**.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

1. Repo **`Hi-Day/Hi-Day.github.io`** sudah dibuat (user site).
2. Push:
   ```bash
   git remote add origin git@github.com:Hi-Day/Hi-Day.github.io.git
   git branch -M main
   git push -u origin main
   ```
3. Repo → **Settings → Pages** → Deploy from branch → `main` / root (biasanya otomatis aktif untuk user site).
4. Live di `https://hi-day.github.io`.

## Customize

- **Photo:** save as `assets/profile.jpg`, then replace the `<img src="https://socs...">` in `index.html`.
- **Publications:** edit the `PUBS` array in `index.html` (title, authors, venue, year, DOI, link).
- **Metrics / IDs:** hero stats + ORCID / Scopus / BINUS Scholar links.
- **Email:** add your public email in the Contact section.
- **TODO markers** in the HTML show fields to complete (course codes, community service, certifications).

## Data sources (public, Sept 2026)

- BINUS SoCS profile: https://socs.binus.ac.id/computer-science/people/dr-hidayaturrahman-s-kom-m-t/
- BINUS Scholar: https://scholar.binus.ac.id/lecturer/D6423/hidayaturrahman-skom-mt
- ORCID 0000-0001-5005-8006 · Scopus ID 57226269422
- LinkedIn /in/hidayaturrahman · csauthors · BRIDGE researcher page · SINTA ID 6772118 · dblp
- NUNI seminar 2021: https://socs.binus.ac.id/2021/05/17/seminar-sharing-knowledge-dalam-rangkaian-nuni-online-seminar-series/
- Workshop 2022 (AutoCopywriting with AI): https://socs.binus.ac.id/2022/11/04/workshop-pengembangan-perangkat-lunak-berbasis-sistem-cerdas/
- Innovation Award 2025 participants (Agentic-AI Hub): https://www.binus.edu/innovation-award-2025/post/all-participant-2025/
- BINUS Gallery (FLAVORFUL): https://binus.ac.id/gallery/artist/1244/hidayaturrahman-s-kom-m-t/
