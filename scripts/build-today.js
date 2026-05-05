#!/usr/bin/env node
/**
 * Today — a live daily dispatch.
 *
 * Replaces the old static "small good thing" essay corpus with a paragraph
 * composed each morning from real conditions: the actual day of week, the
 * date, today's sunset time, the weather mood from rightnow.json, and the
 * next civic anchor on the countdown list. One sharp recommendation per
 * dispatch, picked from a season-and-mood-keyed pool.
 *
 * The dispatch reads like an editor's note in the print edition. Specific,
 * present-tense, today-aware. Voice: grounded, sensory, no superlatives,
 * no em-dashes.
 *
 * Output: src/data/today.json
 *
 * Note: build-rightnow.js must run before this script so rightnow.json is
 * fresh. The build:full script in package.json orders them correctly.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'src/data/today.json');
const RIGHTNOW = path.join(ROOT, 'src/data/rightnow.json');

const DAY_NAMES   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function pad2(n) { return String(n).padStart(2, '0'); }

function currentSeason(d) {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5)  return 'spring';
  if (m >= 6 && m <= 8)  return 'summer';
  if (m >= 9 && m <= 10) return 'fall';
  return 'winter';
}

// Deterministic PRNG so the same date produces the same dispatch.
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

// ===== Recommendation pools, keyed by season + mood =====
// Each entry is one sentence describing tonight's move. Specific, current,
// sensory. Mood "normal" is for any weather that isn't actively dramatic.
const PICKS = {
  spring: {
    patio: [
      'Bauhaus Brew Labs in Northeast for the first patio pilsner of the year, plus whatever food truck is parked.',
      'A Stone Arch Bridge walk at golden hour, when the river is still moving fast from the thaw and the building tops are catching it.',
      'The Hai Hai patio in Northeast for plastic stools, lemongrass air, and a fish-sauce-wing dinner before the post-work rush.',
      'Lake Harriet at sunset, a cone from Sebastian Joe\'s on the way home. The lake is too cold to swim in but everyone walks it.',
      'Indeed Brewing patio for one beer, then a slow drive past Boom Island as the gold light moves across the warehouses.'
    ],
    rain: [
      'The Trylon for whatever is on the calendar — fifty seats, the rain on the way in is part of the night.',
      'Khâluna in Lyn-Lake for a bowl of khao soi, the room glowing against the gray.',
      'Magers & Quinn on Hennepin until close, then dinner at Tilia. The poetry section earns the hour.',
      'Cafe Astoria on West Seventh for a slow lunch and a window seat, watching the rain do its thing on West Seventh.'
    ],
    normal: [
      'Quang at one in the afternoon, then a walk through Loring Park back to the car.',
      'A drive across the Lake Street Bridge into Cathedral Hill, dinner at Hyacinth on Grand if you can get a seat.',
      'A bowl at Cossetta\'s, then a loop through Mears Park in Lowertown.',
      'The Walker sculpture garden if the light is right, plus a snack at Esker Grove on the way out.'
    ]
  },
  summer: {
    patio: [
      'Bauhaus Brew Labs for the patio pilsner. Order one, watch the sun walk across the brick, order another.',
      'A long Hai Hai dinner on the patio in Northeast. Get there before seven or wait.',
      'The Lake Harriet bandshell for whoever is playing tonight, then a Sebastian Joe\'s on the way home.',
      'Owamni at sunset if you can get a reservation, otherwise the Stone Arch Bridge and a riverside drink at Aster Cafe.',
      'A bike loop around Bde Maka Ska and Lake of the Isles, ending with a cone at Sebastian Joe\'s in Linden Hills.',
      'The Tilia patio in Linden Hills for an early dinner with the side gate open.'
    ],
    rain: [
      'Khâluna in Lyn-Lake. The green-curry-and-coconut air does what no jacket can.',
      'The Trylon for whatever is on tonight, popcorn, the rain on the way in setting the mood.',
      'A long dinner at Hyacinth on Grand Avenue, watching the rain through the front windows.',
      'Volstead\'s Emporium, the speakeasy door on Lake Street, live jazz on weekends.'
    ],
    normal: [
      'A walk across the Stone Arch Bridge at golden hour, dinner reservation somewhere on the river.',
      'Bauhaus Brew Labs for one beer, then dinner anywhere in Northeast. Hai Hai if you can get the patio.',
      'A long Saturday morning at Lake Harriet, an iced coffee from Spyhouse, an early dinner at Tilia.',
      'A drive to Hidden Falls Regional Park for the river, then dinner at Hyacinth in Cathedral Hill.',
      'Quang at lunch, the Como Conservatory in the afternoon, dinner wherever you want.'
    ]
  },
  fall: {
    normal: [
      'A drive on the East River Road from St. Anthony Main to Hidden Falls. Twenty-five minutes if you do not stop. Stop.',
      'The Walker for whatever is on, dinner at Spoon and Stable bar after.',
      'A long Sunday at the Saint Paul Hotel lobby bar with a paper, then dinner at Meritage across Rice Park.',
      'A maple-color drive through Kenwood, dinner at Saint Genevieve in Linden Hills.',
      'A Vikings Sunday at any neighborhood bar in Northeast. The CC Club if you want the classic. Brunson\'s if you want a meal.'
    ],
    rain: [
      'The Heights Theater for whatever 35mm print is on, popcorn, the rain on Central a part of the night.',
      'Cossetta\'s on West Seventh for a bowl of pasta and a glass of red, the lights on, the wind locked outside.',
      'A long dinner at Hyacinth on Grand. Watch the rain on Cathedral Hill through the windows.',
      'Trylon for whatever is on the calendar. The rain plus the second-run print is the whole point.'
    ],
    patio: [
      'A patio anywhere with shade, before the season is over. Indeed Brewing has heaters.',
      'A walk around Lake Harriet while the light is still doing the gold thing.',
      'Tilia patio in Linden Hills, sweater weather still warm enough to be outside.'
    ]
  },
  winter: {
    brutal: [
      'Cossetta\'s on West Seventh for a giant bowl of pasta, lights on, wind locked outside.',
      'Quang on Eat Street, a bowl of pho tai, sit by the radiator.',
      'Khâluna in Lyn-Lake for the green curry. The room glows. The curry does the work.',
      'A long lunch at the Saint Paul Hotel lobby bar, then a slow drive past the Cathedral lit up against the snow.',
      'The Hennepin County Central Library for an hour, then dinner anywhere with low ceilings and tealights.'
    ],
    snow: [
      'A drive past Lake of the Isles after the snow stops. Park, walk fifty feet, look at the white silence, drive home.',
      'Cafe Astoria on West Seventh for a long breakfast in a window seat, the snow doing its slow horizontal thing.',
      'Magers & Quinn until close, then a heavy dinner at Cossetta\'s.',
      'The Trylon for whatever second-run print is on, popcorn, hot chocolate from a thermos in the lobby.'
    ],
    normal: [
      'Cossetta\'s on West Seventh, a bowl of pasta, a glass of red. Two hours, no phone.',
      'The Saint Paul Hotel lobby bar for one drink in a glass that feels heavier than it should, then dinner at Meritage.',
      'Magers & Quinn on Hennepin in Uptown until close, dinner anywhere with candles.',
      'Quang for pho, then a walk through the Hennepin County Library, then home before nine.',
      'The Walker for whatever is on, dinner at Esker Grove, slow drive home along Lyndale.'
    ]
  }
};

// Conditions sentences keyed to weather mood. Each is one fragment slotted
// into the dispatch after the date+sunset line.
const CONDITIONS = {
  patio: [
    'Patio weather, the kind the metro waits for.',
    'The patios have opened. The patios are the news.',
    'Sun out, no humidity, the rare day where everybody is outside at the same time.',
    'A blue sky, an east wind, the right temperature.'
  ],
  brutal: [
    'A brutal cold day. Stay close to home, dress for the parking lot like it is a Siberian field.',
    'Cold enough that the inside of your nose makes the same sound your boots do.',
    'Wind chill that exists only here and on a handful of Canadian highways.',
    'A real cold, the kind that organizes the whole day around the thirty-foot walks between warm rooms.'
  ],
  snow: [
    'Snow still falling, the city quieter for it.',
    'The snow is doing the slow horizontal thing, and the city is at its most photogenic.',
    'The first inch is on the ground and the plows are out by supper.',
    'A clean snow, no wind, the trees doing their whole business.'
  ],
  rain: [
    'Steady rain in the forecast.',
    'A low gray ceiling, a long evening.',
    'Real rain, not a passing cell. Plan inside.',
    'The kind of evening improved by a candlelit room and somebody you like.'
  ],
  normal: [
    'A clean enough day, no excuses.',
    'A reasonable middle-of-the-week sky.',
    'Mild, easy, no opinions to have about the weather.',
    'Nothing dramatic outside, which is its own kind of luck.'
  ]
};

// Closing flavor by mood. Optional; some dispatches read tighter without one.
const CLOSERS = {
  patio: [
    'Be outside until the sun gives up. It will.',
    'Come back in when the sweater stops being enough.',
    'The patios will not be open all year. Tonight is the night.',
    'Eat at the bar if the patio is full. Eat fast and go for a walk.'
  ],
  brutal: [
    'Drive home with the heat on high and a podcast you have been meaning to start.',
    'No outside plans tonight. None. Tomorrow either, probably.',
    'Layer like the parking lot is a problem to solve.',
    'It is one day. The metro has done worse.'
  ],
  snow: [
    'Park where you will not need to dig out.',
    'The walk between the car and the door is the day\'s only weather event.',
    'Dress like you are going somewhere, not like you are not.',
    'Tomorrow the plows will have it. Tonight you have it raw.'
  ],
  rain: [
    'Bring the umbrella. The umbrella will not help.',
    'Take the long way home through the rain. The city is at its most cinematic.',
    'Stay through dessert. Outside is not getting better.',
    'The rain is the soundtrack tonight, accept it.'
  ],
  normal: [
    'No reason to do nothing tonight.',
    'The day is yours. Spend some of it outside.',
    'A regular Tuesday is its own privilege some weeks.',
    'Go do one of the things on the list.'
  ]
};

// Day-of-week openers slot in after the date if we want a weekday flavor.
// Used sparingly, only on days that have a clear character.
const DOW_FLAVOR = {
  0: 'Sunday recovery rules.',                 // Sunday
  1: 'Monday is for the indoor work, mostly.', // Monday
  4: 'Thursday is the new Friday in this metro and you know it.', // Thursday
  5: 'Friday and the weekend has its own gravity.',                // Friday
  6: 'Saturday energy, plan accordingly.'                          // Saturday
};

// Civic-anchor templating, only used when the next countdown is within ~14 days.
function civicLine(countdown) {
  if (!countdown || countdown.days <= 0 || countdown.days > 21) return null;
  const d = countdown.days;
  if (d === 1) return `${countdown.name} is tomorrow.`;
  if (d <= 7) return `${countdown.name} this Saturday, more or less.`;
  return `${countdown.name} in ${d} days.`;
}

function generateForDate(date, rightnow) {
  const pad = n => String(n).padStart(2, '0');
  const isoDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const seed = hash(isoDate);
  const rng = mulberry32(seed);

  const dow = date.getDay();
  const monthName = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  const dateLine = `${DAY_NAMES[dow]}, ${monthName} ${day}.`;

  const season = currentSeason(date);
  const mood = (rightnow && rightnow.weather && rightnow.weather.mood) || 'normal';
  // Map weather mood to one of our pool keys. Unknown moods fall back to normal.
  const moodKey = ['patio','brutal','snow','rain'].includes(mood) ? mood : 'normal';

  const sunset = rightnow && rightnow.sun && rightnow.sun.set;
  const sunsetLine = sunset ? `Sunset at ${sunset}.` : null;

  const conditionsLine = pick(CONDITIONS[moodKey] || CONDITIONS.normal, rng);

  // Civic anchor: pull the soonest countdown if it is within 21 days.
  const nextCountdown = (rightnow && rightnow.countdowns || []).find(c => c.days > 0);
  const civic = civicLine(nextCountdown);

  // Tonight's recommendation. Prefer mood-and-season-keyed pool; fall back
  // through season → spring if a specific bucket is empty.
  const seasonPool = PICKS[season] || PICKS.spring;
  const moodPool = seasonPool[moodKey] || seasonPool.normal || seasonPool.patio || PICKS.spring.normal;
  const rec = `Tonight: ${pick(moodPool, rng)}`;

  // Optional day-of-week flavor (used on ~half of days for variation).
  const useDowFlavor = rng() < 0.45 && DOW_FLAVOR[dow];
  const dowLine = useDowFlavor ? DOW_FLAVOR[dow] : null;

  const closer = pick(CLOSERS[moodKey] || CLOSERS.normal, rng);

  // Stitch the dispatch together. Every fragment is a sentence; they read
  // like a single paragraph with the date as a hook.
  const fragments = [
    dateLine,
    sunsetLine,
    conditionsLine,
    civic,
    dowLine,
    rec,
    closer
  ].filter(Boolean);

  const body = fragments.join(' ');
  const wordCount = body.split(/\s+/).length;

  // Short editorial headline derived from mood + season + day-of-week.
  // The body already restates the date; the title earns its own register.
  const TITLES = {
    patio:  ['Patio day', 'Outside tonight', 'A patio kind of evening', 'Sun out, plans on'],
    brutal: ['A cold one', 'Below zero', 'Indoor day', 'A quiet, brutal one'],
    snow:   ['Snow on the ground', 'A slow snowy day', 'The first inch', 'A quieter city'],
    rain:   ['Rain on the way', 'A candlelit night', 'A wet evening', 'A long indoor one'],
    normal: {
      spring: ['A spring evening', 'Daylight is back', 'A clean one', 'Quiet, easy, good'],
      summer: ['A summer night', 'A long evening', 'Daylight to spare', 'A clean blue one'],
      fall:   ['A fall evening', 'Color and short light', 'A quiet good one', 'Sweater weather'],
      winter: ['A quiet winter night', 'A short-light day', 'A clean cold one', 'A walking-pace evening']
    }
  };
  const titlePool = moodKey === 'normal'
    ? (TITLES.normal[season] || TITLES.normal.spring)
    : TITLES[moodKey];
  const title = pick(titlePool, rng);

  return {
    date: isoDate,
    season,
    mood,
    title,
    body,
    word_count: wordCount
  };
}

function loadRightNow() {
  try { return JSON.parse(fs.readFileSync(RIGHTNOW, 'utf8')); }
  catch (_) { return null; }
}

function main() {
  const central = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const rightnow = loadRightNow();
  const data = generateForDate(central, rightnow);
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log(`  → wrote today.json: "${data.title}" · ${data.mood} · ${data.season} · ${data.word_count} words`);
}

if (require.main === module) main();
module.exports = { generateForDate };
