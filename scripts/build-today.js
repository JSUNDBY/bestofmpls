#!/usr/bin/env node
/**
 * "Today" — a daily small good thing.
 *
 * One short essay (80 to 150 words) about a specific moment, place, or
 * texture of life in the metro. Date-seeded deterministic pick from a hand
 * written corpus, season-aware so winter pieces do not surface in July.
 *
 * Output: src/data/today.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'src/data/today.json');

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pick(arr, seed) {
  return arr[seed % arr.length];
}

function currentSeason(d) {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 10) return 'fall';
  return 'winter';
}

const ESSAYS = [
  // ===== Spring =====
  {
    season: 'spring',
    title: 'The day the patios open',
    body: "Nobody decides it. Some Tuesday in April the temperature hits sixty-two and the patios on Hennepin and Lyn-Lake and West Seventh fill up by four. Half the people there left work early without telling anybody. Wait staff who worked indoors all winter look slightly stunned to be carrying drinks across pavement again. A guy at the next table is wearing shorts and a parka and is not the only one. The first patio day is not on the calendar. It is just the day the city collectively agrees that we made it."
  },
  {
    season: 'spring',
    title: 'The Mississippi after the thaw',
    body: "Walk the river path at Hidden Falls in the second week the ice is gone and the water is moving fast and brown and the smell is half mud half river. The trees have not leafed yet and the bones of the bluffs are still showing. There is a coldness coming off the water that is not winter cold and not summer cold and lasts about three weeks. If you have lived here long enough you have a particular stretch you walk in this window. It is a small act of citizenship."
  },
  {
    season: 'spring',
    title: 'The State Fair grounds in May',
    body: "The fairgrounds in May are mostly closed. A maintenance truck or two. Geese on the wide empty roads. The buildings the rest of the year are full of pickle vendors and 4-H lambs are just buildings with their windows boarded. It is the most un-Minnesotan version of one of the most Minnesotan places, and worth a half-hour walk just to see. The grandstand without anyone in it. The Skyride towers in their parked positions. The big metal animal sculptures patient through another off-season."
  },
  {
    season: 'spring',
    title: 'May Day in Powderhorn',
    body: "The first Sunday in May, In the Heart of the Beast Puppet Theatre runs the May Day parade through Powderhorn and the route fills with thousands of neighbors and oversized papier-mâché figures and a sun puppet on a pole and music from a dozen amateur ensembles. It is free, it is not branded, it has been happening for fifty years, and it is one of the most genuinely Minneapolis events on the calendar. Stand on Bloomington Avenue. Watch the giant puppets pass. The kids will remember this in their forties."
  },

  // ===== Summer =====
  {
    season: 'summer',
    title: 'A Tuesday at Lake Harriet',
    body: "The bandshell at Lake Harriet runs free music almost every summer night. A Tuesday in July, a folk trio nobody famous, eighty people on the grass, half of them with dogs. The lake water is a green that is the color of summer here and not winter anywhere. The Como-Harriet streetcar runs along the shore and someone is always taking a picture of it. If you only do one summer thing in Minneapolis, do this on a Tuesday with whoever you like best."
  },
  {
    season: 'summer',
    title: 'Stone Arch at golden hour',
    body: "The Stone Arch Bridge at seven in the evening in late June is something like the central nervous system of the city. The downtown skyline, the falls, the mill ruins on the east side, the whole geography legible at a glance. There is always a wedding photo shoot. There is always a busker. There is always somebody who has lived here ten years still occasionally stopping in the middle of the bridge to look at the water. That is the part to remember."
  },
  {
    season: 'summer',
    title: 'The peach pizza window',
    body: "There are about three weeks in late August when the white peaches at the farmers' market are right, and four or five places in the metro will put them on a pizza for that exact window. Pizzeria Lola, Young Joni when it was here, occasionally Punch. It is a stupid amount of fuss for a fruit on bread, and it is also one of the small good things that justify paying the rent in this city. Get the pizza. Go to the lake after."
  },
  {
    season: 'summer',
    title: 'The Twins at Target Field, third inning',
    body: "Walk into a weekday afternoon Twins game in the bottom of the third. Pay scalper-cheap, find a seat behind home plate, order a beer and a fried pickle from the in-seat app. The Minneapolis skyline behind the outfield, the Foshay still doing its thing. The team will probably lose. It does not matter. There is a particular June light at Target Field that is one of the best things downtown Minneapolis has ever produced."
  },
  {
    season: 'summer',
    title: 'Art-A-Whirl in NE',
    body: "Third weekend in May, Northeast Minneapolis opens nearly every artist studio in the neighborhood at once. Five hundred-plus artists in old industrial buildings, breweries running parking-lot stages, the whole grid full of people walking from one open door to the next. It is the largest open-studio tour in the country and it is genuinely the easiest way to understand why Northeast became Northeast. Bring small cash. Buy at least one thing."
  },
  {
    season: 'summer',
    title: 'A north-side sunset',
    body: "The west bank of the Mississippi north of downtown is one of the better places in the city to watch the sun go down without anyone selling you anything. North Mississippi Regional Park, a bench, the river moving. The light through the cottonwoods on the opposite shore is doing the trick that summer light does here, the trick that is the whole reason people who left this place keep coming back."
  },

  // ===== Fall =====
  {
    season: 'fall',
    title: 'The first cold morning',
    body: "Some Tuesday in late September the morning low drops into the forties and you walk outside in the same jacket you wore yesterday and it is suddenly a thin jacket. The light is sharper. The first leaves have started. The dogs at the lake know. Coffee tastes different. You will spend the next eight months in some version of preparation for cold, and this is the first day of it, and somehow it is one of the better days of the year."
  },
  {
    season: 'fall',
    title: 'State Fair last day, six p.m.',
    body: "The fair closes Labor Day. By Sunday afternoon the crowds are tired, the workers are tireder, and the lanes are wide enough to walk normally. Get a Sweet Martha's, walk the long way back to the car, look at the giant slide one more time. There is a quality of light on the second-to-last day that is unmistakable. The fair will be back. You will be older when it is."
  },
  {
    season: 'fall',
    title: 'October on the river road',
    body: "Drive the East River Road from St. Anthony Main down to Hidden Falls and back in the second week of October when the maples on the bluffs are doing the thing. Nine miles of it. The Lake Street Bridge from above. The Ford Bridge. The Highland water tower in the distance. A drive that takes twenty-five minutes if you do not stop and an hour if you do. Stop."
  },
  {
    season: 'fall',
    title: 'A high school football Friday',
    body: "Find a small high school game on a Friday night in late October. Edina, St. Paul Highland, Roseville, Robbinsdale. Pay five bucks. Stand against the chain link with a coffee. The marching band, the small-town theatrics of it inside the second-largest metro in the upper Midwest, the cold beginning to be a real cold. There is something about it that explains why people stay here."
  },
  {
    season: 'fall',
    title: 'The first hot dish',
    body: "Some Wednesday in mid-October somebody you live with or near makes the first hot dish of the season and you eat it with a Surly and watch the dark come in at six-fifteen. Tater tots, cream of mushroom, hamburger. It is not good in the way restaurant food is good. It is good in a different way. There is no version of this in California."
  },

  // ===== Winter =====
  {
    season: 'winter',
    title: 'The first ten below',
    body: "The temperature drops to ten below on a clear morning and the sky goes a color it does not go any other time. A pale, washed-out blue with no warmth to it. The snow squeaks under boots in a way you cannot fake. Cars start with that sub-zero slowness. Anyone you make eye contact with on the street nods slightly. We are doing this together. The Vikings are losing. We will be okay."
  },
  {
    season: 'winter',
    title: 'The skyway at lunch',
    body: "Walk from the Hennepin County Library through the skyway to the IDS Crystal Court at noon on a Wednesday in February. Forty thousand people moving through climate-controlled second-story tunnels, mostly silent, mostly in suits or scrubs. It is one of the strangest urban environments in any American city, and almost no tourist book mentions it. Get a sandwich. Walk back the long way. Notice the light through the Crystal Court roof."
  },
  {
    season: 'winter',
    title: 'A January moonrise',
    body: "Some clear cold Sunday in January, drive to the south side of Bde Maka Ska around four-thirty when the moon is rising and the sun is setting at almost the same time. The lake is frozen and the ice fishermen's tents are out and the city skyline is lit up and the moon is coming up over Uptown. Park. Walk fifty feet. Stand there for two minutes. Drive home."
  },
  {
    season: 'winter',
    title: 'The Loppet at night',
    body: "Theodore Wirth Park in early February runs a torchlit night ski as part of the Loppet Festival and it is genuinely one of the better small public spectacles in the metro. Hundreds of people on cross-country skis with lanterns, snaking through the woods after dark. You do not have to ski it. You can stand at the lodge and watch it move past, the lights bobbing through the trees, and feel for a second like Minneapolis has invented something."
  },
  {
    season: 'winter',
    title: 'A library Saturday',
    body: "The downtown Hennepin County Library on a snowy Saturday is one of the best free things in the city. The atrium, the high ceilings, the natural light that somehow still works in February. The fourth-floor Special Collections has Minneapolis history in drawers. There is a coffee cart. There are no expectations on you. Stay three hours. Read whatever."
  },
  {
    season: 'winter',
    title: 'The Winter Carnival ice palace',
    body: "When St. Paul builds the ice palace, which is not every year, it is one of the strangest and best public art installations in the country. A literal building made of ice blocks the size of laundry machines. Lit at night. Free. Walk through it. Touch the walls. The Winter Carnival has been doing some version of this since 1886 and the city does not advertise it the way it should."
  },

  // ===== Year-round =====
  {
    season: 'any',
    title: 'A booth at Mickey\'s',
    body: "Mickey's Diner, downtown St. Paul, the dining-car building that has been there since 1939 and is open twenty-four hours and looks exactly like the diner in every movie. Order the breakfast plate. Sit in the booth. Read the newspaper somebody left. The cook will know the regulars. You are not a regular. That is fine. Mickey's makes room for both."
  },
  {
    season: 'any',
    title: 'A short walk through Lowertown',
    body: "Walk from the Union Depot up Sibley to Mears Park to the Saint Paul Hotel and back down through Rice Park. Twenty minutes. The river city in eight blocks. The Landmark Center, the Cathedral on its hill in the distance, the big trees in the parks. Lowertown is the most underrated quarter of the metro. Most weekends nobody you know is there."
  },
  {
    season: 'any',
    title: 'The view from the Foshay deck',
    body: "The Foshay Tower observation deck is open Thursday through Sunday and most people who live here have never been. Thirty-second floor, open air, the entire downtown grid laid out under you. Five dollars. The IDS, the Wells Fargo, the river. Go on a Saturday afternoon when the light is right. Do it once a year and you will never feel like you do not know this city."
  },
  {
    season: 'any',
    title: 'A long Quang lunch',
    body: "A bowl of pho tai at Quang on Eat Street at one-thirty on a Thursday is one of the steady rituals of a Minneapolis adult life. Open since 1989. The booth seats are squeaky. The broth is right. The rice paper rolls come with the green sauce that has been in your refrigerator at some point. You are part of a long line of people who eat lunch here on whatever they call their off day."
  },
  {
    season: 'any',
    title: 'The reading room at the U',
    body: "Walker Library, Magrath Library, even the main Wilson Library on the U of M campus. Anyone can walk in. The reading rooms are quiet. The light is the right kind of natural. There is a particular kind of weekday afternoon between three and five when the buildings are nearly empty and you can sit at a long table and pretend, briefly, to be twenty again, with all of life in front of you."
  },
  {
    season: 'any',
    title: 'A drive across the Lake Street Bridge',
    body: "There is a particular angle on the Lake Street Bridge at sunset, going east into St. Paul, when the river is gold and the bluffs are gold and the bridge railings are gold, and you are crossing into a different city without leaving the metro. It takes thirty seconds. There is no sign. It is the smallest commute in the metro that still feels like crossing into somewhere else."
  },
  {
    season: 'any',
    title: 'The corner at 38th & Chicago',
    body: "Stop at George Floyd Square at the corner of 38th and Chicago in South Minneapolis. Park. Get out. Read the names. The murals change. The neighborhood maintains the space without state help. It is not a tourist site and it is not a memorial in the formal sense. It is a corner that the people who live around it have decided to hold. Stand quietly. Then leave."
  },
  {
    season: 'any',
    title: 'Magers & Quinn at five',
    body: "Magers & Quinn used books on Hennepin in Uptown, an hour before close on a weeknight. Half-empty. The shelves are organized in a way that rewards browsing. The poetry section is small and well-chosen. The fiction section will surprise you. Buy one thing for under fifteen dollars and walk to the lake to start it."
  },
  {
    season: 'any',
    title: 'A kombucha at Spyhouse on a Sunday',
    body: "Spyhouse on Hennepin, late Sunday morning, every seat taken, the line out the door, and you wait twelve minutes for a coffee that is not the best coffee in the city but is the most reliable. The room is loud. The barista does the small talk well. You sit on the bench outside and watch the two sides of Hennepin Avenue do their respective Sundays. The whole metro on display."
  },
  {
    season: 'any',
    title: 'The number 6 bus at midnight',
    body: "Take the 6 bus down Hennepin late on a weeknight. From downtown through Uptown to Linden Hills, fifteen-minute ride, three dollars. The bus is half-empty. The driver knows the regulars. You are not a regular. Look out the window at the city you live in and have been calling home for however many years. There is no better cheap tour of Minneapolis."
  },
  {
    season: 'any',
    title: 'A walk under the High Bridge',
    body: "The Smith Avenue High Bridge in St. Paul, walk under it on the West Side trail. Two hundred feet of steel and concrete arching over the river, the wind moving through the cables, no other people. There is a small free public access trail. Stand under the middle of the span. Look up. The city above doing whatever it is doing. You are not part of it for a moment."
  },
  {
    season: 'any',
    title: 'A late slice at Pizza Luce',
    body: "Pizza Luce on Hennepin or Lyndale at eleven-thirty on a weeknight. A slice of the Athena. A pint of pop. The same playlist they have been running since 2007. Half the customers are coming from a show. Half are coming from a long shift. It is not the best pizza in the city. It is the right pizza for the moment."
  },

  // ===== A few that lean into the writer's voice =====
  {
    season: 'any',
    title: 'On the smell of rain on hot asphalt',
    body: "The smell of a summer thunderstorm hitting a hot Minneapolis sidewalk is one of the particular sensory experiences of living here. Some combination of lake humidity, the limestone bedrock, the tree pollen still suspended in the air. It is gone in twenty minutes. Most cities have a version of this. Ours has a flavor. Stand on a porch in Powderhorn or Linden Hills the next time the sky goes green at five p.m. and notice."
  },
  {
    season: 'any',
    title: 'Why we keep doing it',
    body: "Somebody from a warmer city asks why you live here. There is a long answer about the lakes and the food scene and the cost of living. There is a short answer that is more honest. It is some particular quality of light on the Mississippi at six p.m. in early summer. It is the specific way the city collectively tolerates and then survives February. It is the people who showed up the day after George Floyd was killed. None of these is exportable. All of them are why."
  }
];

function generateForDate(date) {
  // Build the iso date from local fields rather than toISOString, since
  // toISOString converts to UTC and would drift when the input represents
  // Central time.
  const pad = n => String(n).padStart(2, '0');
  const isoDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const season = currentSeason(date);
  // Pool: in-season + always-applicable. If the seasonal pool is empty (which
  // it never should be), fall back to all essays.
  const pool = ESSAYS.filter(e => e.season === season || e.season === 'any');
  const seed = hash(isoDate);
  const essay = pick(pool.length ? pool : ESSAYS, seed);
  return {
    date: isoDate,
    season,
    title: essay.title,
    body: essay.body,
    word_count: essay.body.split(/\s+/).length
  };
}

function main() {
  // Anchor to Central time so the daily essay rolls at midnight Central,
  // not at midnight UTC (which is 7 PM Central — a day early).
  const central = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const data = generateForDate(central);
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log(`  → wrote today.json: "${data.title}" (${data.word_count} words, ${data.season})`);
}

if (require.main === module) main();
module.exports = { generateForDate };
