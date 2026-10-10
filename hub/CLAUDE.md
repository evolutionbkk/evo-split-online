# Evolution Hub Commerce — standing rules from the owner

These are permanent UI/behaviour rules. Follow them in every change.

- **Pagination:** every list of records (customers, leads, orders, sales, appointments, notes, rankings, logs — anything that can grow) shows **10 items per page**. As soon as a list has more than 10 items it gets numbered pages `‹ 1 2 3 4 5 … ›` (use `pagerHtml()` / `pg10()` / `listView()` in `public/app.js`). No "show more" / endless lists, no 20-per-page defaults.
- Work without asking the owner questions or asking them to do things themselves; decide, build, deploy, then report.
- UI language is Thai; sidebar labels in Thai. Glassmorphism theme on every page.
- คุณอัท and คุณโม are both executives (same views). Telesales: พี่เขม, พี่หวาน. Each person's password is private to them.
- Tutorials / help center (videos and guides) teach every feature **except the KPI logging page (บันทึก KPI)** — never teach it.
- Every list has an Excel export with per-row checkboxes and select-all (`xReg`/`xBar`/`xCk`, or `xl` in `listView`).
- KPI counts only talked calls; a OneCall call longer than 7 seconds = talked.
- Leads are distributed automatically (nobody approves), split evenly between telesales.
