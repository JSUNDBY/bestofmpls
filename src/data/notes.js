/**
 * Notes — a small shelf of evergreen essays. Not a blog: no cadence, no
 * filler, no news. Each note answers a question people genuinely ask about
 * the Twin Cities, carries its sources, and gets updated rather than
 * replaced. Published dates are REAL. We do not backdate.
 *
 * Body paragraphs may contain inline HTML links (internal guides + external
 * sources). Everything factual must trace to the Sources list.
 */
module.exports = {
  title: 'Notes',
  intro: 'A small shelf of essays on how the Twin Cities got this way. No cadence, no filler. Written when there is something worth explaining, updated when the facts change.',
  notes: [
    {
      slug: 'jucy-lucy',
      title: 'The Jucy Lucy, explained',
      date: '2026-07-05',
      deck: 'Two bars on Cedar Avenue have spent seventy years arguing about who put the cheese inside the burger. What we actually know, and where to order one.',
      body: [
        { p: 'The Jucy Lucy is a cheeseburger built inside out: the cheese goes between two thin patties that get sealed at the edges, so it cooks into a molten core instead of a blanket. It was invented in south Minneapolis in the 1950s. Beyond that, the city has never agreed on anything about it.' },
        { h: 'The two claims' },
        { p: 'The stronger story belongs to <a href="/burgers/matt-s-bar/">Matt’s Bar</a>, at 35th and Cedar. Their version: in 1954 a regular asked owner Matt Bristol to put the cheese inside the patty instead of on top, bit in, and announced "that’s one juicy Lucy." When the bar printed the name, the i went missing, and Matt’s has spelled it Jucy ever since, on purpose, as a point of pride.' },
        { p: 'Twenty blocks south on the same street, the <a href="/burgers/5-8-club/">5-8 Club</a>, a 1928 speakeasy at 58th and Cedar, claims it too. Their origin story is vaguer, and the bar has been honest about that when pressed. What they have instead is the spelling, and a slogan aimed straight across the avenue: "if it’s spelled right, it’s done right." Matt’s answer, printed on their own merch, is that if it is spelled correctly you are eating a shameless rip-off.' },
        { h: 'What to believe' },
        { p: 'No receipt or menu from 1954 has ever settled it, which is probably why the argument has outlived everyone involved. The honest answer is that Matt’s has the better story and the 5-8 has the better patio, and the feud itself is now the real institution. Politicians on the campaign trail get asked to pick a side. Vikings locker rooms have been polled. Nobody stays neutral in this town for long.' },
        { h: 'How to order one' },
        { p: 'Two rules apply at both bars. First, wait: the cheese core comes off the flat-top somewhere near the temperature of the sun, and every table has watched a first-timer learn this the hard way. Give it two minutes. Second, do not ask for it well done or deconstructed. The whole point is the seal.' },
        { p: 'Both originals are on our <a href="/burgers/">burger guide</a>, alongside the newer generation of stuffed burgers around the metro. Start with Matt’s, then the 5-8, then argue like a local.' }
      ],
      related: [
        { label: 'The burger guide', href: '/burgers/' },
        { label: 'Cheap eats', href: '/cheap-eats/' }
      ],
      sources: [
        { label: 'Star Tribune: two bars battling since the 1950s', url: 'https://www.startribune.com/the-juicy-lucy-two-bars-battling-since-1950s-over-minnesota-s-famous-burger/429889883' },
        { label: 'Jucy Lucy, Wikipedia', url: 'https://en.wikipedia.org/wiki/Jucy_Lucy' },
        { label: '5-8 Club, Wikipedia', url: 'https://en.wikipedia.org/wiki/5-8_Club' }
      ]
    },
    {
      slug: 'why-skyways',
      title: 'Why does Minneapolis have skyways?',
      date: '2026-07-05',
      deck: 'Nine and a half miles of enclosed bridges connect eighty blocks of downtown. They exist because of one developer, one architect, and one very real winter.',
      body: [
        { p: 'The Minneapolis Skyway System is the largest contiguous network of enclosed pedestrian bridges in the world: about 9.5 miles of second-story walkways linking roughly 80 downtown blocks. You can live a full downtown day, parking to office to lunch to gym, without touching a sidewalk. In January, many people do exactly that.' },
        { h: 'It started as a defense against the mall' },
        { p: 'The skyways were not a city plan. They were a bet by a real estate developer named Leslie Park, working with architect Edward Baker in the early 1960s. Southdale in Edina, the country’s first fully enclosed shopping mall, had just shown Minnesotans they could shop in shirtsleeves in February, and downtown was bleeding retail to it. Park’s answer was to make downtown itself climate-controlled: he built two bridges from his new Northstar Center, the first in 1962 to the Northwestern National Bank building, a second the next year to the Roanoke Building. That second bridge is still in use, the oldest working segment in the system.' },
        { h: 'The IDS made it a system' },
        { p: 'For a decade the bridges were scattered, buildings connecting to neighbors one deal at a time. The turning point was the IDS Center in 1974, which ran skyways in all four directions and turned its Crystal Court into the network’s Grand Central. After that, being connected stopped being a novelty and became something downtown buildings could not afford to skip.' },
        { h: 'What it means for a visitor' },
        { p: 'The system is privately owned in pieces, which is why hours vary building to building and why the whole thing can feel like a maze designed by committee, because it was. It is also genuinely great: warm in January, cool in July, and full of lunch counters you would never find from the street. We keep a <a href="/skyway/">skyway guide</a> with the nodes worth knowing and how to route between them.' },
        { p: 'One honest caveat: the skyways empty out after office hours, and the street level pays a price for all that elevated traffic. The best way to use them is the local way, as a winter tool, not a substitute for the city.' }
      ],
      related: [
        { label: 'The skyway guide', href: '/skyway/' },
        { label: 'Downtown Minneapolis guide', href: '/neighborhoods/' }
      ],
      sources: [
        { label: 'Minneapolis Skyway System, Wikipedia', url: 'https://en.wikipedia.org/wiki/Minneapolis_Skyway_System' },
        { label: 'Hennepin History Museum: Building Bridges', url: 'https://hennepinhistory.org/building-bridges-the-minneapolis-skyway-system/' },
        { label: 'MinnPost: the oldest skyway still in use', url: 'https://www.minnpost.com/minnesota-history/2013/07/minneapolis-oldest-skyway-still-use-turns-50/' }
      ]
    },
    {
      slug: 'first-avenue-stars',
      title: 'How First Avenue got its stars',
      date: '2026-07-05',
      deck: 'The black building with the silver stars started life as an Art Deco bus depot. Then Joe Cocker opened it, disco nearly killed it, and Prince made it immortal.',
      body: [
        { p: 'Ask anyone in Minneapolis where the center of the music universe is and they will point at a black building on the corner of 7th and First Avenue North, covered in silver stars. The stars, more than 400 of them, each carry the name of an artist who has played the room. Reading the wall is the fastest music history lesson in America.' },
        { h: 'The bus depot years' },
        { p: 'The building opened in 1937 as a Greyhound depot, Art Deco, blue brick, air conditioning and shower rooms, the glamorous way to leave town. Greyhound itself was born in Hibbing, Minnesota, which makes the whole thing feel fated. The buses moved out in 1968 and left downtown a very sturdy, very empty landmark.' },
        { h: 'The Depot, Uncle Sam’s, First Avenue' },
        { p: 'In 1970 Allan Fingerhut turned the depot into a rock club called The Depot, and opened it with Joe Cocker and the Mad Dogs & Englishmen tour, a first show most venues would kill to claim. When disco swallowed the early seventies the room became Uncle Sam’s, a chain franchise with DJs. By 1981 it had shaken off the franchise and taken the name it holds now, First Avenue, with the small side room on 7th Street, the Entry, becoming the metro’s proving ground for new bands.' },
        { h: 'August 3, 1983' },
        { p: 'The room’s immortality was sealed on a single night. At a benefit show on August 3, 1983, Prince debuted a new song called "Purple Rain," and the recording from that night, the one on the album, is the First Avenue crowd you hear. The film came out in 1984 and put the club on screens worldwide. The star wall, the black paint, the room itself: after Purple Rain they stopped being local landmarks and became pilgrimage sites.' },
        { p: 'The club still runs every week of the year, and its calendar anchors our <a href="/calendar/venue/first-avenue/">First Avenue venue page</a> and the nightly <a href="/tonight/">board</a>. See a show in the Mainroom, then find Prince’s star. It is painted gold, the only one.' }
      ],
      related: [
        { label: 'Who is at First Avenue', href: '/calendar/venue/first-avenue/' },
        { label: 'The live music guide', href: '/live-music/' }
      ],
      sources: [
        { label: 'First Avenue: our history', url: 'https://first-avenue.com/about/our-history/' },
        { label: 'First Avenue (nightclub), Wikipedia', url: 'https://en.wikipedia.org/wiki/First_Avenue_(nightclub)' },
        { label: 'Star Tribune: Prince and First Avenue', url: 'https://www.startribune.com/prince-and-first-avenue-a-history-of-the-club-s-ties-to-its-brightest-star/377583391' }
      ]
    }
  ]
};
