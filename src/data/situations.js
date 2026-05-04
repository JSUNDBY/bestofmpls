/**
 * "Take them to ___" — situational picks for specific occasions.
 *
 * Each situation is a small curated itinerary with a few specific places
 * across categories (eat, drink, do). The point is to remove the decision
 * paralysis when you have a particular kind of person or evening.
 *
 * The picks here reference entries that already exist in the directory,
 * so the build can link to anchors on category pages. Names must match.
 */
module.exports = {
  slug: 'take-them-to',
  title: 'Take them to',
  subtitle: 'For when somebody is in town and you have not figured out where to go yet.',
  intro: 'Out-of-town friends, first dates, in-laws who need impressing, a family of four with strong opinions and a stroller. The same questions come up. Here are answers, opinionated and short, picked for the kind of evening, not the kind of food.',

  situations: [
    {
      slug: 'out-of-town-friend',
      title: 'An out-of-town friend',
      deck: 'Someone who has never been here before, has one weekend, and asks you to plan it.',
      picks: [
        { kind: 'Saturday morning', name: 'Hi-Lo Diner', neighborhood: 'Longfellow, Minneapolis', why: 'Everything is decoded for them in one meal. Diner-style breakfast in a chrome 1957 dining car. Easy.' },
        { kind: 'Saturday afternoon', name: 'Walker Sculpture Garden + Stone Arch Bridge', neighborhood: 'Loring Park / Mill District', why: 'Two of the most photographed places in the metro, an easy bike or rideshare apart. They will get the geography.' },
        { kind: 'Saturday dinner', name: 'Owamni', neighborhood: 'Mill District, Minneapolis', why: 'The river view, the building, and a meal that explains the place better than most museums could.' },
        { kind: 'Saturday late', name: 'First Avenue', neighborhood: 'Downtown Minneapolis', why: 'See whatever is on the calendar. The room is the show.' },
        { kind: 'Sunday brunch', name: 'Hyacinth', neighborhood: 'Cathedral Hill, St. Paul', why: 'Drive across the river. Good Italian, civic pride. They will leave understanding why people choose St. Paul on purpose.' }
      ]
    },
    {
      slug: 'first-date',
      title: 'A first date',
      deck: 'Talk-friendly, not too loud, easy to escape if it is not working.',
      picks: [
        { kind: 'A drink first', name: 'Bar Brigade', neighborhood: 'St. Paul', why: 'A small French-leaning bar that flatters everyone in it. Quiet enough to actually hear the person talk.' },
        { kind: 'Dinner if it goes well', name: 'Saint Genevieve', neighborhood: 'Linden Hills, Minneapolis', why: 'A walk-in seat at the bar reads as casual. The room is warm.' },
        { kind: 'A walk if it is summer', name: 'Lake Harriet bandshell', neighborhood: 'Southwest Minneapolis', why: 'Free music if it is the season. Long enough to walk if you need it. Easy to end.' },
        { kind: 'A second drink if you want to', name: 'Marvel Bar', neighborhood: 'North Loop, Minneapolis', why: 'A real cocktail in a basement room. The signal is "I take this seriously" without being too much.' }
      ]
    },
    {
      slug: 'parents-visiting',
      title: 'Parents visiting',
      deck: 'Calm, comfortable, with a real dinner. Bonus if there is something to point at and explain.',
      picks: [
        { kind: 'A nice lunch', name: 'Spoon and Stable', neighborhood: 'North Loop, Minneapolis', why: 'Gavin Kaysen\'s flagship. The lunch menu is friendlier on the wallet than dinner and the room is the same.' },
        { kind: 'Something cultural', name: 'Mia (Minneapolis Institute of Art)', neighborhood: 'Whittier, Minneapolis', why: 'Free admission. Real collection. They will be proud of you for taking them.' },
        { kind: 'A real dinner', name: 'Meritage', neighborhood: 'Downtown St. Paul', why: 'A French bistro across from Rice Park. Old-school, warm, the kind of place that exists for exactly this purpose.' },
        { kind: 'A nightcap', name: 'Saint Paul Hotel lobby bar', neighborhood: 'Downtown St. Paul', why: 'Walk across the park. Order one good thing. A clean ending.' }
      ]
    },
    {
      slug: 'snow-day',
      title: 'A snow day',
      deck: 'The wind chill is below zero and you do not want to drive far. Fortifying, indoor, no ambition required.',
      picks: [
        { kind: 'A late breakfast', name: 'Cafe Astoria', neighborhood: 'West Seventh, St. Paul', why: 'A long coffee, a heavy breakfast, a window seat. You can stay two hours and nobody minds.' },
        { kind: 'Something to do indoors', name: 'Magers & Quinn', neighborhood: 'Uptown, Minneapolis', why: 'A used bookstore with depth. The kind of place that absorbs an afternoon without you noticing.' },
        { kind: 'A heavy dinner', name: 'Cossetta\'s', neighborhood: 'West Seventh, St. Paul', why: 'A cafeteria-style Italian institution, a giant bowl of pasta, lights on, warm room. Nothing more is needed.' },
        { kind: 'A reading-light evening', name: 'Sebastian Joe\'s for ice cream anyway', neighborhood: 'Linden Hills, Minneapolis', why: 'It is below zero. Get the Pavarotti. The contradiction is the point.' }
      ]
    },
    {
      slug: 'patio-day',
      title: 'A patio day',
      deck: 'Seventy-eight degrees and no humidity, which means everyone in the metro is outside. Pick fast.',
      picks: [
        { kind: 'Brunch outside', name: 'The Lowry', neighborhood: 'Uptown, Minneapolis', why: 'A patio that catches morning sun. The kind of breakfast you sit through for two hours and complain about nothing.' },
        { kind: 'A long walk', name: 'Bde Maka Ska / Lake of the Isles loop', neighborhood: 'Southwest Minneapolis', why: 'The classic. Two-and-a-half miles around the lake. No one will be impressed but everyone will be happy.' },
        { kind: 'A drink in the sun', name: 'Bauhaus Brew Labs', neighborhood: 'Northeast Minneapolis', why: 'A massive patio with shade options. Wide-open, dog-friendly, kid-friendly, tall-cans-of-good-pilsner-friendly.' },
        { kind: 'Dinner outside', name: 'Tilia patio', neighborhood: 'Linden Hills, Minneapolis', why: 'Steve Brown\'s neighborhood spot. The patio fills early. Worth the wait.' }
      ]
    },
    {
      slug: 'hangover',
      title: 'A hangover',
      deck: 'You are not okay. You need salt, fat, water, and a quiet booth.',
      picks: [
        { kind: 'A real recovery breakfast', name: 'Hen House Eats at Keys Cafe', neighborhood: 'Several locations', why: 'A diner that knows its job. Hash browns, eggs, coffee, a window. You will be fine in 45 minutes.' },
        { kind: 'A pho if you need pho', name: 'Quang', neighborhood: 'Whittier, Minneapolis', why: 'A bowl of pho tai at 1pm fixes things. Has fixed things in Minneapolis since 1989.' },
        { kind: 'A walk that does not require thinking', name: 'Minnehaha Falls', neighborhood: 'South Minneapolis', why: 'Park, walk to the falls, look at falling water. Free, short, restorative.' },
        { kind: 'A small redemption', name: 'Sebastian Joe\'s', neighborhood: 'Linden Hills, Minneapolis', why: 'A cone on a bench. You earned a small good thing.' }
      ]
    },
    {
      slug: 'rainy-night',
      title: 'A rainy night',
      deck: 'Steady rain, low ceiling, the kind of evening that is improved by a candlelit table and someone you like.',
      picks: [
        { kind: 'A short walk in', name: 'The CC Club', neighborhood: 'Lyn-Lake, Minneapolis', why: 'A neighborhood bar that has not changed in any way that matters. Order a beer. Stay an hour.' },
        { kind: 'Dinner', name: 'Khâluna', neighborhood: 'Lyn-Lake, Minneapolis', why: 'Ann Ahmed\'s Lao restaurant. The room glows. Food worth the rain.' },
        { kind: 'A late drink', name: 'Constantine', neighborhood: 'Downtown Minneapolis', why: 'A basement bar under the Hotel Ivy. Quiet. The walk through the lobby in the rain is part of the night.' },
        { kind: 'A movie if you want one', name: 'Trylon Cinema', neighborhood: 'Longfellow, Minneapolis', why: 'A 50-seat second-run cinema. The right size for a rainy night.' }
      ]
    },
    {
      slug: 'kids-in-tow',
      title: 'Kids in tow',
      deck: 'Two adults, one or two small humans, and a need for an actual meal in a place that will not collapse around children.',
      picks: [
        { kind: 'A morning out', name: 'Como Park Zoo & Conservatory', neighborhood: 'St. Paul', why: 'Free, indoor and outdoor, polar bears and Japanese garden in the same trip. Nap-friendly.' },
        { kind: 'A no-stress lunch', name: 'Pizza Lola', neighborhood: 'Linden Hills, Minneapolis', why: 'Serious pizza in a room that genuinely welcomes children. Big tables, kid menu without condescension.' },
        { kind: 'A quick afternoon', name: 'Lake Harriet bandshell + paddleboat', neighborhood: 'Southwest Minneapolis', why: 'A short walk, a paddleboat ride, a Sebastian Joe\'s cone on the way home.' },
        { kind: 'An early dinner', name: 'Saint Dinette\'s replacement, or Cossetta\'s', neighborhood: 'St. Paul', why: 'Cossetta\'s is cafeteria-style which means kids do not have to wait. Italian comfort food in a room with high ceilings.' }
      ]
    }
  ]
};
