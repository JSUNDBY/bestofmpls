/**
 * Laugh Camp Comedy Club at Camp Bar, St. Paul. Same SeatEngine JSON-LD
 * shape as Acme; the feed also carries the bar's trivia and music nights,
 * which the denylist drops so only comedy reaches the feed.
 */
const { makeSeatEngineScraper } = require('./seatengine');

module.exports = makeSeatEngineScraper({
  source: 'laughcamp',
  label: 'Laugh Camp Comedy Club',
  listUrl: 'https://camp-bar.net/',
  base: 'https://camp-bar.net',
  venue: 'Laugh Camp Comedy Club',
  neighborhood: 'Downtown St. Paul',
  city: 'St. Paul',
  denyTitle: /trivia|music mayhem|karaoke|bingo|dj\b|watch party|happy hour/i,
  age: '18+'
});
