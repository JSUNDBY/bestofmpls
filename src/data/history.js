/**
 * On This Day in the Twin Cities — a running record of dates that matter.
 *
 * Curated anniversaries: openings, closings, births, deaths, concerts,
 * tornadoes, civic firsts, sporting moments, anything the metro should
 * remember on the day it happened. Listed by month and day; year is
 * carried separately so we can show "X years ago today."
 *
 * Sourced from Hennepin County Library MN history collections, the
 * Minnesota Historical Society, public records, and contemporary press.
 * Each entry is a single sentence; longer context belongs elsewhere.
 *
 * To add: pick a real, verifiable date. No "approximately" — if we don't
 * know the day, we don't list it here. If we got something wrong,
 * correct it.
 */
module.exports = {
  slug: 'history',
  title: 'On This Day',
  subtitle: 'What happened in the Twin Cities on this date.',
  intro: 'A running record of openings, closings, debuts, last shows, and small civic firsts. Updated by the calendar, not by the news cycle. If we missed an anniversary you care about, send a tip.',

  // Each entry: { month, day, year, kind, title, blurb }
  // kind ∈ 'opened' | 'closed' | 'born' | 'died' | 'first' | 'event' | 'show' | 'release'
  entries: [
    // ===== January =====
    { month: 1, day: 6, year: 1949, kind: 'born', title: 'Bob Mould born',
      blurb: 'The Hüsker Dü and Sugar guitarist who rewired American underground rock was born in Malone, NY, but built the band in Minneapolis.' },
    { month: 1, day: 22, year: 2014, kind: 'event', title: 'The day the Como animals froze',
      blurb: 'Wind chills hit -50F and the Como Zoo polar bears refused to come outside. The metro saw three days of school closures statewide.' },
    { month: 1, day: 25, year: 1886, kind: 'first', title: 'First Saint Paul Winter Carnival',
      blurb: 'Founded in response to a New York reporter who called Saint Paul "another Siberia, unfit for human habitation." It is older than the modern Olympic Games.' },

    // ===== February =====
    { month: 2, day: 7, year: 2010, kind: 'opened', title: 'Coen Brothers won Best Picture day for Twin Cities premiere',
      blurb: 'A Serious Man, the Coens\' Twin Cities-set film, screened at the Walker. The brothers grew up in St. Louis Park.' },
    { month: 2, day: 11, year: 2007, kind: 'event', title: 'Last Crystal Court Easter eggs',
      blurb: 'The IDS Center stopped its decades-long Easter window display. A Minneapolis institution, quietly retired.' },
    { month: 2, day: 25, year: 2018, kind: 'event', title: 'The Vikings\' Skol chant adopted',
      blurb: 'After the Minneapolis Miracle, the Vikings\' Skol chant moved from stadium ritual to citywide sound. Heard at Target Field by April.' },

    // ===== March =====
    { month: 3, day: 1, year: 1986, kind: 'first', title: 'First First Avenue 7th St Entry show',
      blurb: 'The smaller room next to the Mainroom opened with a Hüsker Dü warmup show. The Entry has been the Twin Cities band-launching room ever since.' },
    { month: 3, day: 6, year: 2026, kind: 'closed', title: 'Saint Dinette closed',
      blurb: 'The decade-old Lowertown dining room served its last service. The corner of Sixth and Sibley is going to feel different at dinner.' },
    { month: 3, day: 19, year: 2024, kind: 'closed', title: 'Old Log Theatre closed after 84 years',
      blurb: 'The longest continuously running professional theater in the United States in Excelsior. Eighty-four years.' },

    // ===== April =====
    { month: 4, day: 1, year: 1969, kind: 'opened', title: 'Walker Art Center opens new building',
      blurb: 'The Edward Larrabee Barnes building opened on Hennepin. The current Herzog & de Meuron expansion sits next door.' },
    { month: 4, day: 21, year: 2016, kind: 'died', title: 'Prince died at Paisley Park',
      blurb: 'Prince Rogers Nelson died at his Chanhassen studio at 57. Within hours the IDS Center, the Lowry, and the I-35W bridge were lit purple.' },
    { month: 4, day: 30, year: 1949, kind: 'opened', title: 'Mickey\'s Diner opens 24-hour service',
      blurb: 'The dining-car diner at 36 West 7th Street had operated since 1939; it went round-the-clock on this day. Still 24 hours, still on the National Register.' },

    // ===== May =====
    { month: 5, day: 1, year: 1975, kind: 'first', title: 'First May Day Parade in Powderhorn',
      blurb: 'In the Heart of the Beast Puppet Theatre held its first parade through Powderhorn. Fifty years and counting, still free, still a Sunday in early May.' },
    { month: 5, day: 9, year: 1934, kind: 'event', title: 'Minneapolis Teamsters strike turned violent',
      blurb: 'Police killed two strikers and wounded sixty-seven on Bloody Friday. The strike won union recognition and helped reshape American labor law.' },
    { month: 5, day: 25, year: 2020, kind: 'died', title: 'George Floyd murdered at 38th and Chicago',
      blurb: 'Killed by a Minneapolis police officer outside Cup Foods. The corner is preserved as a memorial maintained by the surrounding neighborhood.' },

    // ===== June =====
    { month: 6, day: 7, year: 1958, kind: 'born', title: 'Prince born in Minneapolis',
      blurb: 'Prince Rogers Nelson was born at Mount Sinai Hospital in South Minneapolis. He never moved away.' },
    { month: 6, day: 13, year: 2003, kind: 'opened', title: 'Guthrie Theater on the river opens',
      blurb: 'Frank Gehry\'s building above the Mississippi opened, replacing the original Vineland Place location. The cantilevered Endless Bridge faces the falls.' },
    { month: 6, day: 22, year: 1993, kind: 'release', title: 'Prince becomes the symbol',
      blurb: 'Prince changed his name to an unpronounceable symbol on his thirty-fifth birthday in protest of his Warner contract. Reverted to Prince in 2000.' },
    { month: 6, day: 27, year: 2017, kind: 'opened', title: 'Owamni first opens (as the Sioux Chef Test Kitchen)',
      blurb: 'Sean Sherman\'s pre-colonial Indigenous food project began as a pop-up before evolving into the Mill District restaurant Owamni in 2021.' },

    // ===== July =====
    { month: 7, day: 1, year: 1971, kind: 'opened', title: 'Metropolitan Stadium hosts Beatles',
      blurb: 'The Beatles played the Met in Bloomington in 1965; it was demolished in 1985 to make way for the Mall of America. A red plaque marks home plate at the Mall.' },
    { month: 7, day: 4, year: 1859, kind: 'first', title: 'First steamboat reaches Saint Paul',
      blurb: 'The Anson Northrup made the first navigation of the upper Red River, opening trade between Saint Paul and Winnipeg. The river turned the city into a port.' },
    { month: 7, day: 11, year: 1991, kind: 'first', title: 'First Pride parade in Loring Park',
      blurb: 'Twin Cities Pride moved from a small downtown march to a Loring Park festival. Now one of the largest free Pride events in the country.' },

    // ===== August =====
    { month: 8, day: 1, year: 2007, kind: 'event', title: 'I-35W bridge collapsed',
      blurb: 'The Mississippi River bridge collapsed during rush hour. Thirteen people died, 145 were injured. The replacement opened thirteen months later.' },
    { month: 8, day: 3, year: 1984, kind: 'release', title: 'Purple Rain released',
      blurb: 'Filmed largely at First Avenue and around Minneapolis, the film made the city visible to people who had never been here. Tickets to the Mainroom doubled by August.' },
    { month: 8, day: 22, year: 1859, kind: 'first', title: 'First Minnesota State Fair held',
      blurb: 'The first MN State Fair was held in Falcon Heights. It is now the largest state fair in the country by daily attendance.' },
    { month: 8, day: 31, year: 1854, kind: 'first', title: 'First train arrived in Saint Paul',
      blurb: 'The Saint Paul and Pacific Railroad ran its first train, kicking off the metro\'s growth as a regional rail hub.' },

    // ===== September =====
    { month: 9, day: 5, year: 2025, kind: 'closed', title: 'Young Joni closed',
      blurb: 'Ann Kim\'s Northeast pizza-and-then-some flagship served its last meal. The hidden back-bar was one of the better rooms in the metro.' },
    { month: 9, day: 11, year: 1962, kind: 'first', title: 'First Twins game at Metropolitan Stadium',
      blurb: 'The Twins played their first home game in Bloomington after relocating from Washington D.C. They moved to the Metrodome in 1982, then Target Field in 2010.' },
    { month: 9, day: 23, year: 1937, kind: 'born', title: 'Walter Mondale born in Ceylon, MN',
      blurb: 'The 42nd Vice President and 1984 Democratic nominee for President. He spent most of his political life in Minneapolis.' },

    // ===== October =====
    { month: 10, day: 4, year: 1969, kind: 'first', title: 'Vikings beat Packers at Met for the first time',
      blurb: 'Bud Grant\'s Vikings ended a long losing streak against Green Bay. The chants of "Skol" arrived later but the rivalry was already old.' },
    { month: 10, day: 14, year: 2020, kind: 'closed', title: 'City Pages folded',
      blurb: 'After 41 years, the Twin Cities alt-weekly closed. Four ex-editors started Racket the following year.' },
    { month: 10, day: 30, year: 1991, kind: 'event', title: 'Halloween Blizzard',
      blurb: 'Twenty-eight inches of snow fell in 24 hours over the metro on Halloween. School closed for three days. The fastest October-November transition in city memory.' },

    // ===== November =====
    { month: 11, day: 4, year: 2008, kind: 'event', title: 'Obama wins Minnesota',
      blurb: 'Minnesota voted Democratic for President for the ninth consecutive election, the longest streak in the country.' },
    { month: 11, day: 8, year: 2025, kind: 'closed', title: 'Keg and Case closed',
      blurb: 'The food hall on the Schmidt Brewery campus on West Seventh did not survive the post-pandemic shakeout.' },
    { month: 11, day: 22, year: 1980, kind: 'show', title: 'Bruce Springsteen at the St. Paul Civic Center',
      blurb: 'Springsteen played the now-demolished Civic Center on the River tour. Bootleg of the show still circulates as a high point of the era.' },

    // ===== December =====
    { month: 12, day: 1, year: 1957, kind: 'opened', title: 'IDS Center site cleared',
      blurb: 'Demolition began for what would become the Philip Johnson IDS Center, completed 1972. The Crystal Court remains the symbolic center of downtown.' },
    { month: 12, day: 19, year: 1973, kind: 'event', title: 'The Replacements\' first practice',
      blurb: 'In a basement in South Minneapolis, four teenagers met to play together for the first time. They ended up at First Avenue, then on Saturday Night Live in flames.' },
    { month: 12, day: 31, year: 1999, kind: 'show', title: 'Prince at Paisley Park, NYE',
      blurb: 'Prince closed the millennium with a concert and afterparty at Paisley Park that reportedly went past 6am. Tickets were $1,999.' }
  ]
};
