/**
 * Current and upcoming art exhibitions across Twin Cities museums and galleries.
 *
 * This data is time-sensitive and goes stale fast. Refreshed monthly via
 * research pass (or eventually scrape museum calendar APIs).
 *
 * Each entry is a single exhibition with venue, dates, and optional URL.
 */
module.exports = {
  slug: 'now-showing',
  title: 'Now Showing',
  subtitle: 'Current and upcoming art exhibitions across the Twin Cities.',
  intro: 'A rolling list of what is on view at the museums, galleries, and project spaces across Minneapolis and Saint Paul. Refreshed monthly. If we missed an opening you care about, send us a tip.',
  hero_color: 'forest',
  needs_verification: true,
  last_updated: 'May 3, 2026',

  exhibitions: [
    // ==================== WALKER ART CENTER ====================
    {
      venue: 'Walker Art Center',
      title: 'Christine Sun Kim: All Day All Night',
      subtitle: 'Mid-career survey',
      description: 'First mid-career survey of the Berlin-based Deaf artist, gathering drawings, video, performance, and large-scale installations that probe sound, language, and access.',
      dates: 'March 28 to August 30, 2026',
      url: 'https://walkerart.org/calendar/2026/christine-sun-kim-all-day-all-night/',
      type: 'current'
    },
    {
      venue: 'Walker Art Center',
      title: 'Rosy Simas: A:gajë:gwah dësa’nigöëwë:nye:’ (i hope it will stir your mind)',
      subtitle: 'Multimedia installation by Seneca artist',
      description: 'A multimedia installation by the Minneapolis-based Seneca choreographer and artist exploring memory, kinship, and Indigenous presence.',
      dates: 'February 12 to July 5, 2026',
      url: 'https://walkerart.org/calendar/2026/rosy-simas/',
      type: 'current'
    },
    {
      venue: 'Walker Art Center',
      title: 'Trisha Brown and Robert Rauschenberg: Glacial Decoy',
      subtitle: 'Dance and design collaboration',
      description: 'A focused look at the landmark 1979 collaboration between choreographer Trisha Brown and artist Robert Rauschenberg, who designed sets, costumes, and projections for the dance.',
      dates: 'June 26, 2025 to May 24, 2026',
      url: 'https://walkerart.org/calendar/2025/trisha-brown-robert-rauschenberg-glacial-decoy/',
      type: 'current'
    },
    {
      venue: 'Walker Art Center',
      title: 'This Must Be the Place: Inside the Walker’s Collection',
      subtitle: 'Long-running collection rehang',
      description: 'An evolving installation drawing from the Walker’s permanent collection that traces how artists shape and respond to place.',
      dates: 'June 20, 2024 to April 29, 2029',
      url: 'https://walkerart.org/calendar/2024/this-must-be-the-place/',
      type: 'current'
    },
    {
      venue: 'Walker Art Center',
      title: 'Suzanne Jackson: What Is Love',
      subtitle: 'First career retrospective',
      description: 'Co-organized with SFMOMA, this retrospective presents more than eighty paintings and drawings from the 1960s to today, tracing Jackson’s innovative use of color, light, and structure.',
      dates: 'May 14 to August 23, 2026',
      url: 'https://walkerart.org/calendar/2026/suzanne-jackson-what-is-love/',
      type: 'upcoming'
    },

    // ==================== MIA ====================
    {
      venue: 'Minneapolis Institute of Art',
      title: 'Gifts of Japanese and Korean Art from the Mary Griggs Burke Collection',
      subtitle: 'Highlights from a landmark bequest',
      description: 'More than 170 masterpieces from the renowned Burke Collection, ranging from prehistoric works through the late 1800s, installed across the Burke and Hill galleries.',
      dates: 'December 20, 2025 to August 23, 2026',
      url: 'https://new.artsmia.org/exhibition/gifts-of-japanese-and-korean-art-from-the-mary-griggs-burke-collection',
      type: 'current'
    },
    {
      venue: 'Minneapolis Institute of Art',
      title: 'Art in Bloom 2026',
      subtitle: 'Floral interpretations of the collection',
      description: 'More than 160 floral arrangements throughout the museum’s galleries, paired with works of art. For 2026, programming extends across the full month of April.',
      dates: 'April 23 to 26, 2026, with month-long April programming',
      url: 'https://new.artsmia.org/art-in-bloom/art-in-bloom-2026',
      type: 'current'
    },
    {
      venue: 'Minneapolis Institute of Art',
      title: 'Works on Paper in the Winton Jones Gallery',
      subtitle: 'Rotating prints and drawings installation',
      description: 'A rotating selection from Mia’s prints and drawings collection presented in Gallery 344.',
      dates: 'December 6, 2025 to June 7, 2026',
      url: 'https://new.artsmia.org/exhibitions',
      type: 'current'
    },
    {
      venue: 'Minneapolis Institute of Art',
      title: 'Back from the Underworld: Mia’s Dante Tapestry Restored',
      subtitle: 'Renaissance tapestry returns to view',
      description: 'Following major conservation work supported by a 2026 TEFAF Museum Restoration Fund grant, Mia’s monumental Renaissance tapestry depicting Dante returns to the galleries.',
      dates: 'July 11, 2026 to January 31, 2027',
      url: 'https://new.artsmia.org/exhibitions/upcoming-exhibitions',
      type: 'upcoming'
    },

    // ==================== WEISMAN ====================
    {
      venue: 'Weisman Art Museum',
      title: 'More Various, More Beautiful, and More Terrible',
      subtitle: 'Selections from the WAM collection',
      description: 'A long-running installation of works by American artists drawn from the Weisman’s collection that probe the contradictions of American experience.',
      dates: 'November 12, 2022 to May 24, 2026',
      url: 'https://wam.umn.edu/more-various-more-beautiful-and-more-terrible',
      type: 'current'
    },
    {
      venue: 'Weisman Art Museum',
      title: 'The Portfolio’s Purpose',
      subtitle: 'Print portfolios from the collection',
      description: 'An exhibition examining how artists have used the print portfolio as a form for sequencing ideas, themes, and collaborative projects.',
      dates: 'March 21 to July 19, 2026',
      url: 'https://wam.umn.edu/onview',
      type: 'current'
    },
    {
      venue: 'Weisman Art Museum',
      title: 'Imagining Future Cities',
      subtitle: 'Architecture and urban futures',
      description: 'Drawing on works from the WAM collection alongside design objects, the exhibition asks how artists envision the cities of tomorrow.',
      dates: 'On view through 2026',
      url: 'https://wam.umn.edu/imagining-future-cities',
      type: 'current'
    },

    // ==================== AMERICAN SWEDISH INSTITUTE ====================
    {
      venue: 'American Swedish Institute',
      title: 'Handwoven: Between Chaos and Order',
      subtitle: 'Textile work by Emelie Rondahl',
      description: 'Contemporary textile work by Swedish artist Emelie Rondahl, rooted in the Scandinavian rya tradition and exploring themes of grief, labor, and slowness.',
      dates: 'February 14 to June 7, 2026',
      url: 'https://asimn.org/experience/exhibitions/',
      type: 'current'
    },
    {
      venue: 'American Swedish Institute',
      title: 'Nordic Echoes: Tradition in Contemporary Art',
      subtitle: 'Touring exhibition from the American-Scandinavian Foundation',
      description: 'A traveling exhibition of 44 works by 24 contemporary artists from the Upper Midwest working in wood, textile, clay, metal, and mixed media that draw on Nordic heritage.',
      dates: 'February 14 to June 7, 2026',
      url: 'https://asimn.org/experience/exhibitions/',
      type: 'current'
    },
    {
      venue: 'American Swedish Institute',
      title: 'Eyes as Big as Plates',
      subtitle: 'Photography by Riitta Ikonen and Karoline Hjorth',
      description: 'More than thirty portraits from the long-running collaborative photography series by Finnish-Norwegian artists Riitta Ikonen and Karoline Hjorth, picturing elders camouflaged in landscape.',
      dates: 'June 20 to October 25, 2026',
      url: 'https://asimn.org/experience/exhibitions/',
      type: 'upcoming'
    },

    // ==================== MMAA (Minnesota Museum of American Art) ====================
    {
      venue: 'Minnesota Museum of American Art',
      title: 'What Holds and What Breaks: 2024 McKnight Visual Artist Fellows',
      subtitle: 'McKnight Fellowship cohort show',
      description: 'Recent work by the 2024 McKnight Visual Artist Fellows, with an opening reception May 8.',
      dates: 'May 8 to July 18, 2026',
      url: 'https://mmaa.org/',
      type: 'upcoming'
    },
    {
      venue: 'Minnesota Museum of American Art',
      title: 'Gordon Coons: Gidibaajimomin / We Tell Stories',
      subtitle: 'Solo presentation by Lac Courte Oreilles Ojibwe artist',
      description: 'A focused presentation of work by Gordon Coons that draws on Ojibwe storytelling, language, and printmaking traditions.',
      dates: 'May 9 to May 31, 2026',
      url: 'https://mmaa.org/',
      type: 'upcoming'
    },

    // ==================== TMORA ====================
    {
      venue: 'The Museum of Russian Art',
      title: 'Spies and Space: Cold War Artifacts from Both Sides of the Iron Curtain',
      subtitle: 'Main Gallery exhibition',
      description: 'More than 200 toys, games, posters, comic books, and cultural artifacts from the 1950s to 1980s, drawn from collections on both sides of the Iron Curtain.',
      dates: 'February 7 to May 10, 2026',
      url: 'https://tmora.org/2026/01/05/spies-and-space-cold-war-artifacts-from-both-sides-of-the-iron-curtain/',
      type: 'current'
    },
    {
      venue: 'The Museum of Russian Art',
      title: 'Poster Art from the Soviet Era',
      subtitle: 'Graphic design from the TMORA collection',
      description: 'A selection of Soviet-era posters from TMORA’s permanent collection, tracing visual propaganda, advertising, and public art across the twentieth century.',
      dates: 'Spring 2026, ongoing',
      url: 'https://tmora.org/2026/04/07/poster-art-from-the-soviet-era/',
      type: 'current'
    },
    {
      venue: 'The Museum of Russian Art',
      title: 'Cats and Dogs in Soviet Art: Workers, Teachers, Friends',
      subtitle: 'Companion animals in Soviet visual culture',
      description: 'Paintings, prints, and decorative objects depicting cats and dogs as workers, companions, and cultural figures across Soviet visual culture.',
      dates: 'On view spring 2026',
      url: 'https://tmora.org/currentexhibitions/',
      type: 'current'
    },
    {
      venue: 'The Museum of Russian Art',
      title: 'Violins of Hope: Honoring Memory Through Music',
      subtitle: 'Restored instruments from the Holocaust',
      description: 'An exhibition of violins recovered and restored from the Holocaust, presented in the Robert J. Brokop Gallery and accompanied by a June 7 concert.',
      dates: 'May 9 to June 28, 2026',
      url: 'https://tmora.org/2026/02/20/violins-of-hope-honoring-memory-through-music/',
      type: 'upcoming'
    },

    // ==================== MILL CITY MUSEUM ====================
    {
      venue: 'Mill City Museum',
      title: 'Women with Taste: Culinary Visionaries of the Twin Cities',
      subtitle: 'Eight women who shaped Twin Cities food',
      description: 'Profiles of eight women, including Marjorie Child Husted of Betty Crocker, Reiko Weston, Leeann Chin, Rose Totino, and others, whose work as chefs, writers, and entrepreneurs reshaped local dining.',
      dates: 'September 27, 2025 to May 31, 2026',
      url: 'https://www.mnhs.org/millcity/activities/exhibits',
      type: 'current'
    },

    // ==================== INDIE GALLERIES ====================
    {
      venue: 'Bockley Gallery',
      title: 'Kite, Matthew Kirk, Grace Rosario Perkins',
      artist: 'Kite (Oglala Lakota), Matthew Kirk (Navajo), Grace Rosario Perkins (Dine/Akimel O’odham)',
      description: 'A three-artist presentation pairing Kite’s beaded deer-hide wall works that double as scores for sonic performance with new paintings and sculpture by Matthew Kirk and recent work by Grace Rosario Perkins.',
      dates: 'Spring 2026, on view through late May',
      url: 'https://bockleygallery.com/exhibitions/',
      type: 'current'
    },
    {
      venue: 'Highpoint Center for Printmaking',
      title: 'Resilience',
      artist: 'Curated by Maria Cristina Tavera. Featuring Jamaal Barber, Eric J. Garcia, Ruthann Godollei, Ricardo Levins Morales, Narsiso Martinez, Piotr Szyhalski, Ericka Walker, and Justseeds Artists’ Cooperative',
      description: 'A group print exhibition exploring how artists use woodcut, screenprint, letterpress, lithography, and stenciling to circulate radical ideas, including protest posters made in response to the ICE occupation in Minnesota.',
      dates: 'April 3 to May 16, 2026',
      url: 'https://www.highpointprintmaking.org/calendar/2026/resilience',
      type: 'current'
    },
    {
      venue: 'Form+Content Gallery',
      title: 'Open Loop 2026: Among and Between',
      artist: '32 Minnesota artists, juried by Kylie Linh Hoang',
      description: 'An annual juried survey of Minnesota artists working across media, with a juror’s talk and closing reception on Saturday, May 9, from 4 to 6 pm.',
      dates: 'On view through May 9, 2026',
      url: 'https://www.formandcontent.org/2026',
      type: 'current'
    },
    {
      venue: 'Rosalux Gallery',
      title: 'What’s Your Favorite Color?',
      artist: 'Daniel Buettner',
      description: 'New paintings from Buettner described as a nod to one of the most basic forms of human happiness, the experience of tints, shades, and tones. Reception Saturday, May 2, from 7 to 10 pm.',
      dates: 'May 2 to May 31, 2026',
      url: 'https://www.rosaluxgallery.com/post/what-s-your-favorite-color',
      type: 'current'
    },
    {
      venue: 'Form+Content Gallery',
      title: 'WARM Connections: 50th Affiliates Exhibition',
      artist: '33 women artists from the Women’s Art Registry of Minnesota, 1970s to present',
      description: 'Marks 50 years of WARM, the pioneering Minneapolis feminist art collective, with new and recent work by artists who have shaped the local and national scene.',
      dates: 'May 14 to June 20, 2026',
      url: 'https://www.formandcontent.org/2026',
      type: 'upcoming'
    },
    {
      venue: 'SooVAC',
      title: 'Collect Call 5',
      artist: 'Multiple Minnesota collectors, group presentation',
      description: 'Recurring exhibition where Minnesota collectors share a portion of their personal collections with the public. Opens after the Spring Fling fundraiser concludes the gallery’s 25th-anniversary kickoff.',
      dates: 'Spring 2026, closing June 22, 2026',
      url: 'https://www.soovac.org/exhibitions',
      type: 'upcoming'
    },
    {
      venue: 'Northrup King Building',
      title: 'Art-A-Whirl 2026',
      artist: '300+ studio artists across the building',
      description: 'Anchor venue for the 31st annual Art-A-Whirl, the nation’s largest open-studio crawl. Over 1,600 NEMAA artists open their doors across Northeast Minneapolis with hundreds concentrated at NKB.',
      dates: 'May 15 to 17, 2026',
      url: 'https://www.northrupkingbuilding.com/events/art-a-whirl',
      type: 'upcoming'
    },
    {
      venue: 'Public Functionary',
      title: 'Art-A-Whirl Open Studios at PF Studios',
      artist: 'PF Studios artists in residence and main gallery programming',
      description: 'Public Functionary opens its main gallery (144) and upstairs gallery (247) at the Northrup King Building for Art-A-Whirl, with new work from PF Studios resident artists.',
      dates: 'May 15 to 17, 2026',
      url: 'https://publicfunctionary.org/exhibits',
      type: 'upcoming'
    },
    {
      venue: 'Northrup King Building',
      title: 'First Thursday Open Studios',
      artist: 'Resident NKB artists',
      description: 'Monthly evening open studios with hundreds of artists welcoming visitors. Next dates fall on May 7 and June 4, 2026, from 5 to 9 pm.',
      dates: 'First Thursday of each month, 5 to 9 pm',
      url: 'https://www.northrupkingbuilding.com/events',
      type: 'upcoming'
    }
  ]
};
