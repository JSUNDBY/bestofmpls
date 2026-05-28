/**
 * Music scenes — editorial scene guides that double as venue-cluster
 * filters. Each scene is a curated list of the venues that anchor it,
 * with an editorial intro explaining what the scene actually is in
 * this metro right now.
 *
 * The scene page renders:
 *   - the editorial intro
 *   - the anchor venues (links to /calendar/venue/<slug>/)
 *   - upcoming shows at those venues from the scraped events feed
 *   - any related categories on the site
 *
 * Venue slugs reference the live-music.js entries by name.
 */
module.exports = {
  scenes: [
    {
      slug: 'jazz',
      title: 'Jazz',
      eyebrow: 'A real working jazz town',
      deck: 'The Twin Cities has had a serious jazz program since the 1960s — the Dakota anchors the national-touring side, but the small-room scene is what makes it a real working jazz town.',
      intro: 'Three things you should know about jazz in this metro. First, the Dakota is the destination room for national touring acts — the calendar runs deep, the kitchen is real, and the supper-club seating means a serious set without standing-room exhaustion. Second, the listening rooms (Icehouse, Berlin, the Aster) book ambitious smaller acts that would not fit on a Dakota night. Third, KFAI radio and the local-musician network keep the scene healthy in a way most American cities have lost. Free jam sessions, monthly residencies, late-night Tuesday sets — the jazz infrastructure is here if you know where to look.',
      venues: ['Dakota Jazz Club & Restaurant', 'Icehouse', 'Berlin', 'Aster Cafe'],
      tip: 'For the bar-seat-at-Dakota move on a midweek touring night: arrive 30 min before set time, ask for the bar, order food. Cheaper than the dining room, same music, no minimum.'
    },
    {
      slug: 'punk-and-loud',
      title: 'Punk & Loud',
      eyebrow: 'Where the room actually moves',
      deck: 'Hüsker Dü, the Replacements, Soul Asylum. The metro built the modern American underground in basement clubs. The basements are different now but the energy moved buildings, not species.',
      intro: 'First Avenue\'s Mainroom is the iconic loud-night room — Prince filmed Purple Rain in it, the black stars on the outside wall track every act that has played the venue. But the 7th St Entry next door is where bands try out the city before they grow into the big stage, and the Varsity in Dinkytown is where loud-touring acts land when they want a 900-cap room. The 331 Club in Northeast runs a no-cover punk/garage/folk-punk rotation almost every night, free, with the cash-tip-the-band model that keeps the scene moving.',
      venues: ['First Avenue & 7th St Entry', 'Varsity Theater', 'The 331 Club', 'The Hook and Ladder Theater'],
      tip: 'The Entry on a Tuesday is the cheapest, loudest, most-local night out in the city. Plus: walk to the Depot Tavern next door for the post-show pint.'
    },
    {
      slug: 'electronic-and-dance',
      title: 'Electronic & Dance',
      eyebrow: 'House, techno, drum-and-bass, the bigger touring acts',
      deck: 'Less of a scene than a calendar — touring DJs land at the Skyway or the Armory, the local underground does its own thing in basements and one-offs. Here is where to start.',
      intro: 'For touring electronic and EDM the room is the Skyway Theatre downtown — multi-floor, late-night, the programming calendar runs hard from Thursday through Saturday. The Armory is the bigger draw for the biggest names. Beyond that the scene is on the periphery: house and techno nights at Berlin, the Fine Line on a weekend, the occasional venue takeover. Follow the local promoters more than the venues for the underground stuff.',
      venues: ['Skyway Theatre', 'The Armory', 'The Fine Line Music Cafe'],
      tip: 'For a real dance night, check what is on at the Skyway on a Friday — the smaller studio rooms often have the better lineup than the main floor.'
    },
    {
      slug: 'folk-and-americana',
      title: 'Folk & Americana',
      eyebrow: 'Listening rooms, songwriter nights, world music',
      deck: 'The Cedar Cultural Center is the anchor. Songwriter-in-the-round nights at the 331. Acoustic on the river at the Aster. A real folk infrastructure for a city that has always cared about the song.',
      intro: 'The Cedar Cultural Center has been booking world music, folk, and roots since 1989, with curation that reaches places few American venues bother with. The Aster Cafe on the river runs acoustic shows on a tiny stage with the Mississippi as the backdrop. The Hook and Ladder does an eclectic local-Americana program. And the 331 Club hosts songwriter rotations and string-band nights most weeks, free.',
      venues: ['Cedar Cultural Center', 'Aster Cafe', 'The Hook and Ladder Theater', 'The 331 Club'],
      tip: 'The Cedar publishes their bookings months out — most of their best shows sell out the week of. Buy ahead.'
    },
    {
      slug: 'hip-hop',
      title: 'Hip-Hop',
      eyebrow: 'Touring acts, local rotation, the underground that built Rhymesayers',
      deck: 'Atmosphere, Brother Ali, P.O.S. — the metro\'s hip-hop history is real. The current scene runs through First Avenue, the Fine Line, and the Armory for touring names.',
      intro: 'First Avenue books the touring names — Mainroom for the bigger draws, 7th St Entry for the smaller ones. The Fine Line catches the mid-size touring acts and a healthy local rotation. The Armory and the Skyway pick up the largest tours. The local underground anchored on Rhymesayers Entertainment is still actively producing — keep an eye on First Avenue\'s "local showcase" Sundays for names you have not heard yet.',
      venues: ['First Avenue & 7th St Entry', 'The Fine Line Music Cafe', 'The Armory', 'Skyway Theatre'],
      tip: 'First Ave local-showcase Sundays are the cheapest ticket in town for the best local rap. $10ish covers half the city\'s active rappers in a night.'
    },
    {
      slug: 'all-ages',
      title: 'All-Ages',
      eyebrow: 'Where the under-21 scene actually exists',
      deck: 'A serious all-ages calendar is the difference between a music city and a college-bar town. Here are the rooms that host it.',
      intro: 'First Avenue\'s 7th St Entry is all-ages for almost every show — same as the Mainroom — which is rare for a club its size and a major reason the local scene has stayed multi-generational. The Cedar Cultural Center is all-ages by default. The Fine Line and the Palace also run all-ages programming. The Varsity in Dinkytown is mostly all-ages given its location next to the U of M.',
      venues: ['First Avenue & 7th St Entry', 'Cedar Cultural Center', 'The Fine Line Music Cafe', 'Palace Theatre', 'Varsity Theater'],
      tip: 'If you are bringing someone under 21: the 7th St Entry is the move. Small room, all-ages, you can be at the bar (with ID) while they are at the rail.'
    },
    {
      slug: 'free-and-cheap',
      title: 'Free & Cheap',
      eyebrow: 'No cover, low cover, the affordable scene',
      deck: 'The metro\'s no-cover institutions are a real thing. The 331 Club anchors it; Sociable Cider, Indeed taprooms, public-park concerts fill the rest.',
      intro: 'The 331 Club runs live music almost every night with no cover — the cash-tip-the-band model is how the room stays sustainable, so bring small bills. Aster Cafe charges modestly. The summer brings free music at Peavey Plaza, Mears Park (Lowertown), and various brewery taprooms (Indeed and Bauhaus run regular free nights). For ticketed shows under $15, the 7th St Entry is the consistent answer.',
      venues: ['The 331 Club', 'Aster Cafe', 'First Avenue & 7th St Entry'],
      tip: 'Summer free-music: check Peavey Plaza in front of Orchestra Hall on a weeknight, or Mears Park in Lowertown for Wednesday-night programming.'
    }
  ]
};
