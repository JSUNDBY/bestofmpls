// Dog-friendly places that aren't (yet) directory entries. They appear on
// /dog-friendly-patios/ only, with the venue's own statement as the
// source. Promote one to a real category entry when it earns a write-up.
// Not a category module on purpose (no slug/entries), so the site's
// category scanners ignore it.
module.exports = {
  extras: [
    { name: 'Stanley’s Northeast Bar Room', neighborhood: 'Northeast Minneapolis', kind: 'Bar & Grill', note: 'the "Pawtio": a three-course dog menu, tented and heated in winter, one dog per human', source: 'https://stanleysbarroom.com/' },
    { name: 'The Howe Daily Kitchen & Bar', neighborhood: 'Longfellow, Minneapolis', kind: 'Neighborhood Restaurant', note: 'year-round Paw-tio, tented and heated in winter, with a dog menu', source: 'https://howempls.com/' },
    { name: 'St. Paul Tap', neighborhood: 'West 7th, Saint Paul', kind: 'Tap House', note: 'a dedicated dog patio with its own menu; leash within reach, no dogs on chairs', source: 'https://www.stpaultapmn.com/dog-friendly-patio' },
    { name: 'Saint Paul Brewing', neighborhood: 'Dayton’s Bluff, Saint Paul', kind: 'Brewery Taproom', note: 'patio with pup treats; leashed pass-through inside only', source: 'https://stpaulbrewing.com/dogs' },
    { name: 'Urban Growler', neighborhood: 'Creative Enterprise Zone, Saint Paul', kind: 'Brewery Taproom', note: 'big dog-friendly beer garden', source: 'https://www.urbangrowlerbrewing.com/' },
    { name: 'Venn Brewing', neighborhood: 'Longfellow, Minneapolis', kind: 'Brewery Taproom', note: 'leashed pups welcome inside and out', source: 'https://www.vennbrewing.com/taproom/' },
    { name: 'Wandering Leaf Brewing', neighborhood: 'West 7th, Saint Paul', kind: 'Brewery Taproom', note: 'well-behaved dogs, leashed at all times, taproom and patio', source: 'https://wanderingleafbrewing.com/faqs' },
    { name: 'Unleashed Hounds and Hops', neighborhood: 'North Loop edge, Minneapolis', kind: 'Dog Park + Bar', note: 'indoor and outdoor off-leash park attached to the bar; leashed on the bar side', source: 'https://unleashedhoundsandhops.com/about' },
    { name: 'Brühaven', neighborhood: 'Loring Park, Minneapolis', kind: 'Brewery Taproom', note: 'welcomes pups; ask whether inside or patio-only that day', source: 'https://bruhaven.com/' },
  ]
};
