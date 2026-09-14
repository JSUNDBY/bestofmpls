/**
 * Acme Comedy Co — the flagship stand-up room. SeatEngine list page JSON-LD.
 */
const { makeSeatEngineScraper } = require('./seatengine');

module.exports = makeSeatEngineScraper({
  source: 'acme',
  label: 'Acme Comedy Co',
  listUrl: 'https://acmecomedy.seatengine.com/events/',
  base: 'https://acmecomedy.seatengine.com',
  venue: 'Acme Comedy Co',
  neighborhood: 'North Loop, Minneapolis',
  city: 'Minneapolis',
  age: '18+'
});
