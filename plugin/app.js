import UlanzideckApi from '../libs/node/ulanzideckApi.js';
import { fetchUsage, ErrorKind } from './usage-fetcher.js';
import { renderUsage, renderLoading, renderError, svgToBase64 } from './renderer.js';

const APP_UUID = 'com.claude.usage.plugin';
const ACTION_5H = `${APP_UUID}.fivehour`;
const ACTION_7D = `${APP_UUID}.weekly`;

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const JITTER_MS = 30_000;

const $UD = new UlanzideckApi();
$UD.connect(APP_UUID);

// Map<context, { actionType, timer, inflight, lastResult, lastGood }>
const instances = new Map();

function actionType(uuid) {
  if (uuid === ACTION_5H) return '5h';
  if (uuid === ACTION_7D) return '7d';
  return null;
}

function setIcon(context, svg) {
  $UD.setBaseDataIcon(context, svgToBase64(svg));
}

function label(type) {
  return type === '5h' ? '5 hours' : 'Weekly';
}

function getMetrics(data, type) {
  if (!data) return { util: null, resetEpoch: null };
  if (type === '5h') return { util: data.util5h, resetEpoch: data.reset5h };
  return { util: data.util7d, resetEpoch: data.reset7d };
}

function renderForInstance(inst, context) {
  const { type, lastResult, lastGood } = inst;
  const lbl = label(type);

  if (!lastResult) {
    setIcon(context, renderLoading({ label: lbl }));
    return;
  }

  if (!lastResult.ok) {
    // Show last good data as stale if available
    if (lastGood) {
      const { util, resetEpoch } = getMetrics(lastGood.data, type);
      setIcon(context, renderUsage({ label: lbl, util, resetEpoch, stale: true }));
    } else {
      setIcon(context, renderError({ label: lbl, kind: lastResult.kind }));
    }
    return;
  }

  const { util, resetEpoch } = getMetrics(lastResult.data, type);
  setIcon(context, renderUsage({ label: lbl, util, resetEpoch, stale: false }));
}

// Shared fetch state: one in-flight fetch for all instances
let _fetchAbort = null;
let _fetchPromise = null;
let _lastFetchResult = null;

async function doFetch(force = false) {
  if (_fetchAbort) _fetchAbort.abort();
  _fetchAbort = new AbortController();
  try {
    _fetchPromise = fetchUsage({ signal: _fetchAbort.signal, force });
    const result = await _fetchPromise;
    _lastFetchResult = result;
    return result;
  } finally {
    _fetchPromise = null;
    _fetchAbort = null;
  }
}

async function refreshAll(force = false) {
  const result = await doFetch(force);
  for (const [ctx, inst] of instances) {
    inst.lastResult = result;
    if (result.ok) inst.lastGood = result;
    renderForInstance(inst, ctx);
    schedulePoll(ctx);
  }
}

function schedulePoll(context) {
  const inst = instances.get(context);
  if (!inst) return;
  clearTimeout(inst.timer);
  const jitter = Math.floor(Math.random() * JITTER_MS);
  inst.timer = setTimeout(() => refreshAll(), POLL_INTERVAL_MS + jitter);
}

$UD.onAdd((data) => {
  const { uuid, context } = data;
  const type = actionType(uuid);
  if (!type) return;

  instances.set(context, {
    type,
    timer: null,
    lastResult: _lastFetchResult,
    lastGood: _lastFetchResult?.ok ? _lastFetchResult : null,
  });

  const inst = instances.get(context);
  setIcon(context, renderLoading({ label: label(type) }));

  if (_lastFetchResult) {
    renderForInstance(inst, context);
    schedulePoll(context);
  } else {
    refreshAll();
  }
});

$UD.onClear((data) => {
  const { context } = data;
  const inst = instances.get(context);
  if (inst) clearTimeout(inst.timer);
  instances.delete(context);
});

// Click = force refresh
$UD.onRun((data) => {
  const { context } = data;
  refreshAll(true);
});


// Initial poll on startup (slight delay to let connections settle)
setTimeout(() => refreshAll(), 2000);
