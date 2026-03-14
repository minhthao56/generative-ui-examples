# Interactive Widgets & Advanced Visuals Reference

## Design System

### CSS Variables (Auto Light/Dark Mode)
Always use these — never hardcode `#333` or `#fff`:

```css
/* Backgrounds */
--color-background-primary    /* white in light, near-black in dark */
--color-background-secondary  /* surface cards */
--color-background-tertiary   /* page background */
--color-background-info / -danger / -success / -warning

/* Text */
--color-text-primary          /* main text */
--color-text-secondary        /* muted / labels */
--color-text-tertiary         /* hints / placeholders */
--color-text-info / -danger / -success / -warning

/* Borders */
--color-border-tertiary       /* default 0.15 alpha */
--color-border-secondary      /* hover 0.3 alpha */
--color-border-primary        /* active 0.4 alpha */

/* Typography */
--font-sans / --font-mono

/* Layout */
--border-radius-md (8px) / --border-radius-lg (12px) / --border-radius-xl (16px)
```

### Component Tokens
- Borders: `0.5px solid var(--color-border-tertiary)`
- Cards: `background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 1rem 1.25rem`
- No gradients, shadows, blur, or glow
- No emoji — use CSS shapes or SVG paths
- Outer container background always transparent

### Typography
- h1=22px, h2=18px, h3=16px — all font-weight: 500
- Body=16px, weight 400, line-height: 1.7
- Two weights only: 400 and 500. Never 600 or 700.
- Sentence case everywhere. Never Title Case or ALL CAPS.
- Never use font-size below 11px.

### Number Formatting
Float math leaks artifacts — always use `Math.round()`, `.toFixed(n)`, or `Intl.NumberFormat`.

---

## Interactive Widget Templates

### Slider Control Widget
```html
<style>
  .controls {
    display: flex; align-items: center; gap: 16px;
    margin: 12px 0; font-size: 13px;
    color: var(--color-text-secondary);
  }
  .controls label { display: flex; align-items: center; gap: 6px; }
  input[type="range"] { flex: 1; }
</style>

<svg width="100%" viewBox="0 0 680 400" xmlns="http://www.w3.org/2000/svg">
  <rect id="dynamic-element" x="100" y="100" width="200" height="50"
        fill="#E6F1FB" stroke="#185FA5" stroke-width="0.5" rx="8"/>
</svg>

<div class="controls">
  <label>
    <span>Parameter</span>
    <input type="range" id="param-slider" min="0" max="100" value="50"
           oninput="updateParam(this.value)">
    <span id="param-label">50</span>
  </label>
</div>

<script>
function updateParam(value) {
  document.getElementById('param-label').textContent = value;
  const el = document.getElementById('dynamic-element');
  el.setAttribute('width', 100 + value * 2);
}
</script>
```

### Step-Through Explainer
For cyclic or staged processes (event loops, pipelines, biological cycles):
```html
<style>
  .step-nav {
    display: flex; align-items: center; gap: 12px;
    margin: 12px 0; font-size: 13px;
  }
  .step-nav button {
    padding: 6px 16px;
    border: 1px solid var(--color-border-tertiary);
    border-radius: 8px;
    background: var(--color-background-secondary);
    color: var(--color-text-primary);
    cursor: pointer; font-size: 13px;
  }
  .dot { width: 8px; height: 8px; border-radius: 50%;
         background: var(--color-border-tertiary); transition: background 0.2s; }
  .dot.active { background: var(--color-text-info, #185FA5); }
  .step-content { min-height: 300px; }
</style>

<div class="step-content" id="step-display"></div>

<div class="step-nav">
  <button onclick="prevStep()">Previous</button>
  <div id="dots" style="display:flex;gap:6px"></div>
  <button onclick="nextStep()">Next</button>
  <span id="step-label" style="margin-left:auto;color:var(--color-text-secondary)">
    Step 1 of 4</span>
</div>

<script>
const steps = [
  { svg: `<svg>...</svg>` },
  { svg: `<svg>...</svg>` },
];
let current = 0;

function render() {
  document.getElementById('step-display').innerHTML = steps[current].svg;
  document.getElementById('step-label').textContent =
    `Step ${current + 1} of ${steps.length}`;
  document.querySelectorAll('.dot').forEach((d, i) =>
    d.classList.toggle('active', i === current));
}

function nextStep() { current = (current + 1) % steps.length; render(); }
function prevStep() { current = (current - 1 + steps.length) % steps.length; render(); }

const dotsEl = document.getElementById('dots');
steps.forEach(() => {
  const d = document.createElement('div'); d.className = 'dot';
  dotsEl.appendChild(d);
});
render();
</script>
```

### Tabbed / Multi-View Interface
Content streams top-down — don't use `display: none` during streaming:
```html
<div id="tabs" style="display:flex;gap:4px;margin-bottom:16px;">
  <button onclick="showTab(0)" style="font-weight:500">Overview</button>
  <button onclick="showTab(1)">Details</button>
  <button onclick="showTab(2)">Code</button>
</div>

<div id="panel-0"><!-- Overview content --></div>
<div id="panel-1"><!-- Details content --></div>
<div id="panel-2"><!-- Code content --></div>

<script>
function showTab(n) {
  for (let i = 0; i < 3; i++) {
    document.getElementById('panel-' + i).style.display = i === n ? 'block' : 'none';
  }
  document.querySelectorAll('#tabs button').forEach((b, i) => {
    b.style.fontWeight = i === n ? '500' : '400';
    b.style.color = i === n
      ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)';
  });
}
showTab(0);
</script>
```

### sendPrompt() — Chat-Driven Interactivity
A global function that sends a message as if the user typed it:
```html
<button onclick="sendPrompt('Break down Q4 revenue by region')">
  Drill into Q4 ↗
</button>
```
**Use for**: drill-downs, follow-up questions, "explain this part".
**Don't use for**: filtering, sorting, toggling — handle those in JS.
Always append ` ↗` to sendPrompt button text.

---

## Simulations & Physics

### Animation Loop Pattern
```html
<canvas id="sim" style="width: 100%; height: 300px;
        border-radius: var(--border-radius-md);
        background: var(--color-background-secondary);"></canvas>

<div style="display:flex;align-items:center;gap:16px;margin:12px 0;
            font-size:13px;color:var(--color-text-secondary)">
  <button onclick="toggleSim()">Play / Pause</button>
  <label>Speed
    <input type="range" min="1" max="10" value="5" id="speed"
           oninput="simSpeed=+this.value">
  </label>
  <button onclick="resetSim()">Reset</button>
</div>

<script>
const canvas = document.getElementById('sim');
const ctx = canvas.getContext('2d');
let running = true, simSpeed = 5, animId;

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();

let particles = [];
function init() {
  particles = Array.from({length: 50}, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2
  }));
}

function step() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) {
    p.x += p.vx * simSpeed * 0.2;
    p.y += p.vy * simSpeed * 0.2;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#534AB7';
    ctx.fill();
  }
  if (running) animId = requestAnimationFrame(step);
}

function toggleSim() { running = !running; if (running) step(); }
function resetSim() { init(); if (!running) { running = true; step(); } }

init(); step();
</script>
```

---

## Math Visualizations

### Function Plotter with SVG
```html
<svg id="plot" width="100%" viewBox="0 0 680 400">
  <line x1="60" y1="200" x2="640" y2="200"
        stroke="var(--color-border-tertiary)" stroke-width="0.5"/>
  <line x1="340" y1="20" x2="340" y2="380"
        stroke="var(--color-border-tertiary)" stroke-width="0.5"/>
  <text x="645" y="196" font-size="12" fill="var(--color-text-tertiary)">x</text>
  <text x="345" y="16" font-size="12" fill="var(--color-text-tertiary)">y</text>
  <path id="fn-path" fill="none" stroke="#534AB7" stroke-width="2"/>
</svg>

<div style="display:flex;gap:16px;align-items:center;margin:12px 0;
            font-size:13px;color:var(--color-text-secondary)">
  <label>Frequency
    <input type="range" id="freq" min="0.1" max="10" value="1" step="0.1"
           oninput="plotFn()">
  </label>
  <label>Amplitude
    <input type="range" id="amp" min="0.1" max="3" value="1" step="0.1"
           oninput="plotFn()">
  </label>
</div>

<script>
function plotFn() {
  const freq = +document.getElementById('freq').value;
  const amp = +document.getElementById('amp').value;
  const xMin = -5, xMax = 5, yMin = -3, yMax = 3;
  const toSvgX = x => 60 + (x - xMin) / (xMax - xMin) * 580;
  const toSvgY = y => 20 + (yMax - y) / (yMax - yMin) * 360;
  let d = '';
  for (let px = 0; px <= 580; px++) {
    const x = xMin + px / 580 * (xMax - xMin);
    const y = amp * Math.sin(freq * x);
    d += (px === 0 ? 'M' : 'L') + toSvgX(x).toFixed(1) + ' ' + toSvgY(y).toFixed(1);
  }
  document.getElementById('fn-path').setAttribute('d', d);
}
plotFn();
</script>
```

---

## Chart.js Patterns

### Setup (Dark Mode Aware)
Canvas cannot read CSS variables — always detect dark mode explicitly:
```javascript
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const textColor = isDark ? '#c2c0b6' : '#3d3d3a';
const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
const tooltipBg = isDark ? '#2C2C2A' : '#fff';
```

### Wrapper Pattern (Critical for Sizing)
```html
<div style="position: relative; width: 100%; height: 300px;">
  <canvas id="chart"></canvas>
</div>
```
- Height on wrapper div ONLY, never on canvas.
- Always `responsive: true, maintainAspectRatio: false`.
- Horizontal bar charts: height = (bars × 40) + 80px.

### Custom HTML Legend (Always Use)
Disable Chart.js default, build HTML legend:
```javascript
plugins: { legend: { display: false } }
```
```html
<div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:8px;
            font-size:12px;color:var(--color-text-secondary)">
  <span style="display:flex;align-items:center;gap:4px">
    <span style="width:10px;height:10px;border-radius:2px;background:#534AB7"></span>
    Series A
  </span>
</div>
```

### Chart Type Selection
| Data pattern              | Chart type        |
|---------------------------|-------------------|
| Trend over time           | Line              |
| Category comparison       | Vertical bar      |
| Ranking (few items)       | Horizontal bar    |
| Part of whole             | Doughnut          |
| Distribution              | Histogram (bar)   |
| Correlation (2 variables) | Scatter           |
| Multi-variable comparison | Radar             |
| Range / uncertainty       | Line with fill    |

### CDN
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
```

---

## UI Mockups

### Presentation Rules
**Contained mockups** (mobile screens, modals, cards): wrap in a surface background.
**Full-width mockups** (dashboards, settings): no wrapper needed.

### Metric Cards
```html
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
            gap:12px;margin-bottom:1.5rem">
  <div style="background:var(--color-background-secondary);
              border-radius:var(--border-radius-md);padding:1rem">
    <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px">
      Total revenue</div>
    <div style="font-size:24px;font-weight:500">$142,800</div>
  </div>
</div>
```

### Status Badges
```html
<span style="display:inline-block;font-size:12px;padding:4px 12px;
             border-radius:var(--border-radius-md);
             background:var(--color-background-success);
             color:var(--color-text-success)">Active</span>
```

### Sortable Data Table
```html
<input type="text" placeholder="Filter..." oninput="filterTable(this.value)"
       style="width:100%;margin-bottom:12px">
<table style="width:100%;border-collapse:collapse;font-size:14px" id="table">
  <thead>
    <tr>
      <th onclick="sortTable(0)" style="text-align:left;padding:8px 12px;
          font-weight:500;border-bottom:0.5px solid var(--color-border-secondary);
          cursor:pointer;font-size:12px;color:var(--color-text-secondary)">Name</th>
    </tr>
  </thead>
  <tbody id="tbody"></tbody>
</table>
```

---

## Mermaid Diagrams

Use for: ERDs, class diagrams, sequence diagrams, Gantt charts.
Use hand-drawn SVG for everything else.

```html
<div id="diagram"></div>
<script type="module">
import mermaid from 'https://esm.sh/mermaid@11/dist/mermaid.esm.min.mjs';
const dark = matchMedia('(prefers-color-scheme: dark)').matches;
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    darkMode: dark,
    fontSize: '13px',
    lineColor: dark ? '#9c9a92' : '#73726c',
    textColor: dark ? '#c2c0b6' : '#3d3d3a',
  },
});
const { svg } = await mermaid.render('d', `
  erDiagram
    USERS ||--o{ POSTS : writes
    POSTS ||--o{ COMMENTS : has
`);
document.getElementById('diagram').innerHTML = svg;
</script>
```

---

## Generative Art

### Rules (Different from Diagrams)
- Fill the canvas — art should feel rich, not sparse.
- Bold custom hex colors are fine.
- Layered overlapping shapes create depth.
- Organic forms with `<path>` curves, `<ellipse>`, `<circle>`.
- Texture via repetition (hatching, dots, parallel lines).
- NO gradients, shadows, blur, or glow — keep flat aesthetic.

### Radial Symmetry Pattern
```svg
<svg width="100%" viewBox="0 0 680 680">
  <g transform="translate(340 340)">
    <g transform="rotate(0)">
      <ellipse cx="0" cy="-120" rx="30" ry="80"
               fill="#FAECE7" stroke="#993C1D" stroke-width="0.5"/>
    </g>
    <g transform="rotate(45)">
      <ellipse cx="0" cy="-120" rx="30" ry="80"
               fill="#FBEAF0" stroke="#993556" stroke-width="0.5"/>
    </g>
    <!-- repeat for 90, 135, 180, 225, 270, 315 -->
  </g>
</svg>
```

### Landscape with Layered Shapes
For physical scenes, use hardcoded hex (no theme variables):
```svg
<svg width="100%" viewBox="0 0 680 400">
  <rect x="0" y="0" width="680" height="250" fill="#E6F1FB"/>
  <polygon points="0,250 150,100 300,250" fill="#B4B2A9"/>
  <polygon points="200,250 400,60 600,250" fill="#888780"/>
  <rect x="0" y="250" width="680" height="150" fill="#C0DD97"/>
  <circle cx="550" cy="80" r="40" fill="#FAC775"/>
</svg>
```

---

## External Libraries (CDN Allowlist)

Only these CDN origins work (CSP-enforced):
- `cdnjs.cloudflare.com`
- `esm.sh`
- `cdn.jsdelivr.net`
- `unpkg.com`

| Library   | Use case                            | CDN URL |
|-----------|-------------------------------------|---------|
| Chart.js  | Data visualization                  | `cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js` |
| Three.js  | 3D graphics                         | `cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js` |
| D3.js     | Force layouts, geographic maps      | `cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js` |
| Mermaid   | ERDs, sequence diagrams             | `esm.sh/mermaid@11/dist/mermaid.esm.min.mjs` |
| Tone.js   | Audio synthesis                     | `cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js` |

---

## CSS Animations

```css
/* Performance: only animate transform and opacity */
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes flow { to { stroke-dashoffset: -20; } }
.flowing { stroke-dasharray: 5 5; animation: flow 1.6s linear infinite; }

@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }

/* Always respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

---

## Responsive Grid
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
gap: 12px;
```
Use `minmax(0, 1fr)` if children have large min-content that could overflow.

---

## Quality Checklist

**Functional**: Works without JS during streaming? All controls have handlers? Numbers rounded? Canvas fits width?

**Visual**: Dark mode readable? No hardcoded colors in HTML? No gradients/shadows/blur? Borders are 0.5px? Font weights 400 or 500 only? All text sentence case?

**Content**: Explanatory text in response, not inside widget? Visual self-explanatory? Narration adds value? Clear "go deeper" path offered?

**Accessibility**: `prefers-reduced-motion` respected? Sufficient text contrast? Interactive elements ≥ 44px? No info conveyed by color alone?
