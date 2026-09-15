// Featured venue pages — the partner product. Keyed by <category>--<slug>.
// Everything a featured page adds on top of the editorial entry: the menu
// (the venue's choice of items, verified against their site on `checked`),
// links, room facts, photo credit. The calendar comes from the scrape; the
// photos from public/img/places/<key>*.jpg; the words stay ours.
// Founding pilot (2026-09): free for 90 days for five friends' rooms, in
// exchange for photos, a testimonial, and letting us count clicks.
module.exports = {
  'live-music--icehouse': {
    since: '2026-09-15',
    tier: 'founding',
    tagline: 'Half restaurant, half listening room.',
    website: 'https://www.icehousempls.com',
    menuUrl: 'https://www.icehousempls.com/menu',
    reserveUrl: 'https://www.icehousempls.com',
    reserveLabel: 'Reserve a table before the show',
    facts: [
      ['Room', '300 capacity · seated · back stage + courtyard stage'],
      ['Address', '2528 Nicollet Ave, Minneapolis'],
    ],
    menuNote: 'From the Icehouse menu · full kitchen, dinner before the back-stage set',
    menu: [
      { section: 'To start', items: [['Ellsworth cheese curds', '$15'], ['Crispy pork belly', '$16'], ['Jalapeño poppers', '$10']] },
      { section: 'Dinner', items: [['Icehouse burger', '$16'], ['Chimichurri steak salad', '$22'], ['Mango chicken bowl', '$20']] },
      { section: 'After', items: [['Crème brûlée', '$12']] },
      { section: 'Bar', items: [['Negroni · Cosmopolitan', 'house'], ['Indeed Day Tripper', '$8'], ['Modelo Especial', '$7']] },
    ],
    checked: '2026-09-13',
    photoCredit: 'Icehouse',
  },
};
