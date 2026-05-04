#!/usr/bin/env node
/**
 * Daily horoscopes for the Twin Cities.
 *
 * Generated deterministically from the date so a given day produces a stable
 * set of horoscopes regardless of when the build runs. Voice: grounded
 * Minnesota, observational, no commands, no woo, no astrology jargon beyond
 * sign archetypes.
 *
 * Approach: each sign has a small archetype profile, a bag of opening lines,
 * a bag of middle observations (some city-flavored), and a bag of closings.
 * The day-of-year + sign index seed picks the elements. With ~7 lines per
 * slot and 12 signs that yields enough variation to feel different week to
 * week without ever being random or repeating verbatim within a month.
 *
 * Output: src/data/horoscope.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'src/data/horoscope.json');

// Deterministic PRNG seeded from a string. Mulberry32 over a simple hash.
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

// City-flavored neutrals. Drawn from across both cities; never recommend an
// action, just locate the day in something concrete.
const PLACES = [
  'the Stone Arch Bridge', 'the river path at Hidden Falls', 'a back booth at the CC Club',
  'the steps of the Cathedral', 'the long table at Quang', 'the Como Conservatory',
  'a bench at Loring Park', 'the East Bank between classes', 'a corner of the North Loop',
  'the Walker sculpture garden', 'the parking lot at Holy Land', 'the Lake Harriet bandshell',
  'an empty Tuesday at Spyhouse', 'the second floor of Magers & Quinn', 'the warehouse stretch of West Seventh',
  'the line for the Juicy Lucy at Matt\'s', 'the corner of Lake & Lyndale at dusk',
  'the bus shelter at 38th and Chicago', 'the booth nearest the door at Mickey\'s Diner',
  'the Como streetcar landing'
];

const WEATHER = [
  'a sky the color of zinc', 'an early haze that burns off by ten',
  'a lake-effect cool that did not exist on the forecast', 'an east wind off the river',
  'one of those days where the light does most of the work',
  'a heavy late-afternoon stillness', 'a sun that arrives apologetic and welcome',
  'a low gray ceiling that doesn\'t feel oppressive, just close',
  'the kind of warmth you don\'t notice you needed', 'a wind that smells like rain six hours out'
];

// Per-sign archetype + 12 opener seeds + 12 middle seeds + 12 closer seeds.
// Voice: observational, second person, no instructions, no superlatives,
// nothing mystical. Intentionally a little dry, a little funny when it works.
const SIGNS = [
  {
    name: 'Aries', dates: 'Mar 21 to Apr 19', symbol: '♈',
    openers: [
      'You woke up with a list and the list got smaller before you finished coffee.',
      'Something you were avoiding turns out to take eleven minutes.',
      'A loud morning and a quiet afternoon, in that order.',
      'You are, today, the most efficient person within a one-block radius.',
      'A small problem has been waiting for you to look at it directly.',
      'Energy you usually save for Thursday shows up early.',
      'Today rewards the version of you that does not text first.',
      'A door opens because you remembered to push it.',
      'You are quicker than the room expects. This is mostly an asset.',
      'The plan you made on Sunday holds up under contact.',
      'Restlessness, but it goes somewhere useful.',
      'You start three things and the right two finish themselves.'
    ],
    middles: [
      'A short conversation rearranges the rest of the week.',
      'Something a friend says, in passing, lands harder than they meant.',
      'You catch yourself enjoying the part you usually skip.',
      'An old grievance loses its weight without ceremony.',
      'You are asked a question you have an answer to, for once.',
      'A small win in the middle of an unremarkable Tuesday.',
      'You change your mind about something and feel lighter for it.',
      'Patience pays out at a rate you would not have predicted.',
      'The right person walks in five minutes after you almost left.',
      'A favor offered freely comes back the same way.',
      'You hear yourself laugh and it sounds new.',
      'Someone you respect quietly takes your side.'
    ],
    closers: [
      'Sleep early. Tomorrow already has plans for you.',
      'The night belongs to the people who picked up the phone.',
      'End the day with the lights low and the volume low.',
      'A short walk around the block does more than you would think.',
      'The kitchen, not the bar, is the right room tonight.',
      'You earned a slow evening. Use it.',
      'Leave one thing for tomorrow. The world will hold.',
      'Read something on paper before bed.',
      'The text you owe can wait until morning.',
      'Notice what calmed you. File it away.',
      'A long exhale, an open window, a closed laptop.',
      'Tomorrow is closer than it feels.'
    ]
  },
  {
    name: 'Taurus', dates: 'Apr 20 to May 20', symbol: '♉',
    openers: [
      'You are slow today and that is the right speed.',
      'The morning tastes like the coffee you made carefully.',
      'A meal stretches longer than scheduled and is better for it.',
      'You move through the day like someone who knows where the shortcuts are.',
      'Comfort, today, is not a guilty pleasure. It is a tool.',
      'The radio plays the song you needed to hear.',
      'A small purchase you have been thinking about turns out to be worth it.',
      'You catch up on the kind of rest that does not show up in a calendar.',
      'You are reminded what a properly made bed feels like at noon.',
      'Slowness makes you better at noticing.',
      'The body wins the argument with the calendar.',
      'A familiar room becomes interesting again.'
    ],
    middles: [
      'Someone says something kind in a way that lasts.',
      'You decide a thing is good enough and move on.',
      'A long phone call with someone who knows you all the way back.',
      'A small purchase you considered for weeks justifies itself.',
      'Money behaves predictably. Enjoy it.',
      'You let a meeting end ten minutes early.',
      'A friend cooks for you, or you for them.',
      'You finish a book you started in March.',
      'A gift you did not ask for arrives.',
      'You realize you no longer want a thing you used to want.',
      'A craving turns out to be hunger, then the right meal.',
      'You take a longer route home and notice three things.'
    ],
    closers: [
      'A long bath, an old movie, an early sleep.',
      'Cook the thing your grandmother cooked.',
      'Light one candle, no more.',
      'Open the windows. You will sleep better.',
      'The phone goes in the other room tonight.',
      'You are allowed to be boring on a Wednesday.',
      'A pot of tea, a quilt, a closed door.',
      'A walk after dinner. Slow.',
      'Skip the screen. Read instead.',
      'Sleep when you are tired, not when the clock says.',
      'Plan tomorrow\'s breakfast tonight. Small joys.',
      'The day is over. It was enough.'
    ]
  },
  {
    name: 'Gemini', dates: 'May 21 to Jun 20', symbol: '♊',
    openers: [
      'The brain is loud today. Most of it is useful.',
      'You change your mind twice before nine and arrive at the right answer at ten.',
      'A draft email writes itself if you sit still for five minutes.',
      'You overhear something on the bus that improves the day.',
      'Words come easy. Use a few less than you want to.',
      'A coincidence that is not a coincidence.',
      'You read three things in a row that say the same thing differently.',
      'Today, the small talk is good.',
      'The morning has more options than the afternoon.',
      'You finish a sentence someone else started.',
      'A page-turner of a Tuesday.',
      'Something you almost forgot to mention turns out to matter.'
    ],
    middles: [
      'A friend calls back faster than expected.',
      'You meet someone twice in one day, in two different rooms.',
      'A long-stalled conversation moves an inch.',
      'You tell a story better than you have told it before.',
      'You learn a new word and use it correctly.',
      'A question you asked in March gets answered.',
      'You are funny in the meeting. The right people notice.',
      'Two people who do not know each other recommend the same book.',
      'A text thread comes back to life.',
      'Someone you forgot resurfaces, with no agenda.',
      'You finish reading something you started ten minutes ago. A small joy.',
      'A rumor turns out to be untrue, in your favor.'
    ],
    closers: [
      'Quiet, finally. Lean in.',
      'Write something down before you sleep.',
      'A short note to a long-distance friend.',
      'Skip the doomscroll. Sleep instead.',
      'Pick the book on the top of the stack.',
      'The night is for listening, not talking.',
      'Brush your teeth slowly. Notice it.',
      'You did enough. Stop checking.',
      'A glass of water. A long sleep.',
      'Write the lists tomorrow. Sleep.',
      'Put the phone face-down. Sleep finds you faster.',
      'Tomorrow has its own appetite. Rest.'
    ]
  },
  {
    name: 'Cancer', dates: 'Jun 21 to Jul 22', symbol: '♋',
    openers: [
      'A morning that asks for soft clothes and soft food.',
      'The kitchen does most of the work today.',
      'You are reminded who you are by an old photograph.',
      'The right voice on the phone first thing.',
      'A familiar room becomes the right place to be.',
      'You feel everything a half-step deeper, which is good and tiring.',
      'A person you love texts before you do.',
      'The weather and your mood are in unusual agreement.',
      'You wake up missing someone for no reason.',
      'A quiet kind of confidence arrives without being asked.',
      'The first hour belongs to whoever you live with.',
      'You move slowly and arrive on time.'
    ],
    middles: [
      'A meal with one other person does most of the work this week.',
      'You forgive someone, in your head, with no announcement.',
      'A small kindness from a stranger reframes the morning.',
      'The friend who is hard to reach is reachable.',
      'A song from a long time ago, in the wrong room.',
      'You let yourself want what you actually want.',
      'You write a long message and only send the short one.',
      'You catch yourself being soft and do not correct it.',
      'A long conversation in the kitchen, leaning on the counter.',
      'A gift you forgot you sent gets thanked for.',
      'A photograph surprises you with how much you have changed.',
      'The right person sits next to you at the bar.'
    ],
    closers: [
      'A bath, a candle, an early sleep.',
      'Call your mother, or someone who is.',
      'Cook the thing that takes two hours.',
      'Make the bed before you get into it.',
      'Sleep in the room with the better light tomorrow.',
      'Tea, not wine, tonight.',
      'A handwritten note before sleep.',
      'You did fine today. Be quiet about it.',
      'Soft sheets, hard sleep.',
      'The dishes can wait one day.',
      'Open the window an inch. Sleep.',
      'A long sigh, a clean pillow, the lamp off.'
    ]
  },
  {
    name: 'Leo', dates: 'Jul 23 to Aug 22', symbol: '♌',
    openers: [
      'You walk into the room and the room knows.',
      'Today is the kind of day people remember you on.',
      'A photograph someone takes of you, candidly, comes out well.',
      'You wear the thing you usually save.',
      'A small audience finds you. Be generous.',
      'Compliments arrive. Receive them, do not deflect.',
      'A door opens because you walked toward it.',
      'You are loud in the right way today.',
      'Someone you wanted to notice you, notices.',
      'You sing along in the car. The car is on the freeway. Fine.',
      'A morning that calls for the better coat.',
      'The light is on you today. Do not flinch.'
    ],
    middles: [
      'A friend asks for advice and your advice is useful.',
      'You make a stranger laugh in line for coffee.',
      'A small generosity comes back at three times the size.',
      'Someone you have not seen in a year gets in touch.',
      'A meeting you dreaded ends with you being thanked.',
      'You tell the truth in a meeting and the truth lands.',
      'A photograph circulates without you knowing. People say nice things.',
      'You hold the door for the right person.',
      'A kindness, freely given, makes the day.',
      'A rumor about you turns out to be flattering.',
      'You apologize for a small thing and clear a big one.',
      'Someone notices the haircut. Finally.'
    ],
    closers: [
      'Bigger today, smaller tomorrow.',
      'Enjoy the leftover light.',
      'Sleep with the window open if you can.',
      'Stop checking who liked it.',
      'You were generous. Be generous to yourself, too.',
      'Tomorrow is a quieter performance. Rest.',
      'A long shower and an early bed.',
      'Write down what made today good.',
      'Put the phone down. People will still be talking tomorrow.',
      'The day was loud enough. Sleep is the encore.',
      'A glass of water. A long sleep.',
      'You did the work. Stop now.'
    ]
  },
  {
    name: 'Virgo', dates: 'Aug 23 to Sep 22', symbol: '♍',
    openers: [
      'A clean morning. The list cooperates.',
      'You catch a small mistake before it grows into a large one.',
      'You are correct about a thing you were almost wrong about.',
      'Order, today, is its own reward.',
      'You finish the email that has been sitting in drafts since Sunday.',
      'A small repair, twenty minutes, large gain.',
      'The morning is quiet because you made it that way.',
      'You make the bed and the day improves measurably.',
      'You discover the missing thing in the obvious place.',
      'A reminder you set in February is useful, finally.',
      'Today you are good at the boring parts.',
      'You arrive ten minutes early and use them well.'
    ],
    middles: [
      'A spreadsheet behaves itself.',
      'You delete more than you write. Both versions are better.',
      'A friend asks for your help with the exact thing you are good at.',
      'A long email gets a short, kind reply.',
      'You remember the name of the person you were supposed to remember.',
      'A small pile of things, dispatched.',
      'You catch a price drop. The universe owed you that one.',
      'You finish the puzzle you have been carrying around in your head.',
      'A coworker quietly thanks you for the thing they noticed.',
      'A meeting ends ten minutes early and you do not refill the time.',
      'You write the list and immediately do the first item.',
      'A small lie you have been telling yourself stops being convincing.'
    ],
    closers: [
      'The kitchen is clean. Sleep is closer.',
      'Tomorrow\'s bag, packed tonight.',
      'Stop adding to the list. Sleep.',
      'You were efficient today. Do not be efficient about rest.',
      'A long shower. A short list for tomorrow.',
      'Fold the laundry, then close the day.',
      'You did enough. Genuinely.',
      'Skip the second pass. Sleep.',
      'Quiet, water, sleep. In that order.',
      'The dishes can wait. Mostly.',
      'Set the alarm slightly later than you think.',
      'You know what you need. Do that.'
    ]
  },
  {
    name: 'Libra', dates: 'Sep 23 to Oct 22', symbol: '♎',
    openers: [
      'You wake up gentler than you were yesterday.',
      'The morning has nice symmetry to it.',
      'You make the choice you have been postponing. It is the right one.',
      'Beauty, today, is a useful tool.',
      'A small dispute resolves itself before you arrive.',
      'You are fair with yourself first thing. The rest follows.',
      'A flower in a window catches you off guard.',
      'You wear the thing that goes with everything.',
      'You are kind to a stranger and it costs you nothing.',
      'You let two friends settle their thing without you.',
      'Light through curtains. The day announces itself softly.',
      'A morning that flatters everyone in it.'
    ],
    middles: [
      'A long-stalled compromise reaches a natural shape.',
      'You give honest feedback and the friendship survives it.',
      'A meeting ends in a tie that is actually a win.',
      'You decline an invitation gracefully. Both parties relieved.',
      'You are the swing vote in a small group decision. Vote your gut.',
      'You see both sides and pick one anyway.',
      'A small redecoration, big improvement.',
      'You make the room nicer for the next person in it.',
      'A second opinion lines up with your first one.',
      'You eat well and look at something nice while doing it.',
      'You are flattered, deservedly, in front of someone.',
      'You forgive yourself for last week.'
    ],
    closers: [
      'Lights low. Music low. Sleep early.',
      'Set the table for tomorrow\'s breakfast.',
      'A long quiet evening with the right book.',
      'The day was pretty. The night can be plain.',
      'Sleep is its own kind of fairness.',
      'A bath, then bed. No exceptions.',
      'Light a candle. Read for ten minutes.',
      'You did not need to win today. Good.',
      'You were the soft one. Sleep gently.',
      'No more decisions tonight.',
      'Put the phone in the other room.',
      'A small good thing before sleep. Then sleep.'
    ]
  },
  {
    name: 'Scorpio', dates: 'Oct 23 to Nov 21', symbol: '♏',
    openers: [
      'You see what other people miss this morning. Pretend not to.',
      'A truth you suspected gets confirmed, casually.',
      'You arrive somewhere with more information than the room knows you have.',
      'A small loyalty pays back, today, in a way you did not expect.',
      'You hold a secret well.',
      'Today is for the long game. You are good at it.',
      'You read a person quickly and correctly.',
      'A favor you did months ago surfaces, returned.',
      'The light is unflattering. The mood is sharp. You are fine.',
      'You wake up suspicious and turn out to be right.',
      'A door you thought was closed is not.',
      'Quiet power, well held.'
    ],
    middles: [
      'A long silence breaks in your favor.',
      'You discover what you actually wanted by ruling out what you did not.',
      'Someone shows their hand, accidentally. You file it.',
      'You finish something that was three years in the making.',
      'A small revenge fantasy loses its appeal. Good.',
      'A stranger says the thing your friend will not.',
      'You are trusted with a thing you would have liked to know two years ago.',
      'A confession from someone you barely know. Receive it gently.',
      'You let go of a grudge without telling anyone.',
      'A boundary you held quietly is finally noticed.',
      'You are right about the thing. Try not to gloat.',
      'A long story comes to a quiet conclusion.'
    ],
    closers: [
      'Sleep with the door closed. You earned it.',
      'Burn the draft you wrote at three p.m.',
      'You were right. Stop being right.',
      'The night is yours. Spend it alone.',
      'A long bath, a darker room.',
      'Read the second-best book on the shelf.',
      'Whatever it is, leave it for tomorrow.',
      'Stop replaying the meeting. Sleep.',
      'A glass of water on the nightstand.',
      'Put the phone face-down. Trust the morning.',
      'You did not have to say it. Good. Sleep.',
      'A long exhale and a closed laptop.'
    ]
  },
  {
    name: 'Sagittarius', dates: 'Nov 22 to Dec 21', symbol: '♐',
    openers: [
      'A morning that wants you outdoors, briefly.',
      'You wake up curious about something you have ignored for a year.',
      'Today rewards the version of you that left the house.',
      'A small detour pays out big.',
      'You strike up a conversation with someone you did not need to.',
      'The horizon is wider this morning, even from the kitchen.',
      'You make a plan that involves leaving the metro before fall.',
      'A book in a free library on a corner you do not usually walk.',
      'You wake up wanting to be somewhere else and notice that is fine.',
      'The morning has an open door in it.',
      'A pull toward something you almost did last summer.',
      'You consider the long road home and take it.'
    ],
    middles: [
      'A friend you have not seen since college sends a real message.',
      'You learn something the hard way and laugh about it later.',
      'Someone gives you a recommendation that changes the month.',
      'You miss the bus and gain twenty minutes.',
      'A book you started years ago suddenly makes sense.',
      'You tell a long story to a captive audience. They love it.',
      'A small adventure inside the metro. Drive past Stillwater.',
      'You strike up a conversation in line that goes somewhere.',
      'A trip you did not think you would take starts to assemble itself.',
      'You realize you have outgrown a complaint.',
      'You teach somebody something without trying to.',
      'A long walk produces an idea that holds up overnight.'
    ],
    closers: [
      'Sleep with the curtains open. The light tomorrow is better than tonight.',
      'Pack the bag before bed.',
      'You collected enough today. Sleep.',
      'A short nap of a chapter, then sleep.',
      'Tomorrow is a longer road. Rest.',
      'Stop planning. Sleep.',
      'A glass of water and a window cracked.',
      'Forgive yourself the thing from Tuesday. Sleep.',
      'Phone on airplane mode. Sleep.',
      'A long exhale. Lights out.',
      'You did not need to know everything today. Good. Sleep.',
      'Tomorrow keeps. Sleep.'
    ]
  },
  {
    name: 'Capricorn', dates: 'Dec 22 to Jan 19', symbol: '♑',
    openers: [
      'You started the year quietly. Today the foundation shows.',
      'A long-running project moves an inch. The inch matters.',
      'You make an early decision the rest of the day rewards.',
      'You wake up with a clearer head than you have had in weeks.',
      'A reminder that patient money compounds.',
      'You are the adult in the room today. Wear it lightly.',
      'A small administrative win, dispatched before lunch.',
      'You answer the email you have been dreading. It is not as bad as you thought.',
      'The morning is for the slow build.',
      'You find the receipt. The day improves.',
      'You made the bed. The day starts properly.',
      'A list shrinks. The shoulders relax.'
    ],
    middles: [
      'A long-deferred conversation goes well, finally.',
      'You ask for the raise. Or do not. Either is the right answer today.',
      'Money behaves predictably. Two months of math holds.',
      'You finish the part of the project no one will notice.',
      'A mentor checks in, unprompted.',
      'You are reminded why you do the boring work.',
      'A thing you built two years ago is still standing.',
      'You hold a boundary without explaining it.',
      'The slow plant of February shows a leaf.',
      'A long-stalled meeting finally happens. It was worth waiting for.',
      'You are praised in writing. Save the email.',
      'A small structural fix. Big downstream effect.'
    ],
    closers: [
      'Stop working. Genuinely. Sleep.',
      'Close the laptop. The week is long.',
      'Tomorrow will still be Wednesday.',
      'A small celebration, in private, of the thing nobody noticed.',
      'You are allowed to be done at six.',
      'You did the work. Now do nothing.',
      'A short walk after dinner.',
      'Read for pleasure for ten minutes.',
      'Set the alarm later than you want to.',
      'A glass of water. Sleep.',
      'You earned a quiet evening. Take it.',
      'You will be fine. You usually are. Sleep.'
    ]
  },
  {
    name: 'Aquarius', dates: 'Jan 20 to Feb 18', symbol: '♒',
    openers: [
      'A new idea before the coffee. Trust it.',
      'You wake up annoyed by a thing you used to tolerate. Good.',
      'A small experiment is in order today.',
      'You change the route. The change holds.',
      'You see the system clearly. Most people do not.',
      'A morning that wants you to work alone for an hour.',
      'You start writing a thing you have been thinking about for months.',
      'A long-held opinion shifts. You are kinder for it.',
      'You make a small plan that improves three other people\'s days.',
      'Today rewards the long view.',
      'A weird connection between two old conversations clicks.',
      'You delete an app. The morning is faster.'
    ],
    middles: [
      'A friend takes your strange idea seriously.',
      'You meet a stranger who is doing the thing you almost did.',
      'A community thing you signed up for in March pays out.',
      'You change your mind in public. You are respected for it.',
      'You hold an unpopular position correctly.',
      'A long-running group thread bears actual fruit.',
      'You are reminded a network is just a long memory.',
      'You give a recommendation that becomes someone\'s month.',
      'A small revolution at work, instigated by you, in writing.',
      'You vote in the small election. It actually matters.',
      'You pay a friend back faster than promised.',
      'You realize you have been right about a small thing all year.'
    ],
    closers: [
      'Stop reading. The internet will be there.',
      'A long shower. A book on paper.',
      'You did the small revolutionary act. Now sleep.',
      'No new tabs after nine.',
      'The day was good. Stop tinkering.',
      'A walk around the block before bed.',
      'You were curious enough today. Rest.',
      'Set the phone in the kitchen. Sleep.',
      'A glass of water. A long sleep.',
      'Write the idea down. Sleep on it.',
      'Tomorrow is for the next experiment.',
      'Quiet now. Sleep.'
    ]
  },
  {
    name: 'Pisces', dates: 'Feb 19 to Mar 20', symbol: '♓',
    openers: [
      'A dream you cannot quite recall sets the day\'s tone.',
      'The morning is a little more porous than usual. Lean in.',
      'You wake up with the right song in your head.',
      'A small thing in a window stops you on the way to work.',
      'You are kinder, today, than you can usually afford to be.',
      'The light is doing something interesting in the kitchen.',
      'You hear an old song and remember the year you lived in it.',
      'A poem you read once comes back, half-remembered, helpful.',
      'You wake up with a feeling you would rather not name. Let it be.',
      'A small ritual restores you. Do not skip it.',
      'You are softer this morning. The day will reward it.',
      'The morning is a cup of tea, slowly drunk.'
    ],
    middles: [
      'A friend cries to you. You hold the room well.',
      'You write the long letter. You do not have to send it.',
      'You see a stranger doing a small kindness and the day improves.',
      'A song on the radio in the wrong room makes you cry, briefly. Fine.',
      'You forgive yourself for a thing you forgave yourself for last year.',
      'A long bath in the middle of the day. Earned.',
      'You see a pattern across years. It explains a lot.',
      'You make art that is only for you. Keep it that way.',
      'A scene from a book reorganizes a feeling.',
      'You take the long way home. The river was the right call.',
      'You feel everything at the right volume today.',
      'A friend\'s small problem becomes your large one for an hour. That is love.'
    ],
    closers: [
      'Sleep with a window cracked. The river is closer than it sounds.',
      'A short prayer to nothing in particular. Sleep.',
      'Write the dream down before you forget it.',
      'Stop being available. Sleep.',
      'You were soft today. Be soft to yourself.',
      'A glass of water and a long sleep.',
      'Cry if you need to. Then sleep.',
      'You did not need to fix it. Good.',
      'Set the phone face-down.',
      'A book of poems on the nightstand.',
      'The day was full. Empty it.',
      'Sleep finds the people who let it.'
    ]
  }
];

function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  return Math.floor(diff / 86400000);
}

function generateForDate(date) {
  const isoDate = date.toISOString().slice(0, 10);
  const doy = dayOfYear(date);
  const horoscopes = SIGNS.map((sign, idx) => {
    const seed = hash(`${isoDate}:${sign.name}`);
    const rng = mulberry32(seed);
    const opener = pick(sign.openers, rng);
    const middle = pick(sign.middles, rng);
    const closer = pick(sign.closers, rng);
    // Weather/place lines are optional, used about half the time, with a
    // separate rng draw so they do not crowd every entry.
    const useWeather = rng() < 0.45;
    const usePlace = rng() < 0.4 && !useWeather;
    let context = '';
    if (useWeather) context = ` Outside, ${pick(WEATHER, rng)}.`;
    else if (usePlace) context = ` Somewhere near ${pick(PLACES, rng)}.`;
    const text = `${opener} ${middle}${context} ${closer}`;
    return {
      sign: sign.name,
      symbol: sign.symbol,
      dates: sign.dates,
      text,
      slug: sign.name.toLowerCase()
    };
  });

  return {
    date: isoDate,
    generated_at: new Date().toISOString(),
    intro: 'A daily reading for the metro, mood-pieces more than predictions. Refreshed each morning.',
    horoscopes
  };
}

function main() {
  const data = generateForDate(new Date());
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log(`  → wrote horoscope.json for ${data.date} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
}

if (require.main === module) main();

module.exports = { generateForDate };
