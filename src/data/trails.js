// Passport trails — finite, finishable quests through places already in the
// guide. Every stop references a real directory entry by (category slug,
// exact entry name); build.js resolves the reference and fails the trail
// loudly if a name drifts. Stop "why" lines are condensed from the entry's
// own fact-checked description — never new claims.
//
// Trail rules (the adult version of gamification):
// - Finite and finishable. No streaks, no points, no deadline.
// - Marking a stop = marking the place in your Passport. Same record.
// - A finished trail earns a completion card. That is the whole reward.
module.exports = {
  intro: 'Finite routes through the guide, meant to be finished over a season or a lifetime, never in a night. Check places off as you actually go. Your progress lives in your Passport, on your device, nowhere else.',
  trails: [
    {
      slug: 'jucy-lucy',
      title: 'The Jucy Lucy Trail',
      eyebrow: 'Four burgers, one feud',
      deck: 'Minneapolis invented the cheese-stuffed burger and has been arguing about who did it ever since. Eat all four canonical versions, then pick your side with authority.',
      done_line: 'You have eaten the whole argument. Whatever side you picked, you earned it.',
      pace_note: 'No clock on this. Four burgers is four separate outings, and the mouth-burn heals between them.',
      stops: [
        { cat: 'burgers', name: 'Matt’s Bar', why: 'The 1954 Cedar Avenue original claimant, spelled with no "i". Molten center, cash only, expect a wait.' },
        { cat: 'burgers', name: '5-8 Club', why: 'The other origin claimant, open since 1928. Four cheese options and a Time Magazine nod.' },
        { cat: 'burgers', name: 'The Nook', why: 'The Nookie Burger tops most metro Juicy Lucy rankings, and there is a basement bowling alley.' },
        { cat: 'burgers', name: 'Blue Door Pub', why: 'The Blucy: the variant lane. The Bacon Blucy is the order.' }
      ]
    },
    {
      slug: 'northeast-taprooms',
      title: 'The Northeast Taproom Ramble',
      eyebrow: 'Seven rooms, one neighborhood',
      deck: 'The densest run of taprooms in the metro, all within a few square miles of Northeast. A season pass, not a pub crawl: one room per visit, on foot or with a ride home.',
      done_line: 'Seven taprooms, properly visited. You know Northeast better than most people who live there.',
      pace_note: 'This trail is designed to take months. One taproom per outing is the intended pace.',
      stops: [
        { cat: 'breweries', name: 'Bauhaus Brew Labs', why: 'The full-block beer garden and the lager program. One of the best public-square rooms in the metro.' },
        { cat: 'breweries', name: 'Fair State Brewing Cooperative', why: 'Consumer-owned co-op with one of the upper Midwest’s best wild-fermentation programs.' },
        { cat: 'breweries', name: 'Indeed Brewing Company', why: 'The serious sour program and a big patio.' },
        { cat: 'breweries', name: 'Dangerous Man Brewing', why: 'The cult favorite, back as of June 2026 on East Hennepin. The chocolate milk stout is the pilgrimage.' },
        { cat: 'breweries', name: 'Sociable Cider Werks', why: 'The cider wild card, and the most dog-friendly patio in the city.' },
        { cat: 'breweries', name: 'Falling Knife Brewing Co.', why: 'Full table service, still rare for a taproom. The sit-down one.' },
        { cat: 'breweries', name: 'Insight Brewing', why: 'A program that reaches across global brewing traditions. Always something you have not had.' }
      ]
    },
    {
      slug: 'meet-the-city',
      title: 'Meet the City',
      eyebrow: 'Eight essentials',
      deck: 'The eight places that explain the Twin Cities: the room Prince filmed in, the museum you would fly to see, the bridge, the falls, the mill ruins, the studios. Finish this and you are of the metro, not just in it.',
      done_line: 'All eight. You have met the city. From here on you are the one giving directions.',
      pace_note: 'Locals take years to do this list. Visitors have done it in a week. Both count.',
      stops: [
        { cat: 'live-music', name: 'First Avenue & 7th St Entry', why: 'The room. The black stars on the wall track everyone who has played it.' },
        { cat: 'outdoors', name: 'Stone Arch Bridge and the Mill District', why: 'The 1883 stone rail bridge over Saint Anthony Falls. The city’s essential walk.' },
        { cat: 'museums-and-galleries', name: 'Mill City Museum', why: 'A museum in the ruins of the flour mill that made Minneapolis. Ride the Flour Tower.' },
        { cat: 'museums-and-galleries', name: 'Walker Art Center', why: 'Contemporary art at national scale, with the Sculpture Garden and the Spoonbridge across the way.' },
        { cat: 'museums-and-galleries', name: 'Minneapolis Institute of Art (Mia)', why: 'Ninety thousand objects, five thousand years, free admission.' },
        { cat: 'outdoors', name: 'Minnehaha Falls Park', why: 'A 53-foot waterfall inside city limits. Go once in summer and once frozen.' },
        { cat: 'outdoors', name: 'Como Park', why: 'Free zoo, the McNeely Conservatory, a Japanese garden. The kind of park America stopped building.' },
        { cat: 'museums-and-galleries', name: 'Northrup King Building', why: 'Nine floors of working artist studios. Go on a First Thursday, or brave Art-A-Whirl in May.' }
      ]
    }
  ]
};
