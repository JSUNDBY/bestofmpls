/**
 * Current and upcoming art exhibitions across Twin Cities museums and galleries.
 *
 * This data is time-sensitive and goes stale fast. Refreshed monthly via
 * research pass (or eventually scrape museum calendar APIs).
 *
 * Each entry is a single exhibition with venue, dates, and optional URL.
 * Every title, date, and URL below was verified against the venue's own
 * website on the last_updated date. Closed shows are also auto-filtered
 * at build time (scripts/build.js), so keep end dates machine-readable:
 * "... to Month D, YYYY".
 */
module.exports = {
  slug: 'now-showing',
  title: 'Now Showing',
  subtitle: 'Current and upcoming art exhibitions across the Twin Cities.',
  intro: 'A rolling list of what is on view at the museums, galleries, and project spaces across Minneapolis and Saint Paul. Refreshed monthly. If we missed an opening you care about, send us a tip.',
  hero_color: 'forest',
  needs_verification: true,
  last_updated: 'July 26, 2026',

  exhibitions: [
    // ==================== WALKER ART CENTER ====================
    {
      venue: 'Walker Art Center',
      title: 'Christine Sun Kim: All Day All Night',
      subtitle: 'Mid-career survey',
      description: 'A survey of Kim’s work from 2011 to today — drawings, videos, sculptures, and installations that examine sound’s nonauditory and political dimensions through American Sign Language, musical notation, and visual forms.',
      dates: 'March 28 to August 30, 2026',
      url: 'https://www.walkerart.org/whats-on/christine-sun-kim-all-day-all-night/',
      type: 'current'
    },
    {
      venue: 'Walker Art Center',
      title: 'Suzanne Jackson: What Is Love',
      subtitle: 'Retrospective spanning six decades',
      description: 'A retrospective tracing Jackson’s dedication to beauty as a political force and her engagement with poetry, dance, and theater, with love’s earthly and spiritual dimensions at the center of her practice.',
      dates: 'May 14 to August 23, 2026',
      url: 'https://www.walkerart.org/whats-on/suzanne-jackson-what-is-love/',
      type: 'current'
    },
    {
      venue: 'Walker Art Center',
      title: 'Sculpture Court',
      subtitle: 'The human form, from surrealist to contemporary',
      description: 'Reimagines the centuries-old sculpture court tradition with works depicting the human form in diverse materials, from Joan Miró to Mona Hatoum and Rona Pondick, and invites visitors to sketch in the gallery.',
      dates: 'October 18, 2025 to August 30, 2026',
      url: 'https://www.walkerart.org/whats-on/sculpture-court/',
      type: 'current'
    },
    {
      venue: 'Walker Art Center',
      title: 'This Must Be the Place: Inside the Walker’s Collection',
      subtitle: 'Long-running collection rehang',
      description: 'Works from the Walker’s collection organized around the idea of home, spanning three galleries with sections on community, urban environments, and natural landscapes — Edward Hopper to Julie Mehretu and Mark Bradford.',
      dates: 'June 20, 2024 to March 12, 2028',
      url: 'https://www.walkerart.org/whats-on/this-must-be-the-place-inside-the-walkers-collection/',
      type: 'current'
    },
    {
      venue: 'Walker Art Center',
      title: 'Olalekan Jeyifous: Hydricosmic Litanies',
      subtitle: 'First solo museum exhibition',
      description: 'An installation of milled-wood reliefs and carved sculptures presented as an archive from a speculative river enclave, blending African diasporic cosmologies and Indigenous water knowledge across river systems from the Niger to the Mississippi.',
      dates: 'August 6, 2026 to January 3, 2027',
      url: 'https://www.walkerart.org/whats-on/olalekan-jeyifous-hydricosmic-litanies/',
      type: 'upcoming'
    },
    {
      venue: 'Walker Art Center',
      title: 'Walker Design Triennial: Beyond Materialism',
      subtitle: 'The Walker’s first design triennial',
      description: 'Contemporary designers from around the world who engage societal challenges — technology, environment, community building, and social justice — through design innovation.',
      dates: 'October 17, 2026 to February 14, 2027',
      url: 'https://www.walkerart.org/whats-on/walker-design-triennial-beyond-materialism/',
      type: 'upcoming'
    },

    // ==================== MIA ====================
    {
      venue: 'Minneapolis Institute of Art',
      title: 'Ziba Rajabi: Belly Laugh at a Funeral',
      subtitle: 'Textile works in the U.S. Bank Gallery',
      description: 'Textile works by the Tehran-born artist drawing on ancient practices of the Iranian plateau and Mesopotamia, exploring the emotions that follow grief, with a soundtrack and cushions inviting collective reflection.',
      dates: 'July 18 to October 25, 2026',
      url: 'https://new.artsmia.org/exhibition/ziba-rajabi-belly-laugh-funeral',
      type: 'current'
    },
    {
      venue: 'Minneapolis Institute of Art',
      title: 'Back from the Underworld: Mia’s Dante Tapestry Restored',
      subtitle: 'Renaissance tapestry back on view',
      description: 'Francesco Salviati’s monumental 1540s tapestry of Dante and Virgil at the start of the Inferno, in storage at Mia for nearly 70 years and newly conserved through a TEFAF Museum Restoration Fund grant.',
      dates: 'July 11, 2026 to January 31, 2027',
      url: 'https://new.artsmia.org/exhibition/back-from-the-underworld-mias-dante-tapestry-restored',
      type: 'current'
    },
    {
      venue: 'Minneapolis Institute of Art',
      title: 'Meeting Point: The Mary Ingebrand-Pohlad Collection of Latin American Art',
      subtitle: 'Rivera, Ramos Martínez, Covarrubias',
      description: 'Paintings, sculptures, and religious images framing California as a meeting point of American and Latin American cultures, with artists such as Diego Rivera, Alfredo Ramos Martínez, and Miguel Covarrubias.',
      dates: 'June 27 to October 4, 2026',
      url: 'https://new.artsmia.org/exhibition/meeting-point-mary-ingebrand-pohlad-collection-latin-american-art',
      type: 'current'
    },
    {
      venue: 'Minneapolis Institute of Art',
      title: 'Hiroshige’s 100 Views of Edo x Emily Allchurch',
      subtitle: 'Woodblock classics meet digital collage',
      description: 'Pairs Utagawa Hiroshige’s celebrated 1850s woodblock series One Hundred Famous Views of Edo with British artist Emily Allchurch’s Tokyo Story digital-collage responses.',
      dates: 'December 20, 2025 to August 23, 2026',
      url: 'https://new.artsmia.org/exhibition/hiroshige-100-views-edo-emily-allchurch',
      type: 'current'
    },
    {
      venue: 'Minneapolis Institute of Art',
      title: 'Year of the Horse: Hoofbeats through Time',
      subtitle: 'Closing August 9',
      description: 'The horse in Chinese art and culture — chariot puller, zodiac sign, companion, and poetic metaphor — from ritual bronzes to imperial scrolls, timed to the new Year of the Horse.',
      dates: 'February 18 to August 9, 2026',
      url: 'https://new.artsmia.org/exhibition/year-of-the-horse',
      type: 'current'
    },
    {
      venue: 'Minneapolis Institute of Art',
      title: 'María Berrío: Songlines',
      subtitle: 'Monumental layered-paper scenes',
      description: 'Close to 20 works from the past decade by the Colombian artist, who builds monumental scenes by layering hand-cut Japanese paper onto canvas. Organized by Mia and the San José Museum of Art.',
      dates: 'September 12, 2026 to January 10, 2027',
      url: 'https://new.artsmia.org/exhibition/maria-berrio-songlines',
      type: 'upcoming'
    },
    {
      venue: 'Minneapolis Institute of Art',
      title: 'Exhibiting Forgiveness',
      subtitle: 'Paintings by Titus Kaphar',
      description: 'Paintings Kaphar made for his feature film Exhibiting Forgiveness, a deeply personal exploration of healing from generational trauma through art.',
      dates: 'September 12, 2026 to January 3, 2027',
      url: 'https://new.artsmia.org/exhibition/exhibiting-forgiveness',
      type: 'upcoming'
    },
    {
      venue: 'Minneapolis Institute of Art',
      title: 'Cream of the Crop: The Second Harvest',
      subtitle: 'State Fair crop art at the museum',
      description: 'Mia’s curators again select standouts from the Minnesota State Fair’s crop art showcase — more than 20 works, including the five Best in Show ribbon winners.',
      dates: 'September 19 to November 29, 2026',
      url: 'https://new.artsmia.org/exhibition/cream-of-the-crop-the-second-harvest',
      type: 'upcoming'
    },
    {
      venue: 'Minneapolis Institute of Art',
      title: 'Paris Couture',
      subtitle: 'The fall blockbuster, and Mia’s only ticketed show',
      description: 'More than 80 haute couture masterpieces from the Palais Galliera in Paris, spanning the late 19th century to today, with icons like Dior, Balenciaga, Schiaparelli, and Grès.',
      dates: 'October 4, 2026 to January 17, 2027',
      url: 'https://new.artsmia.org/exhibition/paris-couture',
      type: 'upcoming'
    },

    // ==================== WEISMAN ====================
    {
      venue: 'Weisman Art Museum',
      title: 'The Portfolio’s Purpose',
      subtitle: 'Print portfolios from the collection',
      description: 'Examines print portfolios from the New World/Old World exchange at the 2010 Mid-America Print Council conference, spanning screenprints, lithographs, pressure prints, and mezzotints.',
      dates: 'March 21 to August 23, 2026',
      url: 'https://wam.umn.edu/portfolios-purpose',
      type: 'current'
    },
    {
      venue: 'Weisman Art Museum',
      title: 'Tiffany Chung: indelible traces',
      subtitle: 'Survey of the research-driven cartographer of memory',
      description: 'A comprehensive survey of Chung’s embroidered and drawn maps plus sculptures, videos, and installations examining landscapes shaped by climate change, war, colonialism, and migration.',
      dates: 'September 19 to December 6, 2026',
      url: 'https://wam.umn.edu/tiffany-chung-indelible-traces',
      type: 'upcoming'
    },
    {
      venue: 'Weisman Art Museum',
      title: '‘Merciless’: Indigenous Lands Since 1776',
      subtitle: 'Natchez Beaulieu, Marlena Myles, Missy Whiteman',
      description: 'Honors Indigenous resistance across indoor and outdoor installations, re-examining 250 years of Indigenous history and emphasizing community resilience and connection to Minneapolis (Bde Óta Othúŋwe).',
      dates: 'September 26, 2026 to May 23, 2027',
      url: 'https://wam.umn.edu/merciless-indigenous-lands-1776',
      type: 'upcoming'
    },

    // ==================== MCAD ====================
    {
      venue: 'MCAD Main Gallery',
      title: 'Fragments Reimagined',
      subtitle: 'Over 35 artists respond to gun violence',
      description: 'An exhibition responding to gun violence, following the Guns in the Hands of Artists model of transforming weapons into art to spark dialogue about reform and healing through creative activism.',
      dates: 'May 30 to August 8, 2026',
      url: 'https://www.mcad.edu/events/fragments-reimagined',
      type: 'current'
    },

    // ==================== NORTHERN CLAY CENTER ====================
    {
      venue: 'Northern Clay Center',
      title: 'Eight McKnight Artists',
      subtitle: 'McKnight ceramic fellows and residents',
      description: 'The annual exhibition of work by the most recent McKnight Fellowship and Residency awardees for ceramic artists, including Birdie Boone, Sana Musasama, Elizabeth Coleman, and Peter Jadoonath.',
      dates: 'June 20 to August 9, 2026',
      url: 'https://northernclaycenter.org/2026/04/15/eight-mcknight-artists/',
      type: 'current'
    },
    {
      venue: 'Northern Clay Center',
      title: 'American Pottery Festival',
      subtitle: 'NCC’s biggest annual event',
      description: 'Ceramic artists from across the country fill the Main and Galusha galleries, with an opening night party August 28 and in-person and online sales running through early September.',
      dates: 'August 28 to 30, 2026',
      url: 'https://northernclaycenter.org/2026/06/29/american-pottery-festival-11/',
      type: 'upcoming'
    },

    // ==================== AMERICAN SWEDISH INSTITUTE ====================
    {
      venue: 'American Swedish Institute',
      title: 'Eyes as Big as Plates',
      subtitle: 'Photography by Riitta Ikonen and Karoline Hjorth',
      description: 'More than thirty surreal portraits from the duo’s long-running series: everyday people — farmers, scientists, surfers, philosophers — camouflaged in organic materials sourced from each location, shot on analog cameras.',
      dates: 'June 20 to October 25, 2026',
      url: 'https://asimn.org/exhibition/eyes-as-big-as-plates/',
      type: 'current'
    },
    {
      venue: 'American Swedish Institute',
      title: 'Presley Martin',
      subtitle: 'Installation and drawings on the Mississippi',
      description: 'Hundreds of polystyrene foam pieces collected from the Mississippi River address plastic pollution, alongside drawings made with mushroom markers on beaver-chewed wood handles.',
      dates: 'June 20 to October 25, 2026',
      url: 'https://asimn.org/exhibition/presley-martin/',
      type: 'current'
    },

    // ==================== THE M (Minnesota Museum of American Art) ====================
    {
      venue: 'Minnesota Museum of American Art',
      title: 'Queering Indigeneity',
      subtitle: 'Closing August 16',
      description: 'A celebration of 2-Spirit, Native queer, and gender-expansive artists of the Upper Midwest — 16 artists including Sharon Day, Ryan Young, and Delia Touché — emphasizing intergenerational knowledge and cultural reclamation.',
      dates: 'September 18, 2025 to August 16, 2026',
      url: 'https://mmaa.org/queering-indigeneity/',
      type: 'current'
    },
    {
      venue: 'Minnesota Museum of American Art',
      title: 'HERE, NOW',
      subtitle: 'The permanent collection in the renovated galleries',
      description: 'The M’s long-term installation of its permanent collection, arranged around human connection, with George Morrison, Louise Nevelson, Jim Denomie, Jacob Lawrence, Cara Romero, and more.',
      dates: 'Long-term installation, opened October 17, 2024',
      url: 'https://mmaa.org/here-now/',
      type: 'current'
    },
    {
      venue: 'Minnesota Museum of American Art',
      title: 'The Smell of Earth: Seitu K. Jones Working in the Elements',
      subtitle: 'Four-decade survey of the St. Paul artist',
      description: 'Drawings, paintings, sculpture, and design plus archival material on Jones’s life as a Black artist in Minnesota, centered on community and placemaking.',
      dates: 'October 22, 2026 to July 25, 2027',
      url: 'https://mmaa.org/the-smell-of-earth-the-work-of-seitu-k-jones/',
      type: 'upcoming'
    },

    // ==================== TMORA ====================
    {
      venue: 'The Museum of Russian Art',
      title: 'Poster Art of the Soviet Era',
      subtitle: 'Main Gallery exhibition',
      description: 'The paradox of the Soviet poster — breathtakingly artistic yet unapologetically ideological — traced from the experimental early years through Stalin-era formula to later modernist aesthetics.',
      dates: 'May 22 to September 27, 2026',
      url: 'https://tmora.org/2026/04/07/poster-art-of-the-soviet-era/',
      type: 'current'
    },
    {
      venue: 'The Museum of Russian Art',
      title: 'Mark Mednikov: Artist and Architect',
      subtitle: 'Solo show from the artist’s studio',
      description: 'About thirty works spanning early Soviet-era drawings to recent oil paintings and photos of buildings Mednikov designed, where architectural precision blends with the freedom of fine art.',
      dates: 'July 5 to September 27, 2026',
      url: 'https://tmora.org/2026/06/12/mark-mednikov-artist-and-architect/',
      type: 'current'
    },
    {
      venue: 'The Museum of Russian Art',
      title: 'Paintings by Elena Kalman: Catastrophe and What Survives',
      subtitle: 'Recent work by the Ukrainian-born artist',
      description: 'Landscapes, roads, and imagined environments marked by instability, reflecting on moments of disruption and what endures beyond them.',
      dates: 'July 18 to November 1, 2026',
      url: 'https://tmora.org/2026/04/19/paintings-by-elena-kalman-catastrophe-and-what-survives/',
      type: 'current'
    },

    // ==================== MILL CITY MUSEUM ====================
    {
      venue: 'Mill City Museum',
      title: 'soulforce: the movements of memory',
      subtitle: 'Free special exhibit',
      description: 'Explores collaboration and connection between Black, Indigenous, and Chicano communities and their movements for autonomy, self-determination, and liberation in the post-civil-rights era.',
      dates: 'June 18 to October 4, 2026',
      url: 'https://www.mnhs.org/millcity/activities/exhibits',
      type: 'current'
    },

    // ==================== INDIE GALLERIES ====================
    {
      venue: 'Highpoint Center for Printmaking',
      title: 'Homeward: Relief Prints by Matt Otero',
      artist: 'Matt Otero',
      description: 'Woodcut and linocut prints about returning home, which Otero frames as a return to one’s essence rather than a physical place; the crow recurs as a navigational and reflective motif. Threshold Gallery.',
      dates: 'July 2 to September 30, 2026',
      url: 'https://www.highpointprintmaking.org/calendar/2026/thresholdotero',
      type: 'current'
    },
    {
      venue: 'Highpoint Center for Printmaking',
      title: '2025–2026 Jerome Early Career Printmakers Residency Exhibition',
      artist: 'Edson Rosas, Dalton Carlson, Gabi Estrada',
      description: 'The three Jerome residents present prints, objects, and assembled environments made during their year-long residency, spanning screenprint, litho, relief, intaglio, and installation. Opening reception Friday, July 31, 6:30 to 9 pm.',
      dates: 'July 31 to September 12, 2026',
      url: 'https://www.highpointprintmaking.org/calendar/2026/jeromeexhbition',
      type: 'upcoming'
    },
    {
      venue: 'SooVAC',
      title: 'Indulgences',
      artist: 'James Ostrander',
      description: 'Densely detailed, absurdist atelier-style oil painting that playfully scrutinizes the Western canon; Ostrander’s painterly persona moves through imagined landscapes engaging Romantic, Rococo, and Surrealist traditions.',
      dates: 'July 25 to August 30, 2026',
      url: 'https://www.soovac.org/james-ostrander',
      type: 'current'
    },
    {
      venue: 'SooVAC',
      title: 'Sway',
      artist: 'Alexandra Beaumont',
      description: 'Large-scale sheer cloth banners with painted, embroidered, and beaded silhouettes of friends and neighbors, celebrating movement and stepping in rhythm as a vehicle for collective power and community.',
      dates: 'July 25 to August 30, 2026',
      url: 'https://www.soovac.org/alexandra-beaumont',
      type: 'current'
    },
    {
      venue: 'SooVAC',
      title: 'Little Black Book',
      artist: 'Marcus Rothering',
      description: 'Ceramics and fiber exploring Black queer intimacy and humor, part of SooVAC’s Front Space Residency pilot where the work evolves on-site during the run. Rug-tufting demo August 16, closing reception August 29.',
      dates: 'July 25 to August 30, 2026',
      url: 'https://www.soovac.org/marcus-rothering',
      type: 'current'
    },
    {
      venue: 'Form+Content Gallery',
      title: 'Memory Against Forgetting: FotoMatter Collective',
      artist: '18 artists including Melissa Borman, Priscilla Briggs, Xavier Tavera, Paul Shambroom',
      description: 'A photographic group show spanning lens-based work, alternative process, installation, book arts, and time-based media, framed around remembrance as resistance to erasure. Curator and artists’ talk Saturday, August 1, 4 to 6 pm.',
      dates: 'June 25 to August 1, 2026',
      url: 'https://www.formandcontent.org/exhibits/fotomatter-2026',
      type: 'current'
    },
    {
      venue: 'Form+Content Gallery',
      title: 'Tending Disorder: New Cyanotype Works by Michelle Westmark Wingard',
      artist: 'Michelle Westmark Wingard',
      description: 'Cyanotype prints, textile, and installation exploring perceived control, the reordering of broken systems, and the elevation of care. Reception Sunday, August 9, 2 to 5 pm.',
      dates: 'August 6 to September 12, 2026',
      url: 'https://www.formandcontent.org/exhibits/wingard-tending-disorder',
      type: 'upcoming'
    },
    {
      venue: 'Bockley Gallery',
      title: 'Encounters',
      artist: 'Maggie Thompson (Fond du Lac Ojibwe)',
      description: 'Centers the transformative role of adornment in resistance, solidarity, and healing, in critical dialogue with notions of Native authenticity.',
      dates: 'June 25 to August 15, 2026',
      url: 'https://bockleygallery.com/exhibition/encounters/',
      type: 'current'
    },
    {
      venue: 'Rosalux Gallery',
      title: 'Living Threads: An Immersive Installation by Hend Al-Mansour',
      artist: 'Hend Al-Mansour',
      description: 'An immersive installation about a Palestinian American woman in Minnesota, holding architecture, poetry, embroidery, and sign language in one field of vision, with screen-printed Palestinian textile patterns and ASL signage. Reception Friday, August 7, 7 to 10 pm.',
      dates: 'August 7 to August 30, 2026',
      url: 'https://www.rosaluxgallery.com/post/living-threads-an-immersive-installation-by-hend-al-mansour',
      type: 'upcoming'
    },
    {
      venue: 'Northrup King Building',
      title: 'Open Saturdays',
      artist: 'Resident NKB artists',
      description: 'Many of the building’s studio artists open their doors every Saturday afternoon — stop by and stroll through. Fall brings Summer Sizzle (August 15), Northrup King Nights (September 26), and Art Attack (November 13 to 15).',
      dates: 'Every Saturday through November 21, 2026, 12 to 4 pm',
      url: 'https://www.northrupkingbuilding.com/events',
      type: 'current'
    }
  ]
};
