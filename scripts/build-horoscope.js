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
  'the Stone Arch Bridge', 'the river path at Hidden Falls', 'a back booth at Barbette',
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
// Voice: warm, observational, second person, true and kind and optimistic.
// Minnesota-grounded, specific, no jargon, no heavy weather emotionally.
const SIGNS = [
  {
    name: 'Aries', dates: 'Mar 21 to Apr 19', symbol: '♈',
    openers: [
      'You woke up with a list and the list got smaller before you finished coffee.',
      'Something you were putting off turns out to take eleven minutes.',
      'A good morning and a better afternoon, in that order.',
      'You are, today, the most useful person within a one-block radius.',
      'Energy you usually save for Thursday shows up early.',
      'A door opens because you remembered to push it.',
      'You are quicker than the room expects and the room appreciates it.',
      'The plan you made on Sunday holds up beautifully.',
      'Restlessness, but it goes somewhere good.',
      'You start the day with a clear head and the rest follows.',
      'Something you have been building is almost ready.',
      'You know what you want today and that is half the work.'
    ],
    middles: [
      'A short conversation rearranges the rest of the week, for the better.',
      'Something a friend says, in passing, lands exactly right.',
      'You catch yourself enjoying the part you usually rush.',
      'An old tension releases without ceremony.',
      'You are asked a question you have a good answer to.',
      'A small win in the middle of a busy week.',
      'You change your mind about something and feel lighter for it.',
      'Patience pays out at a rate you would not have predicted.',
      'The right person arrives at the right time.',
      'A favor offered freely comes back the same way.',
      'You hear yourself laugh and it sounds easy.',
      'Someone you respect quietly takes your side.'
    ],
    closers: [
      'Rest early. Tomorrow already has good plans for you.',
      'A short walk around the block does more than you would think.',
      'You earned a slow evening. Take it.',
      'Leave one thing for tomorrow. The world will hold.',
      'Read something on paper before bed.',
      'Notice what calmed you today. File it away.',
      'A long exhale, an open window, a closed laptop.',
      'Tomorrow is closer than it feels and it is going to be good.',
      'The kitchen, the couch, the quiet hour — pick one.',
      'A good day deserves a gentle landing.',
      'Rest comes easily to someone who worked well.',
      'Sleep well. You did good work today.'
    ]
  },
  {
    name: 'Taurus', dates: 'Apr 20 to May 20', symbol: '♉',
    openers: [
      'You are slow today and that is exactly the right speed.',
      'The morning tastes like the coffee you made carefully.',
      'A meal stretches longer than scheduled and is better for it.',
      'You move through the day like someone who knows where the shortcuts are.',
      'Comfort, today, is not a guilty pleasure. It is a tool.',
      'The radio plays the song you needed to hear.',
      'A small purchase you have been thinking about turns out to be worth it.',
      'You catch up on the kind of rest that does not show up in a calendar.',
      'Slowness makes you better at noticing.',
      'A familiar room becomes interesting again.',
      'The body is right about what it needs today. Listen to it.',
      'You move with ease and the day opens up.'
    ],
    middles: [
      'Someone says something kind in a way that lasts.',
      'You decide a thing is good enough and move on with confidence.',
      'A long phone call with someone who knows you all the way back.',
      'A small purchase you considered for weeks justifies itself completely.',
      'Money behaves predictably. Enjoy it.',
      'A friend cooks for you, or you for them.',
      'You finish a book you started in March. Good ending.',
      'A gift you did not ask for arrives.',
      'You realize you have grown past something you used to hold onto.',
      'A craving turns out to be hunger, then the right meal.',
      'You take a longer route home and notice three good things.',
      'The afternoon has a warmth to it you did not expect.'
    ],
    closers: [
      'A long bath, an old movie, an early sleep.',
      'Light one candle and let the evening be easy.',
      'Open the windows. You will sleep well.',
      'A pot of tea, a quilt, a closed door.',
      'A walk after dinner. Slow.',
      'Sleep when you are tired, not when the clock says.',
      'Plan tomorrow\'s breakfast tonight. Small joys compound.',
      'The day is over. It was enough and then some.',
      'You were present today. That is everything.',
      'A good book and a quiet room — the best combination.',
      'Rest deserves the same care you give everything else.',
      'Close the day gently. It was a good one.'
    ]
  },
  {
    name: 'Gemini', dates: 'May 21 to Jun 20', symbol: '♊',
    openers: [
      'The brain is bright today and most of it is useful.',
      'You change your mind twice before nine and arrive at the right answer by ten.',
      'A draft email writes itself if you sit still for five minutes.',
      'You overhear something on the bus that makes the day better.',
      'Words come easy. The right ones arrive first.',
      'A coincidence that turns out to mean something.',
      'You read three things in a row that say the same thing differently.',
      'Today, the small talk is genuinely good.',
      'The morning has more options than yesterday and you use them well.',
      'You finish a sentence someone else started, correctly.',
      'A page-turner of a Tuesday.',
      'Something you almost forgot to mention turns out to be the most important thing.'
    ],
    middles: [
      'A friend calls back faster than expected and the conversation is good.',
      'You meet someone twice in one day, in two different rooms. A sign.',
      'A long-stalled conversation finally moves forward.',
      'You tell a story better than you have ever told it.',
      'You learn something new and it fits perfectly with what you already know.',
      'A question you asked in March gets answered at last.',
      'You are funny in the meeting. The right people notice.',
      'Two people who do not know each other recommend the same thing to you.',
      'A text thread comes back to life with good news.',
      'Someone you had not thought of in a while resurfaces with warmth.',
      'You finish reading something that shifts how you see a thing.',
      'A rumor turns out to be better than the original story.'
    ],
    closers: [
      'Quiet, finally. Lean all the way into it.',
      'Write one good thing down before you sleep.',
      'A short note to a long-distance friend.',
      'Pick the book on the top of the stack.',
      'The night is for listening, and for rest.',
      'You did enough. Let the day close.',
      'A glass of water and a long, easy sleep.',
      'Put the phone face-down. Sleep finds you faster that way.',
      'Tomorrow has its own good things. Rest.',
      'The ideas will still be there in the morning.',
      'You made something happen today. That deserves rest.',
      'A quiet close to a full day.'
    ]
  },
  {
    name: 'Cancer', dates: 'Jun 21 to Jul 22', symbol: '♋',
    openers: [
      'A morning that asks for soft clothes and soft food and delivers.',
      'The kitchen does most of the good work today.',
      'You are reminded who you are by an old photograph and it is a good reminder.',
      'The right voice on the phone first thing sets the whole day.',
      'A familiar room becomes the best place to be.',
      'You feel everything clearly today, which is a gift.',
      'A person you love reaches out before you do.',
      'The weather and your mood are in easy agreement.',
      'A quiet kind of confidence arrives without being asked.',
      'The first hour belongs to whoever you live with, and it is warm.',
      'You move slowly and arrive exactly on time.',
      'The morning is gentle and the day follows its lead.'
    ],
    middles: [
      'A meal with one other person does most of the good this week.',
      'You make peace with something, quietly and completely.',
      'A small kindness from a stranger brightens the whole morning.',
      'The friend who is usually hard to reach is reachable and glad you called.',
      'You let yourself want what you actually want, fully.',
      'You catch yourself being soft with someone and it is exactly right.',
      'A long conversation in the kitchen, leaning on the counter, the best kind.',
      'A gift you forgot you sent gets thanked for, warmly.',
      'A photograph shows you how much you have grown.',
      'The right person finds their way to you.',
      'You say the thing out loud and it loses its weight entirely.',
      'The afternoon has more warmth in it than the forecast suggested.'
    ],
    closers: [
      'A bath, a candle, an early and easy sleep.',
      'Call someone you love. It will be a good call.',
      'Cook the thing that takes two hours. You have the time.',
      'Make the bed before you get into it. Small ritual, big comfort.',
      'Tea and a good book and the window cracked.',
      'A handwritten note before sleep.',
      'You did beautifully today. Rest in that.',
      'Soft sheets and the deep sleep you earned.',
      'Open the window an inch. The night air is kind.',
      'The day was full of good things. Let it close gently.',
      'Rest comes easily to people who gave well today.',
      'A long sigh, a clean pillow, the lamp off.'
    ]
  },
  {
    name: 'Leo', dates: 'Jul 23 to Aug 22', symbol: '♌',
    openers: [
      'You walk into the room and the room lifts.',
      'Today is the kind of day people remember you well on.',
      'A photograph someone takes of you, candidly, comes out beautifully.',
      'You wear the thing you usually save. Good call.',
      'A small audience finds you and you are generous with them.',
      'Compliments arrive. Receive them gracefully.',
      'A door opens because you walked toward it.',
      'You are exactly the right amount of loud today.',
      'Someone you hoped would notice you, notices.',
      'A morning that calls for the better coat and the better entrance.',
      'The light is on you today. You are ready for it.',
      'Something you have been working toward is starting to show.'
    ],
    middles: [
      'A friend asks for advice and your advice is genuinely useful.',
      'You make a stranger laugh in line for coffee and they remember it all day.',
      'A small generosity comes back bigger than it left.',
      'Someone you have not seen in a year gets in touch with good news.',
      'A meeting you were uncertain about ends with you being thanked.',
      'You tell the truth and it lands well.',
      'People say kind things about you when you are not in the room.',
      'You hold the door for the right person at the right moment.',
      'A kindness, freely given, becomes the best part of someone\'s day.',
      'You apologize for a small thing and it clears a bigger space.',
      'Someone notices and says so.',
      'Your presence today is the thing that made the room work.'
    ],
    closers: [
      'Big today, peaceful tonight.',
      'Enjoy the leftover warmth of a day well lived.',
      'Sleep with the window open if you can.',
      'You were generous today. Be generous to yourself, too.',
      'Tomorrow is a quieter stage. Rest is the preparation.',
      'A long shower and an early, satisfying sleep.',
      'Write down what made today good. It was several things.',
      'The day was full. Sleep is the best encore.',
      'A glass of water. A long sleep. You earned both.',
      'You did the work and it showed. Rest now.',
      'A good day deserves a soft close.',
      'Tomorrow is already looking good. Sleep well.'
    ]
  },
  {
    name: 'Virgo', dates: 'Aug 23 to Sep 22', symbol: '♍',
    openers: [
      'A clean morning. The list cooperates completely.',
      'You catch a small thing before it grows and the day is smoother for it.',
      'You are correct about a thing you were almost uncertain about.',
      'Order, today, is its own reward and it arrives early.',
      'You finish the email that has been sitting in drafts since Sunday. Relief.',
      'A small repair, twenty minutes, large and satisfying gain.',
      'The morning is quiet because you made it that way.',
      'You make the bed and the day improves measurably.',
      'You discover the missing thing in the most logical place.',
      'Today you are exceptionally good at the parts that matter.',
      'You arrive early and use the time well.',
      'Everything runs on time today and you made that happen.'
    ],
    middles: [
      'The systems hold. Everything is where it should be.',
      'You write clearly and the writing does its job.',
      'A friend asks for your help with the exact thing you are best at.',
      'A long email gets a short, kind, perfectly calibrated reply.',
      'You remember the name and the details and it matters.',
      'A satisfying pile of small things, finished.',
      'You catch a price drop. Small win, real money.',
      'You solve the thing you have been thinking about and the answer is elegant.',
      'A coworker thanks you for something you did without being asked.',
      'A meeting ends early because you prepared so well.',
      'You write the list and immediately do the first three items.',
      'Something you put in place quietly starts paying dividends.'
    ],
    closers: [
      'The kitchen is clean. The day is complete.',
      'Tomorrow\'s bag, packed tonight. Morning-you will be grateful.',
      'You were thorough today. Rest thoroughly.',
      'A long shower. A short and optimistic list for tomorrow.',
      'Fold the laundry, then close the day with satisfaction.',
      'You did enough. More than enough, genuinely.',
      'Quiet, water, sleep. In that satisfying order.',
      'Set the alarm slightly later than you think. You earned it.',
      'You know what you need. You gave it to yourself today. Sleep.',
      'Everything is in order. The night is yours.',
      'Close the day the way you close a good file: complete.',
      'Rest well. Tomorrow has good work waiting.'
    ]
  },
  {
    name: 'Libra', dates: 'Sep 23 to Oct 22', symbol: '♎',
    openers: [
      'You wake up gentler than you were yesterday and the day responds.',
      'The morning has a beautiful symmetry to it.',
      'You make the choice you have been sitting with. It is the right one.',
      'Beauty, today, shows up everywhere you look.',
      'A tension resolves itself before you arrive and the room is easy.',
      'You are fair with yourself first thing. The rest of the day follows.',
      'A flower in a window catches you off guard and you stop to look.',
      'You wear the thing that goes with everything and feel completely at ease.',
      'You are kind to a stranger and it ripples outward.',
      'Light through curtains. The day announces itself softly and well.',
      'A morning that flatters everyone in it, including you.',
      'Things fall into balance today the way they sometimes do.'
    ],
    middles: [
      'A long-stalled compromise reaches a natural and good shape.',
      'You give honest feedback and the friendship grows from it.',
      'A meeting finds the solution everyone needed.',
      'You decline an invitation gracefully and both parties feel relief and warmth.',
      'You see both sides clearly and choose the right one with confidence.',
      'A small change to the space makes everything feel better.',
      'You make the room nicer for the next person in it, without being asked.',
      'A second opinion lines up with your own and you trust yourself.',
      'You eat something good and take a moment to notice it.',
      'You are recognized, deservedly, in a way that sticks.',
      'You extend grace to yourself for something old and it feels right.',
      'The afternoon finds a beautiful equilibrium.'
    ],
    closers: [
      'Lights low. Music low. Sleep early and well.',
      'Set the table for tomorrow\'s breakfast. A small act of care.',
      'A long quiet evening with the right book.',
      'Sleep is its own kind of fairness, and you deserve it.',
      'A bath, then bed. The ideal sequence.',
      'Light a candle. Read for ten minutes. Sleep.',
      'You found balance today. Carry it into tomorrow.',
      'You were the steady one. Sleep gently and well.',
      'A small good thing before sleep. Then real sleep.',
      'The day was beautiful in places. Rest in that.',
      'Tomorrow is already balanced. Sleep.',
      'A soft close to a graceful day.'
    ]
  },
  {
    name: 'Scorpio', dates: 'Oct 23 to Nov 21', symbol: '♏',
    openers: [
      'You see what other people miss this morning. You use it well.',
      'A long game you have been playing moves forward today.',
      'You arrive somewhere with exactly the perspective the room needs.',
      'A small loyalty pays back, today, in a way you did not expect but deserve.',
      'You hold steady when others shift. This is your gift.',
      'Today is for the deep work. You are built for it.',
      'You understand people clearly and use that understanding with care.',
      'A favor you did months ago returns with interest.',
      'A door you thought was closed opens completely.',
      'Quiet strength, well held and well spent.',
      'You see the pattern others are still looking for.',
      'Something you committed to a long time ago is about to pay off.'
    ],
    middles: [
      'A long silence breaks in your favor.',
      'You discover what you actually want and it turns out to be within reach.',
      'You finish something that was years in the making. It is good.',
      'A stranger says the clarifying thing and you receive it well.',
      'You are trusted with something important. You handle it with care.',
      'You release something you have been carrying and feel the difference.',
      'A boundary you held quietly is finally seen and respected.',
      'A long story reaches the conclusion it deserved.',
      'You are right about the thing and you carry it lightly.',
      'Something underneath the surface comes up into the light, gently.',
      'You make a connection no one else saw and it opens a door.',
      'The depth you bring to things is exactly what was needed today.'
    ],
    closers: [
      'Rest with the satisfaction of someone who saw clearly today.',
      'The night is yours. Use it peacefully.',
      'A long bath, a good book, a room that is yours.',
      'Whatever is unfinished will wait. Sleep.',
      'A glass of water on the nightstand. Trust the morning.',
      'You did the quiet work. The quiet rest follows.',
      'A long exhale and a closed laptop and sleep.',
      'You carried things well today. Put them down for the night.',
      'Rest is part of the long game too.',
      'Tomorrow the clarity continues. Sleep.',
      'You gave a great deal today. Restore yourself.',
      'The work was deep. The sleep will be too.'
    ]
  },
  {
    name: 'Sagittarius', dates: 'Nov 22 to Dec 21', symbol: '♐',
    openers: [
      'A morning that wants you outdoors, and delivers when you go.',
      'You wake up curious about something and it turns out to be worth it.',
      'Today rewards the version of you that left the house.',
      'A small detour pays out better than the direct route.',
      'You strike up a conversation with someone you did not need to and it is the best part of the day.',
      'The horizon is wider this morning, even from the kitchen window.',
      'A book in a free library on a corner you do not usually walk. Take it.',
      'The morning has an open door in it and you walk through.',
      'Something you almost did last summer is still waiting and still worth doing.',
      'You take the long road home and arrive better for it.',
      'An idea from somewhere unexpected turns out to be the right one.',
      'The world feels bigger today and that is a good feeling.'
    ],
    middles: [
      'A friend you have not talked to in a while reaches out and the conversation is real.',
      'You learn something the interesting way and the story becomes a good one.',
      'Someone gives you a recommendation that changes the month.',
      'A delay turns into time you needed.',
      'A book you started years ago finally makes complete sense.',
      'You tell a long story to a captive audience and they love every word.',
      'A small adventure inside the metro. Worth it.',
      'A conversation in line that goes somewhere genuinely good.',
      'A trip you had not planned starts assembling itself naturally.',
      'You realize you have outgrown something and feel free.',
      'You teach someone something useful without even trying.',
      'A long walk produces an idea that holds up all week.'
    ],
    closers: [
      'Sleep with the curtains open. The light tomorrow is worth seeing.',
      'You collected enough good things today. Sleep.',
      'Tomorrow is a longer road and you are ready for it. Rest.',
      'A glass of water and a window cracked and good sleep.',
      'Phone on quiet. The world can wait.',
      'A long exhale. The day delivered. Lights out.',
      'Tomorrow keeps all its good things. Sleep.',
      'Rest for the next adventure.',
      'The road ahead looks good. Rest now.',
      'You went somewhere today, even staying in one place. Sleep well.',
      'Good sleep for a person who moved through the day well.',
      'More to come. Rest first.'
    ]
  },
  {
    name: 'Capricorn', dates: 'Dec 22 to Jan 19', symbol: '♑',
    openers: [
      'You started the year quietly. Today the foundation shows and it is solid.',
      'A long-running project moves an inch. The inch matters and you know it.',
      'You make an early decision and the rest of the day rewards it.',
      'You wake up with a clear head and a strong sense of what matters.',
      'Patient work is compounding. Today you see some of the interest.',
      'You are the steady one in the room today. It is what the room needs.',
      'A small administrative win, dispatched before lunch. The day opens up.',
      'You answer the email you had been sitting on. Easier than expected, better too.',
      'The morning is for the slow build and you are excellent at slow builds.',
      'The list shrinks. The shoulders lower.',
      'Something you invested in a long time ago is paying off now.',
      'You made the bed. The day starts right.'
    ],
    middles: [
      'A long-deferred conversation goes well, finally.',
      'Money behaves predictably. The math holds.',
      'You finish the part of the project no one else will notice, and it matters anyway.',
      'A mentor checks in, unprompted, with exactly the right words.',
      'You are reminded why you do the work that does not show.',
      'A thing you built years ago is still standing and still working.',
      'You hold steady and the situation resolves around you.',
      'The slow plant of an earlier season shows its first real growth.',
      'A meeting that was a long time coming goes exactly as it should.',
      'You are recognized for something real. Receive it fully.',
      'A small structural improvement that will matter for years.',
      'Everything you put in place is holding. That is not small.'
    ],
    closers: [
      'The work is done. Rest is the next right thing.',
      'A small private celebration of something only you know you accomplished.',
      'You are allowed to stop at a reasonable hour. Tonight is that hour.',
      'You did the work. Now do nothing, and enjoy it.',
      'A short walk after dinner. A good close to a productive day.',
      'Read something for pleasure. You have earned that.',
      'Set the alarm a little later than usual.',
      'A glass of water. Good sleep.',
      'You earned a quiet evening. It is yours.',
      'You will do well tomorrow too. But first, rest.',
      'Close the laptop. Everything will still be there, improved by morning.',
      'Sleep well. You built something today.'
    ]
  },
  {
    name: 'Aquarius', dates: 'Jan 20 to Feb 18', symbol: '♒',
    openers: [
      'A new idea before the coffee. Trust it.',
      'A small experiment is in order today and it is going to work.',
      'You change the route and the change is an improvement.',
      'You see the system clearly and know exactly what to do.',
      'A morning that rewards working alone for an hour first.',
      'You start writing something you have been thinking about and it flows.',
      'A long-held idea shifts into something better. Growth.',
      'You make a small plan that improves things for several people.',
      'Today rewards the long view and you have always had it.',
      'A connection between two old ideas finally clicks into place.',
      'You simplify something and it works better immediately.',
      'The thing you have been thinking about is ready to become real.'
    ],
    middles: [
      'A friend takes your strange idea seriously and it turns out to be a good one.',
      'You meet someone doing something you are interested in. Good conversation.',
      'Something you invested in a community pays out in a real way.',
      'You change your position based on new information and people respect you for it.',
      'You hold an unpopular position, correctly, and the room comes around.',
      'A long-running collaboration produces something genuinely good.',
      'You are reminded that a strong network is just years of showing up.',
      'You give a recommendation that genuinely changes someone\'s month.',
      'You speak up for something in writing and it lands.',
      'You show up for the small vote and it turns out to matter.',
      'You follow through faster than promised.',
      'You were right about the small thing all year and today it is confirmed.'
    ],
    closers: [
      'The internet will still be there. Rest first.',
      'A long shower. A book on paper. Good sleep.',
      'You made something happen today. Now rest.',
      'The day was good. Leave it good.',
      'A walk around the block before bed.',
      'You were curious and productive and kind. Rest.',
      'The next experiment will be there in the morning.',
      'Write the idea down. Sleep well knowing it is captured.',
      'Quiet now. The work continues tomorrow and it will be good.',
      'You changed something today. Rest in that.',
      'A glass of water. A long sleep. Well earned.',
      'Good sleep for a person who thought well today.'
    ]
  },
  {
    name: 'Pisces', dates: 'Feb 19 to Mar 20', symbol: '♓',
    openers: [
      'A dream you carry into the morning turns out to be useful.',
      'The morning is soft and porous and you are exactly right for it.',
      'You wake up with the right song already in your head.',
      'A small beautiful thing in a window stops you and you let it.',
      'You are generous today in a way that feels completely natural.',
      'The light in the kitchen is doing something remarkable.',
      'You hear an old song and remember a good year.',
      'A poem you half-remember comes back with what you needed.',
      'A small ritual restores you. You do not skip it.',
      'You are softer this morning and the day is better for it.',
      'The morning opens like a good book. Let it.',
      'You move through the world with more grace than usual today.'
    ],
    middles: [
      'A friend shares something real with you. You hold the room perfectly.',
      'You write the long letter. The writing alone does the work.',
      'You see a stranger do something kind and the day lifts.',
      'A song in another room reconnects you to something good.',
      'You give yourself real grace about something and mean it.',
      'You make something that is only for you. It is the right thing.',
      'A scene from a book reorganizes a feeling into something clear.',
      'You take the long way home and the river was absolutely the right call.',
      'You feel everything at the right volume today. It is a gift.',
      'You are present for someone who needed presence. That is everything.',
      'Something you made or said earlier finds its way back with warmth.',
      'The afternoon has a quality of light that you will remember.'
    ],
    closers: [
      'Sleep with a window cracked. The night air is gentle.',
      'Write down one beautiful thing before you sleep.',
      'You were open today. Rest in that openness.',
      'A glass of water and a long, deep sleep.',
      'A book of poems on the nightstand.',
      'The day was full of feeling and that is a good thing. Sleep.',
      'You gave a lot today. Receive rest in return.',
      'Let the day dissolve gently. It was a good one.',
      'Sleep finds the people who lived the day fully.',
      'You did not need to fix everything. You just needed to be present. You were.',
      'Rest as softly as you moved through the day.',
      'A quiet close to a full and feeling day.'
    ]
  }
];

// Returns the ISO 8601 week number and year for a given date.
function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

// Returns the Monday (week-start) date string for the week containing d.
function weekStartISO(d) {
  const date = new Date(d);
  const day = date.getDay() || 7; // 1=Mon … 7=Sun
  date.setDate(date.getDate() - day + 1);
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// "Week of June 9, 2026"
function weekLabel(d) {
  const monday = new Date(d);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  return monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function generateForDate(date) {
  const { year, week } = isoWeek(date);
  const weekKey = `${year}-W${String(week).padStart(2, '0')}`;
  const weekStart = weekStartISO(date);

  const horoscopes = SIGNS.map((sign) => {
    const seed = hash(`${weekKey}:${sign.name}`);
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
    date: weekStart,
    week: weekKey,
    week_label: `Week of ${weekLabel(date)}`,
    generated_at: new Date().toISOString(),
    intro: 'A weekly reading for the Twin Cities — grounded, kind, and written for where you actually live.',
    horoscopes
  };
}

function main() {
  // Anchor to Central time so the weekly horoscope rolls at Monday midnight Central.
  const central = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const data = generateForDate(central);
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log(`  → wrote horoscope.json for ${data.week} (week of ${data.date}, ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
}

if (require.main === module) main();

module.exports = { generateForDate };
