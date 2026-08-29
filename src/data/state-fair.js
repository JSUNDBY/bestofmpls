// The Minnesota State Fair — a local's guide. Seasonal feature, one page at
// /state-fair/. Facts in `facts` are verified against mnstatefair.org for the
// 2026 fair (Aug 2026); everything in `classics` and `beyond` is evergreen
// fair-fixture material framed generally, never a year-specific claim. The
// live/changing stuff (full food list, Grandstand lineup, daily schedule)
// links out to the official site rather than being asserted here.
module.exports = {
  slug: 'state-fair',
  year: '2026',
  title: 'Minnesota State Fair 2026: A Local’s Guide',
  h1: 'The Great Minnesota Get-Together',
  seoDescription: 'A local’s guide to the 2026 Minnesota State Fair: dates, hours, gate prices, this year’s new foods, the classics worth the line, what to do beyond the food, and how to beat the crowds.',
  intro: 'Twelve days at the end of every summer, a third of the state files through one set of gates in Falcon Heights. It is the largest fair in the country by daily attendance, and it is the closest thing this state has to a family reunion. Here is how a local works it: the practical stuff first, then what is actually worth your appetite and your afternoon.',

  // Verified against mnstatefair.org, August 2026.
  facts: {
    dates: 'Thursday, Aug. 27 through Labor Day, Monday, Sept. 7, 2026',
    days: '12 days',
    hours: 'Grounds admission 7 a.m. to 9 p.m. daily (7 a.m. to 6 p.m. on Labor Day). The grounds stay open until 11 p.m. (8 p.m. Labor Day).',
    prices: [
      ['Pre-fair, online only (through Aug. 26)', '$17'],
      ['Adults, 13–64', '$20'],
      ['Seniors, 65+', '$18'],
      ['Kids, 5–12', '$18'],
      ['Kids 4 and under', 'Free'],
    ],
    location: 'Minnesota State Fairgrounds, 1265 Snelling Ave. N., Falcon Heights',
    newFoodCount: 'more than 30 new foods and nine new vendors',
  },

  // This year's headliners, verified from the official 2026 reveal. The full
  // list and a locator map live on the fair's site (linked from the page).
  newFoods: [
    { name: 'Pickle Pie', vendor: 'LuLu’s Public House', note: 'Chopped pickles and cream cheese in a crust, under a ranch-and-Cholula frosting. The one everyone will argue about.' },
    { name: 'Cracklin’ Corn Ribs', vendor: 'The Blue Barn', note: 'Corn cob quartered, battered, fried, and piled with bacon ranch, candied jalapeños, and pork rinds.' },
    { name: 'Longanisa Cheese Curd Lumpia', vendor: 'Lumpia City', note: 'Filipino sausage and Wisconsin curds deep-fried in a lumpia wrapper, sweet chili on the side.' },
    { name: 'Korean BBQ Bao Buns', vendor: 'Rooted & Wild', note: 'Plant-based, pineapple slaw, steamed bao. Proof the fair is not only meat on a stick.' },
    { name: 'French Chouxnut Sundae', vendor: 'Bridgeman’s', note: 'Salted-caramel espresso ice cream on a mousse-filled choux donut. The dessert to end the night on.' },
    { name: 'Walking Chopped Italian Grinder', vendor: 'Mancini’s al Fresco', note: 'The whole grinder, deconstructed into a handheld you can eat on the move.' },
  ],

  // Evergreen. These are institutions, not this-year news.
  classics: [
    { name: 'Sweet Martha’s Cookie Jar', note: 'A bucket of warm chocolate-chip cookies is the fair’s unofficial mascot. Get the cone if you doubt your commitment; get the pail if you don’t.' },
    { name: 'Pronto Pups', note: 'Not a corn dog. A cornmeal-batter pup, and a hill Minnesotans will die on. Yellow mustard, no debate.' },
    { name: 'Cheese curds', note: 'Deep-fried, squeaky, gone in ninety seconds. The Mouth Trap is the traditional line to stand in.' },
    { name: 'All-you-can-drink milk', note: 'The Dairy Building booth pours it bottomless and cold. The best deal on the grounds and the best thing after something fried.' },
    { name: 'Corn roast', note: 'Sweet corn dunked in a butter vat. Simple, seasonal, and somehow the thing you remember in February.' },
  ],

  // Evergreen fixtures. What the fair is beyond the food.
  beyond: [
    { name: 'The Grandstand', note: 'A full concert series most nights, plus the free stage acts all day. The headline lineup changes every year, so check the schedule and buy ahead.' },
    { name: 'The butter sculptures', note: 'Princess Kay of the Milky Way and her court, each carved from a 90-pound block of butter in a spinning refrigerated case in the Dairy Building. Deeply Minnesotan.' },
    { name: 'Crop art & seed art', note: 'The Agriculture-Horticulture Building holds portraits and scenes made entirely of seeds. Reliably the funniest, sharpest political and pop-culture room at the fair.' },
    { name: 'The Miracle of Birth Center', note: 'Live farm births, all day, every day. Bring the kids; bring yourself.' },
    { name: 'The Midway & the Giant Slide', note: 'Rides, games, and the burlap-sack ride down the towering yellow slide that has been the same joy since 1969.' },
    { name: 'The SkyRide', note: 'The gondola over the whole grounds. The fastest way across, and the only way to see how big this thing really is.' },
    { name: 'The Fine Arts Center & Machinery Hill', note: 'A juried art show worth an hour of quiet, and acres of tractors that draw their own devoted crowd. The fair contains multitudes.' },
  ],

  // Evergreen strategy.
  tips: [
    { head: 'Go on a weekday morning', body: 'Gates open at 7 a.m. Weekday mornings are calm, cool, and the food lines are short. The final Saturday is the single busiest day of the year. Avoid it unless crowds are the point.' },
    { head: 'Don’t drive to the gate', body: 'Park & Ride runs from lots across the metro with a bus straight to the fairgrounds, and the fare usually covers the round trip. It beats fighting for a neighborhood spot in Falcon Heights every time.' },
    { head: 'Bring cash and comfortable shoes', body: 'Some vendors are cash-only, the ATMs run dry, and you will walk several miles without noticing. Sunscreen and a water bottle earn their weight, and the water stations are free.' },
    { head: 'Eat in passes, not meals', body: 'The move is many small things across the day, not one big plate. Split everything. Save the Chouxnut and the cookies for the walk back to the bus.' },
  ],
};
