/**
 * Itineraries: structured day plans for visitors. Not a regular category
 * (does not appear in the main category nav). Rendered by a special
 * renderItineraries() function in build.js.
 *
 * Each itinerary is a sequence of stops. Stops can reference other
 * categories on the site (linkSlug), or stand alone as instructions.
 */
module.exports = {
  slug: 'visit',
  title: 'First time in the Twin Cities',
  subtitle: 'A working playbook for one day, a weekend, or a week.',
  intro: 'Most city guides give you a list and call it a day. This is a play-by-play. We assume you have just landed, or you have a friend coming this weekend, or you have one Saturday and you do not want to waste it. Pick the time slot that matches your trip and follow the route. Every place links to the full entry on the site.',
  hero_color: 'forest',

  // Quick orientation block at top
  basics: [
    { label: 'Best time to visit', body: 'May through October for outdoor everything. Late August for the Minnesota State Fair. December weekends for Holidazzle. February if you want the Saint Paul Winter Carnival and the snow-covered version of the city. Avoid March (it is just brown).' },
    { label: 'Where to stay', body: 'North Loop for design hotels and walking access to restaurants and the Mississippi. Downtown for music venues and theater walking access. Cathedral Hill in St. Paul for a quieter, residential-feel base.' },
    { label: 'Getting around', body: 'Light rail (the Green and Blue Line) covers downtown Mpls, the airport, the U of M, and downtown St. Paul. Lyft and Uber are everywhere. The Lyft bike-share is the right move for the lakes and the Greenway in summer. A car helps for Northeast and the western suburbs but is not required for the core experience.' },
    { label: 'Two cities, not one', body: 'Minneapolis and Saint Paul are different. Mpls is bigger, denser, more food and music. St. Paul is older, more walkable downtown, more historic. The river separates them. Both are worth your time. We list across both.' }
  ],

  // The core itineraries
  plans: [
    {
      slug: '24-hours',
      label: 'If you have 24 hours',
      eyebrow: 'One day',
      headline: 'The essential single-day route.',
      deck: 'You landed this morning, you fly out tomorrow. This is the route. Built around what is genuinely unique to Minneapolis and what you can actually walk between.',
      stops: [
        { time: '9:00 AM', title: 'Coffee + pastry at Patisserie 46 or Rustica', body: 'Start with the bakery. The almond croissant at Patisserie 46 in South Mpls is the pastry-program flex. Rustica by Lake Bde Maka Ska is the other end of that argument, and the bittersweet chocolate cookie settles it.', linkSlug: 'pastries-and-bakeries' },
        { time: '10:30 AM', title: 'Walker Art Center + Sculpture Garden', body: 'The Spoonbridge and Cherry is the unofficial mascot of Minneapolis. The Walker itself is one of the country\'s great contemporary art museums. The sculpture garden is free and open year-round.', linkSlug: 'museums-and-galleries' },
        { time: '12:30 PM', title: 'Lunch: Hai Hai or Spoon and Stable bar', body: 'Hai Hai in Northeast does Southeast Asian street food brilliantly; the rum bar adds an afternoon. If you want a serious sit-down, walk into the bar at Spoon and Stable in the North Loop — ten seats, no reservation, fine-dining lunch at bar prices.', linkSlug: 'restaurants' },
        { time: '2:00 PM', title: 'Stone Arch Bridge walk + Mill District', body: 'Walk the 1883 Great Northern stone bridge across the Mississippi at Saint Anthony Falls. Visit the Mill City Museum if you want context. Climb Gold Medal Park for the skyline view.', linkSlug: 'outdoors' },
        { time: '4:00 PM', title: 'Coffee or cocktail at Spyhouse North Loop', body: 'Walk west into the North Loop. Spyhouse Hennepin or Dogwood for coffee, or hit the bar at Spoon and Stable for the half-priced happy hour from 4 to 5:30.', linkSlug: 'happy-hours' },
        { time: '6:30 PM', title: 'Dinner at 112 Eatery or Pizzeria Lola', body: 'Both are James-Beard-honored. 112 if you want chef-driven small-plates downtown. Pizzeria Lola if you want to take a 15-minute drive south for what changed Twin Cities pizza.', linkSlug: 'restaurants' },
        { time: '9:00 PM', title: 'A show at First Avenue or the Dakota', body: 'First Ave for rock, indie, hip hop. The Dakota for jazz with a serious supper-club setup. Both are downtown and walkable from the dinner spots above. Buy tickets ahead.', linkSlug: 'live-music' }
      ]
    },
    {
      slug: 'weekend',
      label: 'If you have a weekend',
      eyebrow: 'Two to three days',
      headline: 'The Friday-to-Sunday version.',
      deck: 'You arrive Friday afternoon, leave Sunday evening. This adds the layer of culture, neighborhood depth, and brunch that the one-day version does not have time for.',
      stops: [
        { time: 'Friday 5pm', title: 'Land, drop bags, walk Nicollet Mall', body: 'Get to your hotel (the Hewing in the North Loop or the Saint Paul Hotel are good first calls). Take a short walk to acclimate.', linkSlug: 'boutique-hotels' },
        { time: 'Friday 7pm', title: 'Dinner at Demi or Spoon and Stable', body: 'If you want the city\'s most ambitious tasting menu, Demi (book weeks ahead). Otherwise the Spoon and Stable bar walk-in is the move.', linkSlug: 'restaurants' },
        { time: 'Friday 10pm', title: 'A drink at Volstead\'s Emporium or the Dakota bar', body: 'Speakeasy energy at Volstead\'s in Lyn-Lake, or the elegant supper-club bar at the Dakota downtown. Both keep going late.', linkSlug: 'cocktail-bars' },
        { time: 'Saturday 9am', title: 'Brunch at Hai Hai, Saint Genevieve, or Hi-Lo Diner', body: 'Three different registers. Hai Hai for Southeast Asian, Saint Genevieve for French bistro in Linden Hills, Hi-Lo for retro diner. Reservations help.', linkSlug: 'best-brunch' },
        { time: 'Saturday 11am', title: 'Mia (Minneapolis Institute of Art)', body: '90,000 objects spanning 5,000 years of art history. Free admission. Allow at least two hours. The Japanese tea room is the underrated highlight.', linkSlug: 'museums-and-galleries' },
        { time: 'Saturday 2pm', title: 'Walk or bike the Chain of Lakes', body: 'Bde Maka Ska, Lake of the Isles, Lake Harriet. Rent a bike from Wheel Fun at Lake Harriet or grab a Lyft bike share. The full chain loop is about 6 miles.', linkSlug: 'outdoors' },
        { time: 'Saturday 5pm', title: 'Northeast art crawl + early dinner', body: 'Drop into the Northrup King Building if it is First Saturday. Otherwise wander 13th Ave NE. Dinner at Vinai (Yia Vang&rsquo;s Hmong table) or Centro for tacos.', linkSlug: 'museums-and-galleries' },
        { time: 'Saturday 9pm', title: 'A show or a long drink', body: 'First Avenue, the Fine Line, the Palace, the Cedar Cultural Center, the Turf Club. Pick whatever sounds right. Or settle in at Norseman Distillery in Northeast for cocktails.', linkSlug: 'live-music' },
        { time: 'Sunday 10am', title: 'Brunch at Hai Hai or Tilia', body: 'Hai Hai for Christina Nguyen\'s Southeast Asian brunch in Northeast. Tilia for Steven Brown\'s Linden Hills neighborhood bistro. Either way order coffee.', linkSlug: 'best-brunch' },
        { time: 'Sunday 12pm', title: 'Cross to St. Paul', body: 'Spend Sunday afternoon in the other city. Cathedral Hill walk (Idun, Nina\'s Coffee, the Cathedral itself), or Hidden Falls Regional Park if the weather is right.', linkSlug: 'neighborhoods' },
        { time: 'Sunday 3pm', title: 'Cossetta\'s and the Schmidt Brewery walk', body: 'Cossetta\'s on West Seventh has been serving since 1911. Pizza, antipasti, the upstairs piano bar. Walk the West Seventh corridor afterward.', linkSlug: 'best-pizza' }
      ]
    },
    {
      slug: 'week',
      label: 'If you have a week',
      eyebrow: 'Five to seven days',
      headline: 'The slow version.',
      deck: 'Now you can actually live here for a week. Day trips. The deeper Northeast art scene. A St. Paul day. The lakes properly. A theater night. The whole shape of the city.',
      stops: [
        { time: 'Day 1', title: 'Arrival, downtown orientation, Mia', body: 'Settle in. Walk Nicollet Mall and the Stone Arch Bridge. Visit Mia if it is open. Dinner at Spoon and Stable or 112 Eatery.', linkSlug: 'museums-and-galleries' },
        { time: 'Day 2', title: 'Northeast Minneapolis day', body: 'Spend the whole day in NE. Coffee at Cafe Cerés, lunch at Vinai, art at Northrup King, dinner at Centro or Tlayuda L.A., late drink at Norseman or Dangerous Man.', linkSlug: 'neighborhoods' },
        { time: 'Day 3', title: 'St. Paul day', body: 'Cross the river. Cathedral Hill in the morning. Lunch at Cossetta\'s. Mickey\'s Diner for the historic moment. Penumbra Theatre or the Palace Theatre at night.', linkSlug: 'neighborhoods' },
        { time: 'Day 4', title: 'Lakes day', body: 'Bike the Chain of Lakes. Swim at Bde Maka Ska Beach or Hidden Beach on Cedar Lake. Dinner on a patio (Sea Salt Eatery at Minnehaha Falls in summer).', linkSlug: 'outdoors' },
        { time: 'Day 5', title: 'Day trip out', body: 'Stillwater on the St. Croix River, or Taylors Falls for the Interstate State Park cliffs. Both about 35 minutes east. Lunch at a small-town spot, paddle if it is summer.', linkSlug: 'outdoors' },
        { time: 'Day 6', title: 'Music + theater night', body: 'A morning at the Walker. An afternoon nap. Theater at the Guthrie or Brave New Workshop. A late show at First Ave or the Fine Line. Dinner in between at Spoon and Stable bar.', linkSlug: 'theaters' },
        { time: 'Day 7', title: 'Slow last day', body: 'Long brunch (Hai Hai, Mucci&rsquo;s Italian, or Tilia). Browse a shop you have not been to (Magers & Quinn, Birchbark Books, COMBINE). One last meal at a place you loved earlier in the week. Head home.', linkSlug: 'independent-shops' }
      ]
    }
  ]
};
