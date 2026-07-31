/**
 * Featured events — single-event takeover for the homepage + a dedicated
 * landing page during the run-up and active dates.
 *
 * The build picks the first event whose window (window_before_days before
 * `starts` through end of `ends`) contains today's Central-time date.
 * Outside that window the banner doesn't render and the route still ships
 * for direct-link traffic.
 *
 * Adding an event: define dates in YYYY-MM-DD (Central). Keep the list
 * short — banner real estate is a feature, not a noticeboard.
 */
module.exports = {
  events: [
    {
      slug: 'art-a-whirl',
      name: 'Art-A-Whirl',
      year: 2026,
      starts: '2026-05-15',
      ends:   '2026-05-17',
      window_before_days: 7,

      eyebrow: 'This weekend in Northeast',
      teaser:  'The country\'s largest open-studio crawl. 1,600 NEMAA artists open their doors across Northeast Minneapolis. Free.',
      cta_label: 'The full guide →',

      // Landing page contents
      tagline: '31st annual. Three days. Free. Northeast Minneapolis.',
      dates_display: 'May 15–17, 2026',
      hours_display: 'Friday 5–10 PM · Saturday 12–8 PM · Sunday 12–5 PM',
      official_url: 'https://nemaa.org/art-a-whirl/',
      organizer_name: 'Northeast Minneapolis Arts Association (NEMAA)',
      organizer_url: 'https://nemaa.org',
      location: 'Northeast Minneapolis',
      coords: { lat: 45.0085, lng: -93.2580 }, // Northrup King Building

      anchors_title: 'Anchor buildings',
      anchors_deck: 'Six places to start. You will not see them all, and that is fine. Pick two, walk slow, talk to the people behind the work.',
      pairings_title: 'Eat and drink while you\'re up there',
      intro: 'Art-A-Whirl is the largest open-studio tour in the United States. Over a single weekend in May, more than 1,600 artists in the Northeast Minneapolis Arts Association (NEMAA) open their working studios across the neighborhood. It is free, walkable, and the single best snapshot of what creative work in this metro actually looks like. Bring cash, bring shoes, and plan to be slow. The buildings have stairs.',

      anchors: [
        {
          name: 'Northrup King Building',
          address: '1500 Jackson St NE, Minneapolis',
          why: 'The flagship. Nine floors, hundreds of studios, three hours minimum if you want to see most of it. Anchored by Public Functionary and Yeah Maybe in the main galleries.',
          url: 'https://www.northrupkingbuilding.com/events/art-a-whirl'
        },
        {
          name: 'California Building',
          address: '2205 California St NE, Minneapolis',
          why: 'The other big one. Painters, ceramicists, fiber artists. Quieter halls than NKB, easier to actually talk to the artist.'
        },
        {
          name: 'Casket Arts Building',
          address: '681 17th Ave NE, Minneapolis',
          why: 'The old Northwestern Casket Company. Three floors of studios in a building that used to make caskets for the Upper Midwest. Worth it for the building alone.'
        },
        {
          name: 'Solar Arts Building',
          address: '711 15th Ave NE, Minneapolis',
          why: 'Smaller, scrappier, and home to Indeed Brewing on the ground floor. The best place to start or end the day.'
        },
        {
          name: 'Q.arma Building',
          address: '1224 Quincy St NE, Minneapolis',
          why: 'Eight floors, deep roster of working artists. Slightly off the main loop, which means shorter lines.'
        },
        {
          name: 'Thorp Building',
          address: '1620 Central Ave NE, Minneapolis',
          why: 'On Central Ave, surrounded by food and beer. Good first stop if you\'re coming from south of the river.'
        }
      ],

      pairings: [
        { name: 'Indeed Brewing Co.', why: 'Inside Solar Arts. Walk out of a studio, walk into a pint.' },
        { name: 'Bauhaus Brew Labs', why: 'Patio, food trucks on Art-A-Whirl weekend, walking distance to Northrup King.' },
        { name: 'Dangerous Man Brewing', why: '13th Ave NE taproom. The classic Art-A-Whirl pit stop. Brewery only, food trucks usually parked outside.' },
        { name: 'Sociable Cider Werks', why: 'Broadway St NE. Cider and beer, big patio, walkable from Northrup King.' },
        { name: '612 Brew', why: 'Marshall St NE. Walkable from Northrup King, food trucks on weekends.' }
      ],

      tips: [
        'Bring cash. Most artists take Venmo or card, but small purchases move faster with twenties.',
        'Wear comfortable shoes. Northrup King alone has hundreds of feet of stairs.',
        'Park once. Park on Broadway or Central, ride the free Art-A-Whirl shuttle between buildings.',
        'Friday night is the opening rush. Saturday afternoon is the most crowded. Sunday is the calmest and your best chance to actually talk to the artist.',
        'Pick a building, not a list. Trying to hit every studio is how you see none of them.'
      ]
    },
    {
      slug: 'fourth',
      name: 'The Fourth of July',
      year: 2026,
      starts: '2026-07-04',
      ends:   '2026-07-04',
      window_before_days: 2,

      eyebrow: 'Fireworks on both rivers',
      teaser:  'Red, White and Boom runs all day on the Minneapolis riverfront, and St. Paul gets its first big Fourth fireworks in nearly a decade.',
      cta_label: 'Where to watch →',

      tagline: 'Two cities, three fireworks shows, one long summer day.',
      dates_display: 'July 4, 2026',
      hours_display: 'Minneapolis fireworks 10 PM · St. Paul at dusk',
      official_url: 'https://www.minneapolisparks.org/activities-events/events/red_white_and_boom/',
      location: 'Water Works Park, Minneapolis',
      coords: { lat: 44.9805, lng: -93.2570 },

      anchors_title: 'The three shows',
      anchors_deck: 'Two cities, three fireworks displays. Pick a riverbank, or be ambitious and chain them.',
      pairings_title: 'Eat and drink near the fireworks',
      intro: 'The metro does the Fourth on its rivers. Minneapolis stacks a full free day along the central riverfront and closes it with one of the biggest fireworks shows in the state, and this year St. Paul is back in the game: after nearly a decade without a big municipal show, fireworks return to Cathedral Hill, plus the Saints shoot theirs off over Lowertown after the game.',

      anchors: [
        {
          name: 'Red, White and Boom',
          address: 'Water Works Park and West River Parkway, Minneapolis',
          why: 'The big one. Free programming all day: a 5K at 8 AM, food trucks from 11 AM, live music at Mill Ruins Park from 8 to 10 PM, then fireworks over the river at 10. Expect 50,000 people and bring a blanket; seating is limited and the riverfront lawn is the move.',
          url: 'https://www.minneapolisparks.org/activities-events/events/red_white_and_boom/'
        },
        {
          name: 'Red, White and Boom at Cathedral Hill',
          address: 'Cathedral Hill Park, St. Paul',
          why: 'St. Paul\'s first major Fourth fireworks in nearly a decade, hosted by the Rotary Club under the Cathedral. Food trucks open at 6 PM, a concert follows, and the fireworks go at dusk.',
          url: 'https://www.stpaul.gov/news/celebrate-fourth-july-saint-paul'
        },
        {
          name: 'Saints at CHS Field',
          address: '360 Broadway St, St. Paul',
          why: 'The Saints host the Buffalo Bisons in Lowertown with a post-game fireworks show. The baseball version of the holiday: cheap seats, a full stadium, and the show goes up right over the ballpark.',
          url: 'https://www.chsfield.com/events'
        }
      ],

      pairings: [
        { name: 'Aster Cafe', why: 'St. Anthony Main patio across the river from the Minneapolis show. Book early or go for the standing crowd on the cobblestones.' },
        { name: 'W.A. Frost', why: 'The Cathedral Hill patio institution, two blocks from St. Paul\'s fireworks. Dinner first, walk to the show.' },
        { name: 'Dark Horse', why: 'Lowertown bar and patio a short walk from CHS Field for before or after the Saints game.' }
      ],

      tips: [
        'Transit beats parking for the Minneapolis show. Metro Transit runs free rides all day on the Fourth; downtown lots fill early.',
        'The Minneapolis fireworks go at 10 PM sharp. Staked-out blanket spots along West River Parkway start disappearing around 8.',
        'Sunset is about 9 PM, so the St. Paul dusk shows start earlier than the Minneapolis one. Ambitious night: Cathedral Hill at dusk, then across the river for the 10 PM finale.'
      ]
    },
    {
      slug: 'food-truck-festival',
      name: 'Minneapolis Food Truck Festival',
      year: 2026,
      starts: '2026-08-01',
      ends:   '2026-08-01',
      window_before_days: 4,

      eyebrow: 'Saturday on the riverfront',
      teaser:  'Over 40 food trucks take over Father Hennepin Bluff Park, with local beer, live music all day, and lawn games. Free, and dogs are welcome.',
      cta_label: 'The full rundown →',

      tagline: 'Over 40 trucks, one riverfront park, one Saturday. Free.',
      dates_display: 'Saturday, August 1, 2026',
      hours_display: '11 AM to 9 PM',
      official_url: 'https://mnfoodtruckfestival.com/minneapolis',
      location: 'Father Hennepin Bluff Park, St. Anthony Main',

      anchors_title: 'The setup',
      anchors_deck: 'One park, three things going on. Come hungry and settle in.',
      pairings_title: 'When the truck lines get long',
      intro: 'The Minneapolis Food Truck Festival is back at Father Hennepin Bluff Park for its second year: over 40 food trucks lined up along the Mississippi in the St. Anthony Main district, plus local craft beer, ciders, cocktails, seltzers, and non-alcoholic options to wash it down. Admission is free, and the free wristband does real work — each one provides three meals to people in need through Feed My Starving Children. Bring the dog.',

      anchors: [
        {
          name: 'The trucks',
          address: 'Father Hennepin Bluff Park, 420 Main St SE',
          why: 'Over 40 food trucks in one place, which is the point. Go early with a plan to graze — split everything, share tables, and treat the second lap as the real order.'
        },
        {
          name: 'MN Lottery Stage',
          address: 'In the park',
          why: 'Live music the whole day: Whiskey Stone from 11 AM to 2 PM, Tyte Phitt from 2:30 to 5:30, and Alex Rossi closing it out from 6 to 9 PM.'
        },
        {
          name: 'Games and giveaways',
          address: 'In the park',
          why: 'Giant Connect 4, bags, and hammerschlagen — the Minnesota festival triathlon. Family-friendly, and there are giveaways running through the day.'
        }
      ],

      pairings: [
        { name: 'Aster Cafe', why: 'Two blocks down Main Street on the cobblestones. A patio drink with the river view while your group holds a spot in a truck line.' },
        { name: 'Alma', why: 'A short walk up University Ave. The move if the festival was lunch and you want a real dinner after.' },
        { name: 'Dangerous Man Brewing', why: 'A fifteen-minute walk into Northeast for a taproom pint when you\'ve eaten your way through the park.' }
      ],

      tips: [
        'It\'s free, but grab the wristband — each free wristband provides three meals through Feed My Starving Children.',
        'Walk or bike if you can. St. Anthony Main parking fills fast on event weekends; the Stone Arch Bridge drops you a block from the park if you\'re coming from downtown.',
        'Lines peak at lunch. Go at 11 AM sharp, or make it an evening: shorter waits and Alex Rossi plays until 9.',
        'Dogs are welcome, and the park is grass and river bluff — bring a blanket, claim shade early on a hot day.'
      ]
    }
  ]
};
