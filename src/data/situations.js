/**
 * "Take them to ___" — situational picks for specific occasions.
 *
 * Each situation is a small curated itinerary with a few specific stops
 * across categories (eat, drink, do). The point is to remove the decision
 * paralysis when you have a particular kind of person or evening.
 *
 * Voice: warm, specific, sensory. Picks reference verified-open places
 * (closures get caught fast on this list since the file is small).
 */
module.exports = {
  slug: 'take-them-to',
  title: 'Take them to',
  subtitle: 'For when somebody is in town and you have not figured out where to go yet.',
  intro: 'Out-of-town friends, first dates, in-laws who need impressing, a family of four with strong opinions and a stroller. The same questions keep coming up. Here are answers, opinionated and short, picked for the kind of evening you want, not just the kind of food.',

  situations: [
    {
      slug: 'out-of-town-friend',
      title: 'An out-of-town friend',
      deck: 'Someone who has never been here before, has one weekend, and asks you to plan it.',
      picks: [
        { kind: 'Saturday morning', name: 'Hi-Lo Diner', neighborhood: 'Longfellow, Minneapolis', why: 'The whole metro decoded in one meal. Diner-style breakfast in a polished 1957 dining car parked on Lake Street, with a milkshake counter and the kind of bright clean light that makes a Saturday morning feel earned. Easy, walkable, photographable.' },
        { kind: 'Saturday afternoon', name: 'Walker Sculpture Garden + Stone Arch Bridge', neighborhood: 'Loring Park / Mill District', why: 'Two of the most photographed places in the metro, twenty minutes apart by rideshare. The cherry-and-spoon is doing its job and the bridge is doing its job. They will get the geography by lunch.' },
        { kind: 'Saturday dinner', name: 'Owamni', neighborhood: 'Mill District, Minneapolis', why: 'The river view, the building, the bison tartare, and a meal that explains the place better than any museum could. Reservations book three months out, so do this part first.' },
        { kind: 'Saturday late', name: 'First Avenue', neighborhood: 'Downtown Minneapolis', why: 'See whatever is on the calendar. The black stars on the outside walls, the Mainroom or the small Entry next door, the Prince energy in the brick. The room is the show.' },
        { kind: 'Sunday brunch', name: 'Hyacinth', neighborhood: 'Cathedral Hill, St. Paul', why: 'Drive across the river. A small Italian room on Grand Avenue, forty seats, food that respects the morning. They will leave understanding why people choose St. Paul on purpose.' }
      ]
    },
    {
      slug: 'first-date',
      title: 'A first date',
      deck: 'Talk-friendly, not too loud, easy to escape if it is not working, easy to extend if it is.',
      picks: [
        { kind: 'A drink first', name: "Volstead's Emporium", neighborhood: 'Uptown, Minneapolis', why: 'The unmarked door on Lake Street with the red light. You knock, somebody lets you in, you slide into a leather booth in a low-lit speakeasy with live jazz on weekends and the kind of cocktail menu that takes itself seriously. The entry alone gives you ten minutes of conversation before you have to find your own.' },
        { kind: 'Dinner if it is working', name: 'Saint Genevieve', neighborhood: 'Linden Hills, Minneapolis', why: "Steve Brown's small French room at 50th and Bryant, candlelight on dark wood, the bar set up for walk-ins so you can keep it short or stretch it. Order one bottle of something light, share the frisée, see what happens." },
        { kind: 'Or, if Saint Genevieve is full', name: 'Hai Hai', neighborhood: 'Northeast Minneapolis', why: 'Tropical neon, plastic stools that read like a Saigon street stall, no reservation needed at the bar. Two bowls, one beer each, easier conversation than a tasting menu and twice the texture.' },
        { kind: 'A walk', name: 'Stone Arch Bridge', neighborhood: 'Mill District, Minneapolis', why: 'If it is summer, walk the whole thing at golden hour. If it is winter, walk just to the middle and back. The skyline does the work, the falls do the soundtrack, and you can stop at the railing at the right moment without it feeling staged.' },
        { kind: 'A late drink, if you want to keep going', name: 'Bar at Spoon and Stable', neighborhood: 'North Loop, Minneapolis', why: "Walk-in only, ten seats, Gavin Kaysen's program, a room moodier and quieter than the dining hall on the other side of the wall. If those seats are full, the Hewing Hotel rooftop is three blocks away with downtown lit up below." }
      ]
    },
    {
      slug: 'parents-visiting',
      title: 'Parents visiting',
      deck: 'Calm, comfortable, with one real meal. Bonus if there is something to point at and explain.',
      picks: [
        { kind: 'A nice lunch', name: 'Spoon and Stable', neighborhood: 'North Loop, Minneapolis', why: "Gavin Kaysen's flagship in a converted warehouse. The lunch menu is friendlier on the wallet than dinner and the room is the same: dark wood, white napkins, the bread program alone earns its place. You will be seated for ninety minutes and you will be glad about it." },
        { kind: 'Something cultural', name: 'Mia (Minneapolis Institute of Art)', neighborhood: 'Whittier, Minneapolis', why: 'Free admission, real collection, the Doryphoros statue in one wing and a Rothko a hundred feet later. They will be proud of you for taking them. Two hours, a coffee in the atrium, an exit through the gift shop they will spend twenty dollars in.' },
        { kind: 'A real dinner', name: 'Meritage', neighborhood: 'Downtown St. Paul', why: 'A French bistro across from Rice Park. White tablecloths, a raw bar, escargot, frites that arrive in a paper cone. Old-school in the warmest way. The kind of place that exists for exactly this purpose, and has for twenty years.' },
        { kind: 'A nightcap', name: 'The Saint Paul Hotel lobby bar', neighborhood: 'Downtown St. Paul', why: 'Walk across Rice Park after dinner. Brocade chairs, a doorman in a hat, one good cocktail in a glass that feels heavier than it should. A clean ending to the night.' }
      ]
    },
    {
      slug: 'snow-day',
      title: 'A snow day',
      deck: 'The wind chill is below zero and you do not want to drive far. Fortifying, indoor, no ambition required.',
      picks: [
        { kind: 'A late breakfast', name: 'Cafe Astoria', neighborhood: 'West Seventh, St. Paul', why: 'A long coffee, a heavy breakfast, a window seat with the snow doing its slow horizontal thing outside. The room is warm enough to thaw the toes you forgot were cold. You can stay two hours and nobody minds.' },
        { kind: 'Something to do indoors', name: 'Magers & Quinn', neighborhood: 'Uptown, Minneapolis', why: 'A used bookstore with depth. Two floors, the kind of poetry section that rewards an hour of browsing, and a top-floor room that feels like somebody stocked it for you specifically. The afternoon will absorb itself.' },
        { kind: 'A heavy dinner', name: "Cossetta's", neighborhood: 'West Seventh, St. Paul', why: 'A cafeteria-style Italian institution in a building that smells like Sunday at your aunt\'s. A giant bowl of pasta, a glass of red, the lights on and the wind locked outside. Nothing more is needed.' },
        { kind: 'A reading-light evening', name: "Sebastian Joe's", neighborhood: 'Linden Hills, Minneapolis', why: 'It is below zero. Get a Pavarotti anyway. The contradiction is the point. Eat it in the warm car on the way home with the heat blasting.' }
      ]
    },
    {
      slug: 'patio-day',
      title: 'A patio day',
      deck: 'Seventy-eight degrees and no humidity, which means everyone in the metro is outside. Pick fast.',
      picks: [
        { kind: 'Brunch outside', name: 'Tilia', neighborhood: 'Linden Hills, Minneapolis', why: "Steve Brown's neighborhood spot at 43rd and Upton. Sunday brunch on the side patio with light through the linden trees and a Bloody Mary that earns its name. Get there at 10 or accept a wait." },
        { kind: 'A long walk', name: 'Bde Maka Ska / Lake of the Isles loop', neighborhood: 'Southwest Minneapolis', why: 'The classic. Two and a half miles around the lake, paddleboards on the water, dogs everywhere. No one will be impressed but everyone will be happy.' },
        { kind: 'A drink in the sun', name: 'Bauhaus Brew Labs', neighborhood: 'Northeast Minneapolis', why: 'A massive patio with shade options, a beer hall vibe, dogs and kids both welcome. Order the pilsner. The food trucks rotate and the late-afternoon sun on the warehouse brick is the whole point.' },
        { kind: 'Dinner outside', name: 'Hai Hai patio', neighborhood: 'Northeast Minneapolis', why: 'Plastic stools, lemongrass air, the lights strung overhead at dusk, fish-sauce wings and the lime-juice cocktail that came in. The patio is small and fills the moment the sun shifts. Worth the wait.' }
      ]
    },
    {
      slug: 'hangover',
      title: 'A hangover',
      deck: 'You are not okay. You need salt, fat, water, and a quiet booth.',
      picks: [
        { kind: 'A real recovery breakfast', name: 'Keys Cafe', neighborhood: 'Several locations', why: "A diner that knows its job. Hash browns the size of your face, eggs that are actually salted, a coffee refill before you ask. Forty-five minutes and you will feel like a person again. The Raymond Avenue location is the one." },
        { kind: 'A pho if you need pho', name: 'Quang', neighborhood: 'Whittier, Minneapolis', why: 'A bowl of pho tai at 1 PM has been fixing things on Eat Street since 1989. The broth is the medicine. Order the spring rolls if you can manage another solid food.' },
        { kind: 'A walk that does not require thinking', name: 'Minnehaha Falls', neighborhood: 'South Minneapolis', why: 'Park, walk to the falls, look at falling water for as long as it takes. Free, short, restorative. The negative ions are doing more for you than you would have guessed.' },
        { kind: 'A small redemption', name: "Sebastian Joe's", neighborhood: 'Linden Hills, Minneapolis', why: 'A cone on a bench by the lake. The Pavarotti, the Raspberry Chocolate Chip, whatever. You earned a small good thing.' }
      ]
    },
    {
      slug: 'rainy-night',
      title: 'A rainy night',
      deck: 'Steady rain, low ceiling, the kind of evening that is improved by a candlelit table and someone you like.',
      picks: [
        { kind: 'A short walk in', name: 'The CC Club', neighborhood: 'Lyn-Lake, Minneapolis', why: 'A neighborhood bar that has not changed in any way that matters since the Replacements drank here in the eighties. Order a beer, slide into a booth, watch the windows fog. Stay an hour.' },
        { kind: 'Dinner', name: 'Khâluna', neighborhood: 'Lyn-Lake, Minneapolis', why: "Ann Ahmed's Lao restaurant in the room that used to be Heyday. The room glows, the green-curry-and-coconut air does what no jacket can, the cocktails are built around the food. Worth the rain." },
        { kind: 'A late drink', name: "Volstead's Emporium", neighborhood: 'Uptown, Minneapolis', why: 'A speakeasy three blocks from Khâluna with an unmarked door on Lake Street. Live jazz on weekends, leather booths, low light, and the rain keeps the crowd manageable.' },
        { kind: 'A movie if you want one', name: 'Trylon Cinema', neighborhood: 'Longfellow, Minneapolis', why: 'A 50-seat second-run cinema in a converted brick building. The popcorn is good, the projectionist cares, the rain on the way in becomes part of the night.' }
      ]
    },
    {
      slug: 'kids-in-tow',
      title: 'Kids in tow',
      deck: 'Two adults, one or two small humans, and a need for an actual meal in a place that will not collapse around children.',
      picks: [
        { kind: 'A morning out', name: 'Como Park Zoo & Conservatory', neighborhood: 'St. Paul', why: 'Free, indoor and outdoor in one stop, a polar bear in one wing and a hundred-year-old Japanese garden in the other. Strollers welcome, bathrooms accessible, nap-friendly schedule.' },
        { kind: 'A no-stress lunch', name: 'Pizzeria Lola', neighborhood: 'Linden Hills, Minneapolis', why: 'Serious pizza in a room that genuinely welcomes children. Big tables, a wood oven you can watch from the bar seats, a kid menu that does not condescend. The Lady Zaza is the move.' },
        { kind: 'A quick afternoon', name: 'Lake Harriet bandshell + paddleboat', neighborhood: 'Southwest Minneapolis', why: "A short walk, a paddleboat ride if they are old enough, the Como-Harriet Streetcar if they are not, and a Sebastian Joe's cone on the way home. Three things in two hours and everybody wins." },
        { kind: 'An early dinner', name: "Cossetta's", neighborhood: 'West Seventh, St. Paul', why: 'Cafeteria-style Italian which means kids do not have to wait. Pick what you want from the line, sit in the high-ceilinged dining room, end with a cannoli. The sound of children does not register over the lunch crowd.' }
      ]
    }
  ]
};
