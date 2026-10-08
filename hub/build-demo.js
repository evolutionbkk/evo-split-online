// Bundles the front end + example data into one self-contained HTML page (demo mode).
const fs = require('fs'); const path = require('path');
const P = (f) => fs.readFileSync(path.join(__dirname, 'public', f), 'utf8');
const safe = (js) => js.replace(/<\/script/gi, '<\\/script');
const html = `<title>Evolution Hub Commerce</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Prompt:wght@500;600&display=swap">
<style>${P('app.css')}</style>
<div id="app"><div style="padding:40px;color:#5d6b85">กำลังโหลด Evolution Hub Commerce…</div></div>
<script>window.HUB_DEMO = true;</script>
<script>${safe(P('core.js'))}</script>
<script>${safe(P('demo-seed.js'))}</script>
<script>${safe(P('app.js'))}</script>
`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'evolution-hub-commerce.html'), html);
console.log('dist/evolution-hub-commerce.html', (html.length / 1024).toFixed(0) + ' KB');
