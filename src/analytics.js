// Anonymous counts with GoatCounter: no cookies, no personal data, totals only.
// Off unless VITE_GOATCOUNTER_CODE is set at build time. Never breaks the game if blocked or offline.
const CODE = import.meta.env.VITE_GOATCOUNTER_CODE;
const waiting = [];

export const analyticsEnabled = Boolean(CODE);

function send(name) {
  window.goatcounter.count({ path: `event/${name}`, title: name, event: true });
}

export function startAnalytics() {
  if (!CODE) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = `https://${CODE}.goatcounter.com/count`;
  script.onload = () => waiting.splice(0).forEach((name) => track(name));
  document.head.append(script);
}

// Counts one event, e.g. track('adopt'). Events before the script loads are sent once it does.
export function track(name) {
  if (!CODE) return;
  try {
    if (window.goatcounter?.count) send(name);
    else waiting.push(name);
  } catch {
    // Blocked or offline: counting is never worth an error.
  }
}
