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

export function renderUsage({ label, util, resetEpoch, stale = false }) {
  const color = getColor(util);
  const pctText = util != null ? `${Math.round(util * 100)}%` : '–';
  const resetStr = fmtReset(resetEpoch);
  const staleMark = stale ? '<text x="112" y="16" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#f59e0b">~</text>' : '';
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
