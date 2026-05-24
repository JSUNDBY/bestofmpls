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
  subtitle: 'A navigator for the largest indoor pedestrian networks in the country — both downtowns.',
  intro: 'Two cities, two skyway systems. Downtown Minneapolis has roughly 9.5 miles linking 60+ buildings — the largest enclosed second-story pedestrian network in the world. Downtown Saint Paul has about 5 miles linking 25+ buildings, tighter and grittier, anchored by Union Depot on the east. The actual segment geometry on the map below is pulled from OpenStreetMap (which the City of Lakes ArcGIS app and skywayaccess.com both source from). Individual segments open and close at the discretion of the building that owns them, so consider the network probabilistic in practice — but the corridors below are the ones worth knowing.',
  hero_color: 'midnight',

  // Standard skyway hours: weekdays 6am-10pm, Saturdays 11am-6pm, closed
  // most Sundays. Individual buildings vary. We list a handful of common
  // exceptions for the well-trafficked nodes.
  hours_general: 'Weekdays 6 AM to 10 PM. Saturdays 11 AM to 6 PM. Most segments closed Sundays.',

  // Curated key nodes — the buildings worth knowing in each downtown.
  // Each node carries city: 'minneapolis' | 'saintpaul' so the map can
  // toggle and the routing groups them correctly.
  nodes: [
    // ===== West end =====
    { id: 'target-field', city: 'minneapolis',     name: 'Target Field',          neighborhood: 'Warehouse District',     lat: 44.9817, lng: -93.2776, note: 'Skyway runs from the Target Field LRT station east into the warehouse district.' },
    { id: 'target-center', city: 'minneapolis',    name: 'Target Center',         neighborhood: 'Warehouse District',     lat: 44.9795, lng: -93.2762, note: 'Sports arena. Skyway connects to the Hennepin Avenue corridor.' },
    { id: 'butler-square', city: 'minneapolis',    name: 'Butler Square',         neighborhood: 'Warehouse District',     lat: 44.9806, lng: -93.2747, note: 'Historic warehouse building, ground-floor restaurants.' },

    // ===== North Loop / first ave =====
    { id: 'first-bank', city: 'minneapolis',       name: 'First Bank Building',   neighborhood: 'Downtown core',          lat: 44.9783, lng: -93.2706, note: 'Central skyway hub.' },

    // ===== Central spine: Nicollet =====
    { id: 'cancer-survivors', city: 'minneapolis', name: 'Cancer Survivors Park', neighborhood: 'Downtown core',          lat: 44.9760, lng: -93.2750, note: 'Open-air gap. Walk a block at street level.' },
    { id: 'gaviidae', city: 'minneapolis',         name: 'Gaviidae Common',       neighborhood: 'Nicollet Mall',          lat: 44.9784, lng: -93.2706, note: 'Indoor mall, open weekdays only.' },
    { id: 'wells-fargo', city: 'minneapolis',      name: 'Wells Fargo Center',    neighborhood: 'Nicollet Mall',          lat: 44.9772, lng: -93.2705, note: 'The pyramid. Major skyway node, food court on the second level.' },
    { id: 'ids-center', city: 'minneapolis',       name: 'IDS Crystal Court',     neighborhood: 'Nicollet Mall',          lat: 44.9762, lng: -93.2716, note: 'The center of the entire system. Open ceiling, restaurants, the most photographed atrium downtown.' },
    { id: 'dayton-radisson', city: 'minneapolis',  name: 'The Dayton (Radisson)', neighborhood: 'Nicollet Mall',          lat: 44.9763, lng: -93.2729, note: 'Former Dayton’s building, now a hotel and offices.' },
    { id: 'foshay', city: 'minneapolis',           name: 'Foshay Tower',          neighborhood: 'Nicollet Mall',          lat: 44.9755, lng: -93.2719, note: 'The 32-story 1929 landmark. W Hotel inside, observation deck on top, base of the Marquette.' },
    { id: 'capella-tower', city: 'minneapolis',    name: 'Capella Tower',         neighborhood: 'Nicollet Mall',          lat: 44.9762, lng: -93.2693, note: 'Major office tower. Skyway hub for the financial district.' },

    // ===== Library + Hennepin =====
    { id: 'central-library', city: 'minneapolis',  name: 'Hennepin County Central Library', neighborhood: 'Downtown core', lat: 44.9785, lng: -93.2695, note: 'The Cesar Pelli library. Free, public, the best free thing downtown. Skyway in.' },
    { id: 'orchestra-hall', city: 'minneapolis',   name: 'Orchestra Hall',        neighborhood: 'Loring Park',            lat: 44.9706, lng: -93.2745, note: 'Skyway from the Hilton/convention center side.' },
    { id: 'convention-ctr', city: 'minneapolis',   name: 'Minneapolis Convention Center', neighborhood: 'Downtown core',  lat: 44.9696, lng: -93.2747, note: 'Massive complex. Skyway connects via the Hilton.' },
    { id: 'hilton', city: 'minneapolis',           name: 'Hilton Minneapolis',    neighborhood: 'Downtown core',          lat: 44.9714, lng: -93.2731, note: 'Convention center hotel. Pivot point south.' },

    // ===== Government + east =====
    { id: 'government-plaza', city: 'minneapolis', name: 'Government Plaza',      neighborhood: 'Downtown core',          lat: 44.9763, lng: -93.2655, note: 'County and city offices. Light Rail station at street level.' },
    { id: 'us-bank-plaza', city: 'minneapolis',    name: 'U.S. Bank Plaza',       neighborhood: 'Downtown core',          lat: 44.9776, lng: -93.2666, note: 'Major office tower. Hub for east-side connections.' },
    { id: 'campbell-mithun', city: 'minneapolis',  name: 'Campbell Mithun Tower', neighborhood: 'Downtown core',          lat: 44.9787, lng: -93.2693, note: 'Office building, base for the eastern skyway routes.' },
    { id: 'centerpoint', city: 'minneapolis',      name: 'CenterPoint Energy Tower', neighborhood: 'Downtown core',       lat: 44.9783, lng: -93.2671, note: 'Office tower with a long skyway corridor toward the river.' },
    { id: 'guthrie', city: 'minneapolis',          name: 'Guthrie Theater',       neighborhood: 'Mill District',          lat: 44.9787, lng: -93.2562, note: 'Frank Gehry building above the river. The skyway does not reach here, but it is a 5-block walk from US Bank Stadium.' },

    // ===== Stadium and east end =====
    { id: 'us-bank-stadium', city: 'minneapolis',  name: 'U.S. Bank Stadium',     neighborhood: 'Downtown East',          lat: 44.9737, lng: -93.2581, note: 'Vikings stadium. East end of the skyway system.' },
    { id: 'downtown-east-lrt', city: 'minneapolis', name: 'Downtown East LRT',    neighborhood: 'Downtown East',          lat: 44.9745, lng: -93.2607, note: 'Light rail station at the foot of the stadium.' },
    { id: 'commons', city: 'minneapolis',          name: 'The Commons',           neighborhood: 'Downtown East',          lat: 44.9748, lng: -93.2607, note: 'Green public space across from the stadium.' },

    // ====================================================================
    //  SAINT PAUL
    //  ~5 miles of skyway linking 25+ downtown buildings. The system runs
    //  roughly from the Xcel Energy Center / RiverCentre on the west to
    //  Union Depot on the east, with the Wells Fargo Place / Town Square
    //  intersection as the central hub.
    // ====================================================================

    // ===== West end =====
    { id: 'stp-rivercentre',    city: 'saintpaul',  name: 'Saint Paul RiverCentre',    neighborhood: 'Downtown St. Paul',  lat: 44.9437, lng: -93.1009, note: 'Convention center attached to Xcel Energy Center. West entry point to the system.' },
    { id: 'stp-xcel',           city: 'saintpaul',  name: 'Xcel Energy Center',        neighborhood: 'Downtown St. Paul',  lat: 44.9447, lng: -93.1011, note: 'Home of the Wild and the Frost. Skyway in via the RiverCentre.' },
    { id: 'stp-stp-hotel',      city: 'saintpaul',  name: 'The Saint Paul Hotel',      neighborhood: 'Rice Park',          lat: 44.9447, lng: -93.0967, note: '1910 grand hotel on Rice Park. Skyway connects to Landmark Center and the Ordway.' },
    { id: 'stp-landmark',       city: 'saintpaul',  name: 'Landmark Center',           neighborhood: 'Rice Park',          lat: 44.9448, lng: -93.0976, note: 'The 1902 Federal Courts Building. Free, public, beautiful. Skyway entry from Rice Park.' },
    { id: 'stp-ordway',         city: 'saintpaul',  name: 'Ordway Center',             neighborhood: 'Rice Park',          lat: 44.9437, lng: -93.0973, note: 'Performing arts center. Skyway from the Saint Paul Hotel side.' },

    // ===== Central spine =====
    { id: 'stp-wells-fargo',    city: 'saintpaul',  name: 'Wells Fargo Place',         neighborhood: 'Downtown St. Paul',  lat: 44.9461, lng: -93.0944, note: 'St. Paul\'s tallest building (37 stories). Central skyway hub.' },
    { id: 'stp-town-square',    city: 'saintpaul',  name: 'Town Square',               neighborhood: 'Downtown St. Paul',  lat: 44.9469, lng: -93.0954, note: 'Office and retail complex with the indoor park on top. Central pivot.' },
    { id: 'stp-cray-plaza',     city: 'saintpaul',  name: 'Cray Plaza',                neighborhood: 'Downtown St. Paul',  lat: 44.9461, lng: -93.0963, note: 'Formerly Galtier Plaza. Office tower at the north end of Mears Park.' },
    { id: 'stp-us-bank-center', city: 'saintpaul',  name: 'U.S. Bank Center',          neighborhood: 'Downtown St. Paul',  lat: 44.9463, lng: -93.0938, note: 'Major office tower; skyway hub for the east side.' },
    { id: 'stp-lowry',          city: 'saintpaul',  name: 'Lowry Building',            neighborhood: 'Downtown St. Paul',  lat: 44.9470, lng: -93.0968, note: 'Historic 1912 office building, restaurants on the ground floor.' },
    { id: 'stp-hamm',           city: 'saintpaul',  name: 'Hamm Building',             neighborhood: 'Downtown St. Paul',  lat: 44.9454, lng: -93.0958, note: 'Beaux-Arts office building on St. Peter Street.' },

    // ===== Civic + east end =====
    { id: 'stp-city-hall',      city: 'saintpaul',  name: 'St. Paul City Hall',        neighborhood: 'Downtown St. Paul',  lat: 44.9438, lng: -93.0953, note: 'The 1932 Art Deco City Hall and Ramsey County Courthouse. Skyway in.' },
    { id: 'stp-mears-park',     city: 'saintpaul',  name: 'Mears Park',                neighborhood: 'Lowertown, St. Paul',lat: 44.9483, lng: -93.0894, note: 'Open green square in Lowertown. Surrounding buildings connect to the skyway.' },
    { id: 'stp-union-depot',    city: 'saintpaul',  name: 'Union Depot',               neighborhood: 'Lowertown, St. Paul',lat: 44.9479, lng: -93.0859, note: 'The 1923 transit hub. East end of the system. Amtrak, Metro Transit, the Forever Saint Paul Lite-Brite mural in the concourse.' }
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
    ['downtown-east-lrt','commons',          1],

    // ===== Saint Paul edges =====
    ['stp-rivercentre',  'stp-xcel',          1],
    ['stp-rivercentre',  'stp-stp-hotel',     4],
    ['stp-stp-hotel',    'stp-landmark',      2],
    ['stp-stp-hotel',    'stp-ordway',        2],
    ['stp-landmark',     'stp-hamm',          2],
    ['stp-hamm',         'stp-town-square',   3],
    ['stp-town-square',  'stp-lowry',         1],
    ['stp-town-square',  'stp-wells-fargo',   2],
    ['stp-town-square',  'stp-cray-plaza',    2],
    ['stp-wells-fargo',  'stp-us-bank-center',2],
    ['stp-wells-fargo',  'stp-city-hall',     3],
    ['stp-cray-plaza',   'stp-mears-park',    2],
    ['stp-mears-park',   'stp-union-depot',   4]
  ],

  // Curated tips that don't fit on the map but matter. Mixed Mpls/St Paul.
  tips: [
    'Phone signal in the skyway can be spotty. Pre-load anything you need.',
    'On Sundays most segments are closed in both cities. Plan your indoor walk for a weekday or a Saturday afternoon.',
    'In Minneapolis, the IDS Crystal Court is the easiest landmark to give as a meeting point. Everyone downtown knows it.',
    'In Saint Paul, Wells Fargo Place is the equivalent central hub. Town Square if you want a place to sit.',
    'During a Vikings game the U.S. Bank Stadium end is jammed. Enter from the west.',
    'During a Wild game (or Frost), the Xcel / RiverCentre west end of the St. Paul system fills fast. Park east and walk in from Union Depot.',
    'Both skyways are private property. Quiet hours, no soliciting, security can ask you to leave.',
    'The actual segment geometry on the map is from OpenStreetMap. Buildings open and close skyway access constantly; consider any single segment probabilistic until you walk through it.'
  ]
};
