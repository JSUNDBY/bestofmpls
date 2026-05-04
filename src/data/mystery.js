/**
 * Mystery Itinerary — pick a price tier and a season, get a sealed-envelope
 * evening you reveal one stop at a time.
 *
 * Each itinerary defines a kind of evening (e.g. "$60, cold season") and
 * carries multiple `variants`. The reveal page picks a variant at random,
 * and a "Re-roll" button lets the user swap to a different variant within
 * the same kind of evening. So the same envelope can produce a different
 * night each time you tap it, but always within the same shape.
 *
 * Voice: calm, MN, no superlatives, no em-dashes. Each stop is short.
 */
module.exports = {
  slug: 'mystery',
  title: 'Mystery Itinerary',
  subtitle: 'Pick a price. Pick a season. Reveal an evening one stop at a time.',
  intro: 'Six sealed-envelope evenings, each with multiple versions inside. You commit to a price tier and a season; we pull one specific night out of the envelope and reveal it stop by stop. Tap "re-roll" if you want a different version of the same kind of night. No menus, no addresses up front, just a small set of instructions you trust us with.',

  itineraries: [
    {
      slug: 'cheap-cold-night',
      tier: '$30',
      season: 'cold',
      label: 'A $30 night, with snow on the ground',
      variants: [
        {
          stops: [
            { kind: 'Leave the house at', text: '6:30 PM. Wear something you can layer. Plan for a 30-second walk in the cold between each stop.' },
            { kind: 'First stop', text: "A booth at Mickey's Diner in downtown St. Paul. Order the breakfast plate and a coffee. You do not need to be in a rush. ($14)" },
            { kind: 'Walk three blocks to', text: 'The lobby of the Saint Paul Hotel. Order one drink at the lobby bar. Sit on the brocade chair. Watch the doorman. ($14)' },
            { kind: 'End the night at', text: 'A walk through the lit-up Christmas tree at Rice Park. Free, ten minutes, the right way to end an evening for thirty bucks. ($0)' },
            { kind: 'Total', text: 'About $30, plus tip. About two and a half hours. Drive home before ten.' }
          ]
        },
        {
          stops: [
            { kind: 'Leave the house at', text: '6:00 PM. Heavy coat, real boots. The walks are short but the wind is real.' },
            { kind: 'First stop', text: 'A bowl of pho tai at Quang on Eat Street. Get the spring rolls if you have ever liked spring rolls. ($16)' },
            { kind: 'Drive north to', text: 'Spyhouse on Hennepin. Order a coffee, sit by the window, watch Eat Street do its thing in the snow. ($6)' },
            { kind: 'End the night at', text: 'A slow drive home with the heat on and a podcast you have been meaning to start. Free. ($0)' },
            { kind: 'Total', text: 'About $25 plus tip. Two hours. Easy on a Tuesday.' }
          ]
        },
        {
          stops: [
            { kind: 'Leave the house at', text: '6:30 PM. Cossetta\'s gets crowded after seven; beat the line.' },
            { kind: 'First stop', text: "Cafeteria-style pasta at Cossetta's on West Seventh. The bolognese, a salad, a glass of red. Sit upstairs if you can. ($22)" },
            { kind: 'Walk one block to', text: 'A short loop through Mears Park in Lowertown. The trees are lit through the winter. Six minutes. ($0)' },
            { kind: 'End the night at', text: 'A drink at the Saint Paul Hotel lobby bar. One drink, watch the snow out the windows. ($10)' },
            { kind: 'Total', text: 'About $32 plus tip. Two hours. The whole night within a six-block radius.' }
          ]
        }
      ]
    },
    {
      slug: 'mid-warm-night',
      tier: '$60',
      season: 'warm',
      label: 'A $60 night, the air still warm at sunset',
      variants: [
        {
          stops: [
            { kind: 'Leave the house at', text: '6:00 PM. Wear something you would not mind sweating in slightly. The point of the evening is to be outside.' },
            { kind: 'First stop', text: 'A patio table at Bauhaus Brew Labs in Northeast Minneapolis. One pilsner, one snack from the food truck on premises. Watch the early-evening crowd. ($16)' },
            { kind: 'Walk or drive to', text: 'A pizza at a Northeast room (Black Sheep Pizza Quincy Street, or Pizzeria Lola if you go south). Sit at the bar. Order one pizza, one cocktail. ($32)' },
            { kind: 'End the night at', text: 'A walk down to the Mississippi at Boom Island Park. Sit on the rocks. Watch the river move past for ten minutes. Free. ($0)' },
            { kind: 'Total', text: 'About $60 plus tip. Three hours. Sunset around the river is the point.' }
          ]
        },
        {
          stops: [
            { kind: 'Leave the house at', text: '5:30 PM. The point of starting early is the light.' },
            { kind: 'First stop', text: 'A drink on the Indeed Brewing patio in Northeast. One sour, one snack. Watch the warehouses turn gold. ($14)' },
            { kind: 'Drive south to', text: "A pizza at Pizzeria Lola in Linden Hills. One pizza, one cocktail at the bar. Order the My Sha-Ra-Ra if it's on. ($34)" },
            { kind: 'End the night at', text: 'A free band at the Lake Harriet bandshell if it is the right night, or the loop walk around Bde Maka Ska if it is not. ($0)' },
            { kind: 'Total', text: 'About $48 plus tip. Three hours, west-to-east through the city.' }
          ]
        },
        {
          stops: [
            { kind: 'Leave the house at', text: '6:30 PM. The kind of night where you want a real drink and a real meal but no fuss.' },
            { kind: 'First stop', text: 'A glass of wine at the Spoon and Stable bar (or Bar La Grassa if Spoon is full). Sit at the bar. ($18)' },
            { kind: 'Walk to', text: 'A bowl at Demi if you can get a walk-in seat, or Hai Hai for the patio if you cannot. ($38)' },
            { kind: 'End the night at', text: 'A walk across the Stone Arch Bridge. Sit on the rocks below the falls if there is room. ($0)' },
            { kind: 'Total', text: 'About $56 plus tip. Three hours. North Loop end-to-end.' }
          ]
        }
      ]
    },
    {
      slug: 'mid-cold-night',
      tier: '$60',
      season: 'cold',
      label: 'A $60 night, when it is too cold to be outside long',
      variants: [
        {
          stops: [
            { kind: 'Leave the house at', text: '6:30 PM. Heavy coat. The walking is short but the air is sharp.' },
            { kind: 'First stop', text: 'A glass of wine at Constantine, the basement bar under the Hotel Ivy in downtown Minneapolis. Read the menu slowly. ($18)' },
            { kind: 'Walk to', text: 'A bowl of khao soi at Khâluna in Lyn-Lake. Sit at the bar if it is full. Order the curry, one cocktail. ($38)' },
            { kind: 'End the night at', text: 'A drive past Lake Harriet bandshell or Lake of the Isles, lights on, one slow loop in the heated car. Free. ($0)' },
            { kind: 'Total', text: 'About $60 plus tip. Two and a half hours. The car between stops is part of the night.' }
          ]
        },
        {
          stops: [
            { kind: 'Leave the house at', text: '6:00 PM. Park once in the North Loop and walk between stops.' },
            { kind: 'First stop', text: "Marvel Bar, the basement room under the Bachelor Farmer's old space. Order one cocktail, off-menu if you can describe what you want. ($22)" },
            { kind: 'Walk one block to', text: 'A long dinner at Bar La Grassa. Sit at the bar so you can leave when ready. The pasta tastings are usually two pastas plus a salad. ($34)' },
            { kind: 'End the night at', text: 'A short walk through the warehouse-conversion blocks of the North Loop on the way back to the car. Free. ($0)' },
            { kind: 'Total', text: 'About $56 plus tip. Two and a half hours. Eight square blocks of the city.' }
          ]
        },
        {
          stops: [
            { kind: 'Leave the house at', text: '6:00 PM. St. Paul tonight, leave Minneapolis behind for an evening.' },
            { kind: 'First stop', text: "A drink at the Saint Paul Hotel lobby bar. Order something old-fashioned, sit on the brocade. ($16)" },
            { kind: 'Walk across Rice Park to', text: 'A French dinner at Meritage. Sit at the bar if there is room. The frites are non-negotiable. ($40)' },
            { kind: 'End the night at', text: 'A slow drive past the Cathedral lit up against the night sky. ($0)' },
            { kind: 'Total', text: 'About $56 plus tip. Two and a half hours. The St. Paul version of a real night out.' }
          ]
        }
      ]
    },
    {
      slug: 'big-warm-night',
      tier: '$100',
      season: 'warm',
      label: 'A $100 night, when summer is at peak',
      variants: [
        {
          stops: [
            { kind: 'Leave the house at', text: '5:30 PM. Wear what flatters you. The first stop is on the west bank of the Mississippi.' },
            { kind: 'First stop', text: "A cocktail on the patio at Spoon and Stable's bar. Order one drink, one snack. Look downstream at the Stone Arch Bridge while you do. ($26)" },
            { kind: 'Walk to', text: 'A reservation at Owamni in the Mill District. The whole pre-colonial menu is the point; do not skip the bison. ($60)' },
            { kind: 'End the night at', text: 'A walk across the Stone Arch Bridge at golden hour. Sit on the rocks below the falls if there is room. Free. ($0)' },
            { kind: 'Total', text: 'About $100 plus tip. Three and a half hours. The bridge at sunset does most of the work.' }
          ]
        },
        {
          stops: [
            { kind: 'Leave the house at', text: '5:30 PM. St. Paul tonight, but a careful one.' },
            { kind: 'First stop', text: 'A drink at the bar at Hyacinth in Cathedral Hill. The Negroni is the right call. ($18)' },
            { kind: 'Stay for dinner', text: 'A long Italian dinner at Hyacinth itself. Pasta, a second glass, dessert. Sit upstairs if you can. ($72)' },
            { kind: 'End the night at', text: 'A walk down Summit Avenue at golden hour. The mansions are floodlit by sunset. ($0)' },
            { kind: 'Total', text: 'About $90 plus tip. Three hours. The St. Paul version of doing it right.' }
          ]
        },
        {
          stops: [
            { kind: 'Leave the house at', text: '6:00 PM. Northeast tonight. Park once and walk.' },
            { kind: 'First stop', text: 'A glass of orange wine at the Bar Brigade outpost or Indeed Brewing patio if you want a beer. ($16)' },
            { kind: 'Dinner at', text: 'A reservation at Brunson\'s Pub or Hai Hai depending on your mood. Order generously. ($66)' },
            { kind: 'End the night at', text: 'A short drive to the Stone Arch Bridge. Walk halfway and back. Watch the city pretend to be a smaller city. ($0)' },
            { kind: 'Total', text: 'About $82 plus tip. Three hours. Northeast in summer is at peak.' }
          ]
        }
      ]
    },
    {
      slug: 'big-cold-night',
      tier: '$100',
      season: 'cold',
      label: 'A $100 night, sub-zero, indoor only',
      variants: [
        {
          stops: [
            { kind: 'Leave the house at', text: '6:00 PM. Park once and stay put. Coat, hat, the works.' },
            { kind: 'First stop', text: "An aperitif at Marvel Bar, the basement room under Bachelor Farmer's old space in the North Loop. Order one cocktail, off-menu if you can describe what you want. ($22)" },
            { kind: 'Walk one block to', text: "A long dinner at Spoon and Stable. Sit at the bar so you can leave when ready. Order the chef's tasting if it's on. ($72)" },
            { kind: 'End the night at', text: 'Drive home through the snow with the heat on high. Free. ($0)' },
            { kind: 'Total', text: 'About $100 plus tip. Three hours. The point is the warm rooms strung together against the cold.' }
          ]
        },
        {
          stops: [
            { kind: 'Leave the house at', text: '5:45 PM. North Loop tonight. The Demi reservation is the anchor.' },
            { kind: 'First stop', text: 'One cocktail at the bar at Demi or, if you want a quieter pre-meal drink, at the Hewing Hotel lobby bar. ($20)' },
            { kind: 'Dinner at', text: "A tasting menu at Demi if you can get one. The room is small and the experience runs about two hours. ($75)" },
            { kind: 'End the night at', text: 'A drive past the IDS Crystal Court lit up empty after hours. Free. ($0)' },
            { kind: 'Total', text: 'About $95 plus tip. Three and a half hours. A serious meal, no walking.' }
          ]
        },
        {
          stops: [
            { kind: 'Leave the house at', text: '6:00 PM. Tonight is St. Paul. Drive across the river and stay there.' },
            { kind: 'First stop', text: 'A drink at the Saint Paul Hotel lobby bar. The room is hotel-bar perfect, slow, dim, low ceilings. ($18)' },
            { kind: 'Walk across Rice Park to', text: 'A long French dinner at Meritage. Get the steak frites, get a second glass of wine. Order the dessert you usually skip. ($72)' },
            { kind: 'End the night at', text: 'A slow walk through Rice Park back to the car. Five minutes. The snow on the trees is doing the work. ($0)' },
            { kind: 'Total', text: 'About $90 plus tip. Three hours. The St. Paul cold-night classic.' }
          ]
        }
      ]
    },
    {
      slug: 'cheap-warm-night',
      tier: '$30',
      season: 'warm',
      label: 'A $30 night, summer evening',
      variants: [
        {
          stops: [
            { kind: 'Leave the house at', text: '6:00 PM. Wear shorts. Bring a light jacket for after dark.' },
            { kind: 'First stop', text: 'A bahn mi from Quang on Eat Street. Take it to go. ($10)' },
            { kind: 'Eat it at', text: "The benches by Loring Park's lake, looking back at the downtown skyline. ($0)" },
            { kind: 'Walk or bike to', text: 'A free Tuesday concert at the Lake Harriet bandshell. Sit on the grass. ($0)' },
            { kind: "End the night at", text: "A scoop at Sebastian Joe's on the way home. Get the Pavarotti. ($6)" },
            { kind: 'Total', text: 'About $20 plus a tip jar at Sebastian. Three hours. The cheapest good night Minneapolis offers.' }
          ]
        },
        {
          stops: [
            { kind: 'Leave the house at', text: '5:30 PM. Bring a blanket if you have one.' },
            { kind: 'First stop', text: 'A slice at Pizzeria Lola in Linden Hills. The walk-up window is fastest if there is one. ($8)' },
            { kind: 'Walk to', text: 'Lake Harriet, follow the path counter-clockwise to the bandshell. Free music if it is the right night. Free either way. ($0)' },
            { kind: 'End the night at', text: 'A cone at Pumphouse Creamery on Chicago, on the way home. Their salted caramel is the call. ($6)' },
            { kind: 'Total', text: 'About $14 plus tips. Three hours. The kind of night that is mostly free.' }
          ]
        },
        {
          stops: [
            { kind: 'Leave the house at', text: '6:00 PM. Tonight goes south.' },
            { kind: 'First stop', text: 'Tacos al pastor at El Burrito Mercado on the West Side, or Boca Chica around the corner. Order two tacos and an horchata. ($12)' },
            { kind: 'Drive to', text: "Crosby Farm Park along the river. Walk the trail to the lily pond. The river is moving and the city is gone. ($0)" },
            { kind: 'End the night at', text: 'A scoop at Izzy\'s on Marshall Avenue on the way home. The Crookie is the move. ($6)' },
            { kind: 'Total', text: 'About $18 plus tips. Three hours. Saint Paul end-to-end for under twenty bucks.' }
          ]
        }
      ]
    }
  ]
};
