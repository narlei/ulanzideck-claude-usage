function getColor(util) {
  if (util == null) return '#4b5563';
  if (util >= 0.9) return '#ef4444';  // red    – critical
  if (util >= 0.75) return '#f97316'; // orange – high
  if (util >= 0.5) return '#eab308';  // yellow – warning
  return '#22c55e';                   // green  – low
}

function fmtReset(epochSec) {
  if (!epochSec) return '–';
  const diff = epochSec - Math.floor(Date.now() / 1000);
  if (diff <= 0) return 'now';
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// Left vertical bar (rail + fill proportional to util, from bottom up)
function verticalBar(util, color) {
  const x = 6, w = 13, top = 8, bottom = 112;
  const h = bottom - top;
  const fillH = util != null ? Math.round(util * h) : 0;
  const fillY = bottom - fillH;
  return `
  <rect x="${x}" y="${top}" width="${w}" height="${h}" rx="4" fill="#1f2937"/>
  <rect x="${x}" y="${fillY}" width="${w}" height="${fillH}" rx="4" fill="${color}"/>`;
}

// Horizontal bar (rail + fill proportional to util, left to right)
function horizontalBar(util, color, y) {
  const x = 12, w = 96, h = 8;
  const fillW = util != null ? Math.round(util * w) : 0;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#1f2937"/>
  <rect x="${x}" y="${y}" width="${fillW}" height="${h}" rx="3" fill="${color}"/>`;
}

// 3x5 pixel-art glyphs for digits; '%' is 5x5
const GLYPHS = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  '%': ['11001', '11010', '00100', '01011', '10011'],
  '-': ['000', '000', '111', '000', '000'],
};

// Render a string of glyphs as pixel art, centered at (cx) with vertical top (oy)
function pixelText(text, cx, oy, color) {
  const gap = 1; // columns between glyphs
  const cols = text.split('').reduce((sum, ch) => {
    const g = GLYPHS[ch];
    return sum + (g ? g[0].length : 3) + gap;
  }, -gap);
  const px = Math.max(2, Math.min(7, Math.floor(90 / cols)));
  const totalW = cols * px;
  let x = cx - totalW / 2;
  let rects = '';
  for (const ch of text) {
    const g = GLYPHS[ch];
    if (!g) { x += (3 + gap) * px; continue; }
    for (let r = 0; r < g.length; r++) {
      for (let c = 0; c < g[r].length; c++) {
        if (g[r][c] === '1') {
          rects += `<rect x="${(x + c * px).toFixed(1)}" y="${(oy + r * px).toFixed(1)}" width="${px}" height="${px}" fill="${color}"/>`;
        }
      }
    }
    x += (g[0].length + gap) * px;
  }
  return rects;
}

// Header: label centered in the content area (right of bar)
function header(label) {
  return `
  <text x="72" y="32" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" font-weight="bold" fill="#f8fafc">${label}</text>`;
}

function frame(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" fill="#0a0a0a" rx="12"/>${inner}
</svg>`;
}

export function renderUsage({ label, util, resetEpoch, stale = false, style = 'default' }) {
  const color = getColor(util);
  const pctText = util != null ? `${Math.round(util * 100)}%` : '-';
  const resetStr = fmtReset(resetEpoch);
  const staleMark = stale ? '<text x="112" y="16" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#f59e0b">~</text>' : '';

  if (style === 'pixel') {
    // Label on top, pixel-art percentage in the middle, reset text, horizontal bar at the bottom
    return frame(`
  ${header(label)}
  ${pixelText(pctText, 60, 44, color)}
  <text x="60" y="92" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#e2e8f0">Reset in ${resetStr}</text>
  ${horizontalBar(util, color, 100)}
  ${staleMark}`);
  }

  // Default: left vertical bar + vector percentage
  return frame(`
  ${verticalBar(util, color)}
  ${header(label)}
  <text x="72" y="74" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="bold" fill="${color}">${pctText}</text>
  <text x="72" y="98" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#e2e8f0">Reset in ${resetStr}</text>
  ${staleMark}`);
}

export function renderLoading({ label }) {
  return frame(`
  ${verticalBar(null, '#4b5563')}
  ${header(label)}
  <text x="72" y="74" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#64748b">Loading…</text>`);
}

export function renderError({ label, kind }) {
  const msgs = {
    NO_TOKEN: 'No token',
    AUTH: 'Auth error',
    NETWORK: 'Network err',
    RATE_LIMITED: 'Rate limit',
    UNKNOWN: 'Error',
  };
  const msg = msgs[kind] || 'Error';
  return frame(`
  ${verticalBar(null, '#ef4444')}
  ${header(label)}
  <text x="72" y="66" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#ef4444">${msg}</text>
  <text x="72" y="84" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" fill="#64748b">Click to retry</text>`);
}

export function svgToBase64(svg) {
  return Buffer.from(svg, 'utf8').toString('base64');
}
