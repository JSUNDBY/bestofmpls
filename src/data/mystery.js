/**
 * Mystery Itinerary — pick a price tier and a season, get a sealed-envelope
 * evening you reveal one stop at a time.
 *
 * Each itinerary is hand-curated and seasonal where it matters. The reveal
 * UI shows one card at a time so the surprise doesn't collapse on first
 * glance. Three price tiers across the three weather modes the metro
 * actually has (warm, cold, in-between).
 *
 * Slugs let us deep-link a specific mystery.
 */
module.exports = {
  slug: 'mystery',
  title: 'Mystery Itinerary',
  subtitle: 'Pick a price. Pick a season. Reveal an evening one stop at a time.',
  intro: 'Six sealed-envelope evenings. You commit to a price tier and a season; we reveal the night one stop at a time. The first card tells you when to leave the house and what to wear. The rest you find out as you go. No menus, no addresses up front, just a small set of instructions you trust us with.',

  itineraries: [
    {
      slug: 'cheap-cold-night',
      tier: '$30',
      season: 'cold',
      label: 'A $30 night, with snow on the ground',
      stops: [
        { kind: 'Leave the house at', text: '6:30 PM. Wear something you can layer. Plan for a 30-second walk in the cold between each stop.' },
        { kind: 'First stop', text: 'A booth at Mickey\'s Diner in downtown St. Paul. Order the breakfast plate and a coffee. You do not need to be in a rush. ($14)' },
        { kind: 'Walk three blocks to', text: 'The lobby of the Saint Paul Hotel. Order one drink at the lobby bar. Sit on the brocade chair. Watch the doorman. ($14)' },
        { kind: 'End the night at', text: 'A walk through the lit-up Christmas tree at Rice Park. Free, ten minutes, the right way to end an evening for thirty bucks. ($0)' },
        { kind: 'Total', text: 'About $30, plus tip. About two and a half hours. Drive home before ten.' }
      ]
    },
    {
      slug: 'mid-warm-night',
      tier: '$60',
      season: 'warm',
      label: 'A $60 night, the air still warm at sunset',
      stops: [
        { kind: 'Leave the house at', text: '6:00 PM. Wear something you would not mind sweating in slightly. The point of the evening is to be outside.' },
        { kind: 'First stop', text: 'A patio table at Bauhaus Brew Labs in Northeast Minneapolis. One pilsner, one snack from the food truck on premises. Watch the early-evening crowd. ($16)' },
        { kind: 'Walk or drive to', text: 'A pizza at Young Joni\'s replacement (Brunson\'s Pub or similar Northeast room). Sit at the bar. Order one pizza, one cocktail. ($32)' },
        { kind: 'End the night at', text: 'A walk down to the Mississippi at Boom Island Park. Sit on the rocks. Watch the river move past for ten minutes. Free. ($0)' },
        { kind: 'Total', text: 'About $60 plus tip. Three hours. Sunset around the river is the point.' }
      ]
    },
    {
      slug: 'mid-cold-night',
      tier: '$60',
      season: 'cold',
      label: 'A $60 night, when it is too cold to be outside long',
      stops: [
        { kind: 'Leave the house at', text: '6:30 PM. Heavy coat. The walking is short but the air is sharp.' },
        { kind: 'First stop', text: 'A glass of wine at Constantine, the basement bar under the Hotel Ivy in downtown Minneapolis. Read the menu slowly. ($18)' },
        { kind: 'Walk to', text: 'A bowl of khao soi at Khâluna in Lyn-Lake. Sit at the bar if it is full. Order the curry, one cocktail. ($38)' },
        { kind: 'End the night at', text: 'A drive past Lake Harriet bandshell or Lake of the Isles, lights on, one slow loop in the heated car. Free. ($0)' },
        { kind: 'Total', text: 'About $60 plus tip. Two and a half hours. The car between stops is part of the night.' }
      ]
    },
    {
      slug: 'big-warm-night',
      tier: '$100',
      season: 'warm',
      label: 'A $100 night, when summer is at peak',
      stops: [
        { kind: 'Leave the house at', text: '5:30 PM. Wear what flatters you. The first stop is on the west bank of the Mississippi.' },
        { kind: 'First stop', text: 'A cocktail on the patio at Spoon and Stable\'s bar (Bar La Grassa is also fine). Order one drink, one snack. Look downstream at the Stone Arch Bridge while you do. ($26)' },
        { kind: 'Walk to', text: 'A reservation at Owamni in the Mill District. The whole pre-colonial menu is the point; do not skip the bison. ($60)' },
        { kind: 'End the night at', text: 'A walk across the Stone Arch Bridge at golden hour. Sit on the rocks below the falls if there is room. Free. ($0)' },
        { kind: 'Total', text: 'About $100 plus tip. Three and a half hours. The bridge at sunset does most of the work.' }
      ]
    },
    {
      slug: 'big-cold-night',
      tier: '$100',
      season: 'cold',
      label: 'A $100 night, sub-zero, indoor only',
      stops: [
        { kind: 'Leave the house at', text: '6:00 PM. Park once and stay put. Coat, hat, the works.' },
        { kind: 'First stop', text: 'An aperitif at Marvel Bar, the basement room under Bachelor Farmer\'s old space in the North Loop. Order one cocktail, off-menu if you can describe what you want. ($22)' },
        { kind: 'Walk one block to', text: 'A long dinner at Spoon and Stable. Sit at the bar so you can leave when ready. Order the chef\'s tasting if it\'s on. ($72)' },
        { kind: 'End the night at', text: 'Drive home through the snow with the heat on high. Free. ($0)' },
        { kind: 'Total', text: 'About $100 plus tip. Three hours. The point is the warm rooms strung together against the cold.' }
      ]
    },
    {
      slug: 'cheap-warm-night',
      tier: '$30',
      season: 'warm',
      label: 'A $30 night, summer evening',
      stops: [
        { kind: 'Leave the house at', text: '6:00 PM. Wear shorts. Bring a light jacket for after dark.' },
        { kind: 'First stop', text: 'A bahn mi from Quang on Eat Street. Take it to go. ($10)' },
        { kind: 'Eat it at', text: 'The benches by Loring Park\'s lake, looking back at the downtown skyline. ($0)' },
        { kind: 'Walk or bike to', text: 'A free Tuesday concert at the Lake Harriet bandshell. Sit on the grass. ($0)' },
        { kind: 'End the night at', text: 'A scoop at Sebastian Joe\'s on the way home. Get the Pavarotti. ($6)' },
        { kind: 'Total', text: 'About $20 plus a tip jar at Sebastian. Three hours. The cheapest good night Minneapolis offers.' }
      ]
    }
  ]
};
