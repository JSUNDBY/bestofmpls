#!/usr/bin/env node
/**
 * Today — a quiet daily observation.
 *
 * One paragraph that locates this day in the metro. Not a recommendation,
 * not a directive, not a "tonight do X" command. A paragraph the way Joan
 * Didion or Sam Anderson would write it: present-tense, sensory, specific
 * to the season and weather, with no second-person verbs.
 *
 * Rules:
 *   - No "you" commands
 *   - No "Tonight:" prescription
 *   - No specific places (that is what /tonight/ and the directory are for)
 *   - No countdowns (that is what /tonight/ is for)
 *   - Stays under 100 words
 *   - Date-seeded so the same day produces the same observation
 *
 * Output: src/data/today.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'src/data/today.json');
const RIGHTNOW = path.join(ROOT, 'src/data/rightnow.json');

function pad2(n) { return String(n).padStart(2, '0'); }
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

function currentSeason(d) {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5)  return 'spring';
  if (m >= 6 && m <= 8)  return 'summer';
  if (m >= 9 && m <= 10) return 'fall';
  return 'winter';
}

// Each entry: { title, body }. Title is a short evocative phrase,
// not a generic mood word. Body is one paragraph, present tense,
// no recommendations, no second-person commands.
const OBSERVATIONS = {
  // ===== SPRING =====
  'spring.patio': [
    {
      title: 'The first warm one',
      body: 'The first seventy-degree day is the day the city remembers itself. Patios that were closed on Saturday are full by four. Jackets get tossed over chair backs without ceremony. The light at six holds longer than memory says it does in May, and the metro is collectively willing to believe in summer for one afternoon at a time.'
    },
    {
      title: 'Patios open',
      body: 'Sun out, no humidity, the kind of day everybody is outside at the same time. The lakes are not yet warm enough to swim in but everybody walks them. The smell of charcoal lighter fluid is back in the alleys of Powderhorn and Northeast. Eight months of waiting, paid out in one afternoon.'
    },
    {
      title: 'Sweater off by noon',
      body: 'The morning starts cool enough to need a layer and warm enough to drop it by lunch. The trees are at the green-haze stage where leaves have started but you cannot quite see them yet. A small good day. The city is not used to it and overdoes it slightly. Forgivable.'
    },
    {
      title: 'Daylight stretching',
      body: 'Daylight running past dinner now, which is a thing the metro does not stop being grateful for. The patios are open, the bike paths are loud, the lakes are doing the thing where the wind catches the water just right. April was eight days ago and it feels like another year.'
    }
  ],
  'spring.rain': [
    {
      title: 'A spring rain',
      body: 'Steady rain on a city that has been waiting for it. The new grass needs it, the trees need it, the lakes are still low from the dry winter. The smell of warm rain on warm pavement is the spring smell, distinct from the summer one. The street trees darken. Everything an inch greener by morning.'
    },
    {
      title: 'A low ceiling',
      body: 'A low gray ceiling, the kind of evening that does not feel oppressive, just close. The lake surfaces go to pewter. The maples that just leafed out look almost black against the sky. A quiet rain, in no hurry.'
    },
    {
      title: 'After the storm',
      body: 'A brief dramatic storm, then the air is clear and the light comes back stronger than before. The petals from the crab-apples are pinned wet to every car windshield in the metro. The sound of water in the gutter downspouts is the spring soundtrack.'
    }
  ],
  'spring.normal': [
    {
      title: 'Early May',
      body: 'The trees have not decided what to be yet. Buds, not leaves. The grass is greening in patches, the river is still moving fast from the late thaw, the bluffs still showing their bones. A two-week window between winter and spring proper. The first lilacs come in another ten days. The patios are open but the patios are not yet the news. A held breath, before everything happens at once.'
    },
    {
      title: 'The held breath',
      body: 'The metro is in its quiet pre-summer phase, when the trees are leafing in slow motion and the lakes have just thawed. Spring sports are starting. The Twins are at home. The smell of lawnmowers is back, but only on the warm afternoons. May is shorter than it looks on the calendar.'
    },
    {
      title: 'A second thaw',
      body: 'A cool day after a warm week, the kind of weather only this part of the year offers. The leaves are all out now, light and unbattered. The new growth on the elm trees is almost yellow. The lakes are too cold for swimming and warm enough for the geese. The kind of day that does not announce itself.'
    },
    {
      title: 'Between thaws',
      body: 'A regular spring weekday, neither warm enough to celebrate nor cold enough to complain. The trees are leafing. The dogs at the lakes are tired but happy. The light at seven is a particular green-gold that exists only in the second half of May. A reasonable middle.'
    }
  ],

  // ===== SUMMER =====
  'summer.patio': [
    {
      title: 'A long evening',
      body: 'Daylight running until almost nine, the city stretching the day. The lakes are full of paddleboards. The smell of grilling drifts up the alleys. The light at eight does that thing where the brick warehouses turn gold and the windows become mirrors. A good summer day, the kind the metro remembers in February.'
    },
    {
      title: 'Peak summer',
      body: 'A clean blue day, the kind the chamber of commerce uses in brochures. Eighty-three degrees, low humidity, an east wind off the river. The patios full at four, the bandshell full at seven. Eight months out of the year people complain about living here. This is the day they stop.'
    },
    {
      title: 'Lake weather',
      body: 'The lakes are doing the work today. Paddleboards out, the chain of lakes loop crowded with bikes, the bandshell letting whoever is playing sound carry across the water. The smell of warm grass and sunscreen is the metro smell from now until late August.'
    },
    {
      title: 'Daylight to spare',
      body: 'The longest evenings the metro gets. Sunset past nine, the gold light walking across Northeast warehouses for what feels like an hour. Every patio is somebody is meeting somebody. The summer is short and the city knows it.'
    }
  ],
  'summer.rain': [
    {
      title: 'A summer storm',
      body: 'A real summer storm, the kind that turns the sky green at four and arrives in twenty minutes. The trees bend the way they only do in July. The smell of ozone and wet grass. The lakes go to slate. After, the air is clear, the temperature drops ten degrees, the patios fill again like nothing happened.'
    },
    {
      title: 'Steady rain in July',
      body: 'A steady, slow summer rain, the kind that does not interrupt anything. The patios stay half-full, the runners on the parkway keep going, the lakes look heavier than usual. Rain in July is rarely a problem in the metro. It is just weather.'
    },
    {
      title: 'A wet evening',
      body: 'Low gray ceiling, warm air, a rain that has been building since this morning. The trees look more saturated than they have any right to. The lakes are at high water. The city smells like it does in nineteen out of twenty Julys.'
    }
  ],
  'summer.normal': [
    {
      title: 'A summer Tuesday',
      body: 'A normal weekday in the warm months, which is to say a small civic miracle. Daylight from five to nearly nine. Patios open, lakes open, every neighborhood loud at the right hours. The city in its working summer mode. Eight months of preparation, three months of payoff.'
    },
    {
      title: 'The middle of summer',
      body: 'Mid-July, the part of summer where you stop noticing how good it is. The trees are at full canopy. The lakes have warmed. The smell of grilling is permanent now. State Fair in six weeks. The kind of day that makes Februarys survivable.'
    },
    {
      title: 'A clean blue one',
      body: 'A clear sky, a light wind, a temperature the metro will not see again until next June. The Mississippi at sunset does the gold thing. The Stone Arch Bridge is somebody is taking a wedding photo on it, as it always is. The kind of day the city earns by enduring its winters.'
    },
    {
      title: 'Late summer',
      body: 'Mid-August, the period where you can feel autumn in the morning air but the afternoons are still summer. The light is slightly different from July, an inch lower in the sky at six. The State Fair posters are up. The first hint of the long arc back.'
    }
  ],

  // ===== FALL =====
  'fall.normal': [
    {
      title: 'Color and short light',
      body: 'The maples in Kenwood and the river road are at peak. The light is at its lowest angle of the year. By six it is golden, by seven it is over. The city has about three weeks of this and does not waste them. A reasonable layer in the morning, a heavier one by sunset.'
    },
    {
      title: 'A fall evening',
      body: 'Sweater weather, leaves in the parkway, the kind of light that makes every photograph look intentional. The lakes are mirror-still. The smell of woodsmoke from the first fireplaces of the year. The metro is good at fall and knows it.'
    },
    {
      title: 'Late October',
      body: 'The end of the long color. Some of the trees are bare now, most are still gold. The river is at its low autumn level, the bluffs visible through thinning leaves. The wind has the first true cold in it, the kind that means business. The patios are emptying.'
    },
    {
      title: 'A football Sunday',
      body: 'A regular fall Sunday. The Vikings are playing. The neighborhood bars are full at noon. The trees are holding their color one more week. The smell of charcoal in the alleys is replaced by the smell of woodsmoke. A good unspectacular day.'
    }
  ],
  'fall.rain': [
    {
      title: 'A cold rain',
      body: 'The first real cold rain of the season. The leaves come down faster now. The streets glisten under the sodium lights. The city smells like wet wool and decaying leaves, in the good way. The kind of evening that earned its candlelit table.'
    },
    {
      title: 'A fall storm',
      body: 'Wind and rain together, the kind of storm that brings the leaves down in sheets. The maples will be bare by morning. The temperature drops ten degrees in an hour. The metro shifts gears, audibly.'
    },
    {
      title: 'Low gray fall',
      body: 'A low gray ceiling and a steady rain, not heavy. The leaves are at their darkest most-saturated stage, the wet color. The streets in St. Paul reflect the sky in a way they only do this time of year.'
    }
  ],
  'fall.patio': [
    {
      title: 'Indian summer',
      body: 'A late-season warm day, generous and unreasonable. The leaves are gold and the temperature is seventy. The patios that should be closed are full. Everybody knows it is borrowed time and is not pretending otherwise.'
    },
    {
      title: 'A bonus warm day',
      body: 'October giving back a day of summer. The patios will not be open next week, almost certainly. The light is the wrong angle for this temperature, which is part of the strangeness. The city is using the day on purpose.'
    },
    {
      title: 'Last warm Saturday',
      body: 'The kind of day everybody knows is the last one. The lakes are crowded the way they were in August, but with sweaters tied at waists. The light by five is autumn light. Nobody is in a hurry.'
    }
  ],

  // ===== WINTER =====
  'winter.brutal': [
    {
      title: 'Below zero',
      body: 'The walk between the car and the door is the day\'s only weather event. The air bites the inside of your nose. The squeak of boots on cold snow is a sound that exists only here and on a few Canadian highways. By four it is dark again. The metro is good at this. Most cities are not.'
    },
    {
      title: 'A cold one',
      body: 'A real cold day, the kind that organizes the entire schedule around the thirty-foot walks between warm rooms. The sky is the pale washed-out blue that only exists in January at noon. The cars start with their below-zero hesitation. Inside is everything.'
    },
    {
      title: 'The squeak of cold',
      body: 'Cold enough that the snow squeaks underfoot in a way you cannot fake. The breath hangs visible past your shoulders. The light at three is already going. Anyone you make eye contact with on the street nods slightly. We are doing this together.'
    }
  ],
  'winter.snow': [
    {
      title: 'A clean snow',
      body: 'A clean snow, no wind, the trees doing the work the photographs always show. The plows came through at four and the streets are stripes of white and salt. The air smells like nothing, which is winter\'s particular thing. The city is at its most photogenic and quietest.'
    },
    {
      title: 'The first inch',
      body: 'The first real snowfall of the year, the one the metro has been preparing for since October. The trees catch it neatly. The streetlights at five p.m. show the slow horizontal drift. The plows are out before suppertime. The city is good at this and has been since 1849.'
    },
    {
      title: 'After the storm',
      body: 'After a real snow, the streets are ribbons. The trees hold the new white the way only fresh snow does. The shovel sounds from every block at seven a.m. The metro is in its routine winter posture, capable and unfussed.'
    },
    {
      title: 'The white silence',
      body: 'The kind of snow day the city does best. Everything muffled, the streets empty by ten p.m., the lakes white instead of black for the first time in months. The dogs are confused and delighted. The metro slows by half a beat and is the better for it.'
    }
  ],
  'winter.normal': [
    {
      title: 'Short light',
      body: 'The middle of winter, no drama, just the short light. By four-thirty the sun is setting. By five it is dark. The metro is in its long winter posture, working through it, taking the meals indoors and the walks short. The kind of day that adds up to the year.'
    },
    {
      title: 'A walking-pace day',
      body: 'A regular winter weekday. The temperature is what it usually is, the snow on the ground is the snow that has been there for weeks. The library is full at four. The light at the windows is the particular winter light. Nothing dramatic outside, which is its own kind of luck.'
    },
    {
      title: 'Held weather',
      body: 'A held weather day, the kind January excels at. Twenty degrees, a low sun, the lake ice solid enough for a fish house and an extension cord. The city is in its winter rhythm, which it knows well. Some cities pretend their winters are not real. The metro does not.'
    }
  ]
};

// Pick a bucket. If a specific (mood, season) bucket is empty, fall back
// through normal-of-season, then any.
function bucketFor(mood, season) {
  const moodKey = ['patio','brutal','snow','rain'].includes(mood) ? mood : 'normal';
  const k1 = `${season}.${moodKey}`;
  if (OBSERVATIONS[k1] && OBSERVATIONS[k1].length) return OBSERVATIONS[k1];
  const k2 = `${season}.normal`;
  if (OBSERVATIONS[k2] && OBSERVATIONS[k2].length) return OBSERVATIONS[k2];
  // Last resort: pull from anything in the season
  const seasonKeys = Object.keys(OBSERVATIONS).filter(k => k.startsWith(season + '.'));
  if (seasonKeys.length) return OBSERVATIONS[seasonKeys[0]];
  return OBSERVATIONS['spring.normal'];
}

function generateForDate(date, rightnow) {
  const isoDate = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  const seed = hash(isoDate);
  const rng = mulberry32(seed);
  const season = currentSeason(date);
  const mood = (rightnow && rightnow.weather && rightnow.weather.mood) || 'normal';

  const bucket = bucketFor(mood, season);
  const entry = pick(bucket, rng);

  return {
    date: isoDate,
    season,
    mood,
    title: entry.title,
    body: entry.body,
    word_count: entry.body.split(/\s+/).length
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
