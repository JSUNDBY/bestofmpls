// Central-time helpers for scrapers whose sources emit UTC instants or
// epoch milliseconds. A 7pm show stored as T00:00:00Z lands on the wrong
// calendar day unless it's rendered in America/Chicago first.
function toCentral(input) {
  const dt = input instanceof Date ? input : new Date(input);
  if (isNaN(dt)) return null;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(dt);
  const get = t => parts.find(p => p.type === t).value;
  const hour = get('hour') === '24' ? '00' : get('hour');
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${hour}:${get('minute')}` };
}

// Cents or a numeric string to the site's price format ('$20', 'Free').
function fmtPrice(n) {
  if (n == null || n === '') return null;
  const v = Number(n);
  if (isNaN(v)) return null;
  if (v === 0) return 'Free';
  return `$${Number.isInteger(v) ? v : v.toFixed(2).replace(/\.00$/, '')}`;
}

module.exports = { toCentral, fmtPrice };
