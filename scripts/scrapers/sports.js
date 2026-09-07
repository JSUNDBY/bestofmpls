/**
 * Pro sports home games — Twins, Vikings, Wild, Timberwolves, Lynx, and
 * Minnesota United, via ESPN's public schedule JSON (no key). Only games at
 * the metro home venues are emitted (venue whitelist, not homeAway flags —
 * neutral-site games list weird venues). Category 'sports' keeps them OFF
 * the homepage board and concierge (deliberately unfeatured) while they
 * appear on /calendar/ and the auto venue pages. Ticket URL = the team's
 * official tickets page.
 *
 * Naming note: the Wild's arena is Grand Casino Arena (the Xcel Energy
 * Center name retired in 2025); ESPN already returns the new name.
 */

const { slugify } = require('./_helpers');

const TEAMS = [
  { ep: 'baseball/mlb/teams/min', nick: 'Twins', venues: ['Target Field'], nb: 'North Loop, Minneapolis', city: 'Minneapolis', tickets: 'https://www.mlb.com/twins/tickets' },
  { ep: 'football/nfl/teams/min', nick: 'Vikings', venues: ['U.S. Bank Stadium'], nb: 'Downtown Minneapolis', city: 'Minneapolis', tickets: 'https://www.vikings.com/tickets/' },
  { ep: 'hockey/nhl/teams/min', nick: 'Wild', venues: ['Grand Casino Arena', 'Xcel Energy Center'], nb: 'Downtown St. Paul', city: 'St. Paul', tickets: 'https://www.nhl.com/wild/tickets' },
  { ep: 'basketball/nba/teams/min', nick: 'Timberwolves', venues: ['Target Center'], nb: 'Downtown Minneapolis', city: 'Minneapolis', tickets: 'https://www.nba.com/timberwolves/tickets' },
  { ep: 'basketball/wnba/teams/min', nick: 'Lynx', venues: ['Target Center'], nb: 'Downtown Minneapolis', city: 'Minneapolis', tickets: 'https://lynx.wnba.com/tickets' },
  { ep: 'soccer/usa.1/teams/17362', nick: 'MN United', venues: ['Allianz Field'], nb: 'Midway, St. Paul', city: 'St. Paul', tickets: 'https://www.mnufc.com/tickets' },
];
const LOOKAHEAD_DAYS = 150;

function centralParts(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return { date, time: time === '00:00' ? null : time };   // midnight = TBD listing
}

async function scrape() {
  const todayISO = new Date().toISOString().slice(0, 10);
  const maxISO = new Date(Date.now() + LOOKAHEAD_DAYS * 86400000).toISOString().slice(0, 10);
  const events = [];
  const seen = new Set();

  for (const t of TEAMS) {
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${t.ep}/schedule`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' }
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const e of data.events || []) {
        const comp = (e.competitions || [])[0];
        if (!comp) continue;
        const venue = (comp.venue || {}).fullName;
        if (!t.venues.includes(venue)) continue;
        const parts = centralParts(e.date);
        if (!parts || parts.date < todayISO || parts.date > maxISO) continue;
        const opp = (comp.competitors || []).find(c => c.homeAway === 'away');
        const oppName = opp && opp.team && (opp.team.shortDisplayName || opp.team.displayName);
        const title = oppName ? `${t.nick} vs. ${oppName}` : `${t.nick} home game`;
        const id = `sports:${parts.date}:${slugify(title)}`;
        if (seen.has(id)) continue;
        seen.add(id);
        events.push({
          id,
          date: parts.date,
          time: parts.time,
          end_date: null,
          title,
          venue: venue === 'Xcel Energy Center' ? 'Grand Casino Arena' : venue,
          venue_neighborhood: t.nb,
          city: t.city,
          category: 'sports',
          subtitle: null,
          url: t.tickets,
          image: null,
          price: null,
          age: 'All ages',
          source: 'sports'
        });
      }
    } catch (_) { /* one league down never kills the source */ }
  }
  return events;
}

module.exports = { source: 'sports', label: 'Pro sports (ESPN schedules)', scrape };
