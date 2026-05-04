/**
 * The Minneapolis Skyway — a curated guide and a small router.
 *
 * The downtown skyway is the largest enclosed second-story pedestrian
 * network in the world (about 9.5 miles, 80+ blocks, 60+ buildings). For
 * locals it is a winter superpower; for tourists it is a maze.
 *
 * What we publish here is not a complete graph (the official network
 * changes constantly with private-building closures), but a hand-picked
 * list of the major nodes a visitor would need to navigate the central
 * grid: from Target Field on the west to US Bank Stadium on the east,
 * and from the river to the convention center.
 *
 * Each node carries lat/lng so we can plot it; each connection is a
 * named link to another node so we can render the network as a small
 * adjacency list. A simple BFS in the client gives a usable route.
 *
 * Hours and access notes are deliberately editorial, not promised. The
 * skyway is private property; the schedule is at the discretion of each
 * building owner.
 */
module.exports = {
  slug: 'skyway',
  title: 'The Skyway',
  subtitle: 'A short navigator for the largest indoor pedestrian network in the country.',
  intro: 'Downtown Minneapolis has roughly nine and a half miles of climate-controlled second-story walkways linking sixty-plus buildings. In January it is a superpower. The official map updates constantly because the schedule of every segment is set by the building that owns it. What follows is the central spine, the buildings most worth knowing, and a small router to get from one to another without going outside.',
  hero_color: 'midnight',

  // Standard skyway hours: weekdays 6am-10pm, Saturdays 11am-6pm, closed
  // most Sundays. Individual buildings vary. We list a handful of common
  // exceptions for the well-trafficked nodes.
  hours_general: 'Weekdays 6 AM to 10 PM. Saturdays 11 AM to 6 PM. Most segments closed Sundays.',

  nodes: [
    // ===== West end =====
    { id: 'target-field',     name: 'Target Field',          neighborhood: 'Warehouse District',     lat: 44.9817, lng: -93.2776, note: 'Skyway runs from the Target Field LRT station east into the warehouse district.' },
    { id: 'target-center',    name: 'Target Center',         neighborhood: 'Warehouse District',     lat: 44.9795, lng: -93.2762, note: 'Sports arena. Skyway connects to the Hennepin Avenue corridor.' },
    { id: 'butler-square',    name: 'Butler Square',         neighborhood: 'Warehouse District',     lat: 44.9806, lng: -93.2747, note: 'Historic warehouse building, ground-floor restaurants.' },

    // ===== North Loop / first ave =====
    { id: 'first-bank',       name: 'First Bank Building',   neighborhood: 'Downtown core',          lat: 44.9783, lng: -93.2706, note: 'Central skyway hub.' },

    // ===== Central spine: Nicollet =====
    { id: 'cancer-survivors', name: 'Cancer Survivors Park', neighborhood: 'Downtown core',          lat: 44.9760, lng: -93.2750, note: 'Open-air gap. Walk a block at street level.' },
    { id: 'gaviidae',         name: 'Gaviidae Common',       neighborhood: 'Nicollet Mall',          lat: 44.9784, lng: -93.2706, note: 'Indoor mall, open weekdays only.' },
    { id: 'wells-fargo',      name: 'Wells Fargo Center',    neighborhood: 'Nicollet Mall',          lat: 44.9772, lng: -93.2705, note: 'The pyramid. Major skyway node, food court on the second level.' },
    { id: 'ids-center',       name: 'IDS Crystal Court',     neighborhood: 'Nicollet Mall',          lat: 44.9762, lng: -93.2716, note: 'The center of the entire system. Open ceiling, restaurants, the most photographed atrium downtown.' },
    { id: 'dayton-radisson',  name: 'The Dayton (Radisson)', neighborhood: 'Nicollet Mall',          lat: 44.9763, lng: -93.2729, note: 'Former Dayton’s building, now a hotel and offices.' },
    { id: 'foshay',           name: 'Foshay Tower',          neighborhood: 'Nicollet Mall',          lat: 44.9755, lng: -93.2719, note: 'The 32-story 1929 landmark. W Hotel inside, observation deck on top, base of the Marquette.' },
    { id: 'capella-tower',    name: 'Capella Tower',         neighborhood: 'Nicollet Mall',          lat: 44.9762, lng: -93.2693, note: 'Major office tower. Skyway hub for the financial district.' },

    // ===== Library + Hennepin =====
    { id: 'central-library',  name: 'Hennepin County Central Library', neighborhood: 'Downtown core', lat: 44.9785, lng: -93.2695, note: 'The Cesar Pelli library. Free, public, the best free thing downtown. Skyway in.' },
    { id: 'orchestra-hall',   name: 'Orchestra Hall',        neighborhood: 'Loring Park',            lat: 44.9706, lng: -93.2745, note: 'Skyway from the Hilton/convention center side.' },
    { id: 'convention-ctr',   name: 'Minneapolis Convention Center', neighborhood: 'Downtown core',  lat: 44.9696, lng: -93.2747, note: 'Massive complex. Skyway connects via the Hilton.' },
    { id: 'hilton',           name: 'Hilton Minneapolis',    neighborhood: 'Downtown core',          lat: 44.9714, lng: -93.2731, note: 'Convention center hotel. Pivot point south.' },

    // ===== Government + east =====
    { id: 'government-plaza', name: 'Government Plaza',      neighborhood: 'Downtown core',          lat: 44.9763, lng: -93.2655, note: 'County and city offices. Light Rail station at street level.' },
    { id: 'us-bank-plaza',    name: 'U.S. Bank Plaza',       neighborhood: 'Downtown core',          lat: 44.9776, lng: -93.2666, note: 'Major office tower. Hub for east-side connections.' },
    { id: 'campbell-mithun',  name: 'Campbell Mithun Tower', neighborhood: 'Downtown core',          lat: 44.9787, lng: -93.2693, note: 'Office building, base for the eastern skyway routes.' },
    { id: 'centerpoint',      name: 'CenterPoint Energy Tower', neighborhood: 'Downtown core',       lat: 44.9783, lng: -93.2671, note: 'Office tower with a long skyway corridor toward the river.' },
    { id: 'guthrie',          name: 'Guthrie Theater',       neighborhood: 'Mill District',          lat: 44.9787, lng: -93.2562, note: 'Frank Gehry building above the river. The skyway does not reach here, but it is a 5-block walk from US Bank Stadium.' },

    // ===== Stadium and east end =====
    { id: 'us-bank-stadium',  name: 'U.S. Bank Stadium',     neighborhood: 'Downtown East',          lat: 44.9737, lng: -93.2581, note: 'Vikings stadium. East end of the skyway system.' },
    { id: 'downtown-east-lrt', name: 'Downtown East LRT',    neighborhood: 'Downtown East',          lat: 44.9745, lng: -93.2607, note: 'Light rail station at the foot of the stadium.' },
    { id: 'commons',          name: 'The Commons',           neighborhood: 'Downtown East',          lat: 44.9748, lng: -93.2607, note: 'Green public space across from the stadium.' }
  ],

  // Adjacency list. Edges are bi-directional; we list each only once.
  // Approximate walking minutes for a healthy adult.
  edges: [
    ['target-field',     'target-center',    3],
    ['target-center',    'butler-square',    2],
    ['butler-square',    'first-bank',       3],
    ['first-bank',       'gaviidae',         2],
    ['first-bank',       'campbell-mithun',  2],
    ['gaviidae',         'wells-fargo',      2],
    ['gaviidae',         'central-library',  3],
    ['wells-fargo',      'ids-center',       1],
    ['ids-center',       'dayton-radisson',  1],
    ['ids-center',       'foshay',           2],
    ['ids-center',       'capella-tower',    2],
    ['dayton-radisson',  'foshay',           1],
    ['foshay',           'capella-tower',    2],
    ['capella-tower',    'us-bank-plaza',    2],
    ['us-bank-plaza',    'campbell-mithun',  2],
    ['us-bank-plaza',    'government-plaza', 2],
    ['government-plaza', 'centerpoint',      2],
    ['centerpoint',      'us-bank-stadium',  6],
    ['government-plaza', 'us-bank-stadium',  6],
    ['hilton',           'convention-ctr',   2],
    ['hilton',           'orchestra-hall',   3],
    ['hilton',           'capella-tower',    4],
    ['us-bank-stadium',  'downtown-east-lrt', 2],
    ['downtown-east-lrt','commons',          1]
  ],

  // Curated tips that don't fit on the map but matter.
  tips: [
    'Phone signal in the skyway can be spotty. Pre-load anything you need.',
    'On Sundays most segments are closed. Plan your indoor walk for a weekday or Saturday afternoon.',
    'The IDS Crystal Court is the easiest landmark to give as a meeting point. Everyone downtown knows it.',
    'During a Vikings game the U.S. Bank Stadium end is jammed. Enter from the west.',
    'The skyway is private property. Quiet hours, no soliciting, security can ask you to leave.'
  ]
};
