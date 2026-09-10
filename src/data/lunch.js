// Where Lunch Survived — the lunch-meeting guide. Every pick verified
// 2026-09-09 from the restaurant's OWN posted hours (three research passes,
// ~75 rooms checked, 26 found permanently closed; workings in the session
// research files). Rule: own-site hours or it doesn't ship — the
// "call first" list holds the rooms that are almost certainly right but
// rest on secondary sources. Lunch hours are volatile; re-verify on edit.
module.exports = {
  slug: 'lunch',
  title: 'Where Lunch Survived: The Twin Cities Lunch-Meeting Guide',
  h1: 'Where lunch survived.',
  seoDescription: 'The Twin Cities restaurants still serving a real weekday lunch in 2026, verified from their own posted hours: power-lunch rooms, bookable workhorses, and the counters worth the line. Business lunch, Minneapolis and St. Paul.',
  intro: 'Lunch went away after the pandemic. Not metaphorically: we checked about seventy-five rooms that once served it, and twenty-six are gone for good, with most of the survivors open at four. What is left is worth knowing cold, because a good lunch meeting still does what it always did. Every entry below was verified from the restaurant’s own posted hours in September 2026. Hours move with staffing; when in doubt, the phone still works.',
  checked: 'Verified September 2026 from each restaurant’s own posted hours.',
  sections: [
    {
      title: 'The deal closers',
      blurb: 'White tablecloths, real quiet, reservations that get honored. Book these when the lunch is the meeting.',
      picks: [
        { name: "Murray's", hood: 'Downtown Minneapolis', hours: 'Lunch Tue–Thu 11–1:30', address: '26 S 6th St, Minneapolis', why: 'The purpose-built deal lunch since 1946. Booths, hush, and a two-and-a-half-hour window that forces everyone to get to the point.' },
        { name: 'Mara', hood: 'Downtown Minneapolis', hours: 'Lunch Mon–Sat 11–2', address: '245 Hennepin Ave, Minneapolis', why: 'The Four Seasons room with a rotating prix-fixe lunch. The safest impress-a-client table in the metro, six days a week.' },
        { name: "Manny's Steakhouse", hood: 'Downtown Minneapolis', hours: 'Daily from 7am, straight through', address: '825 Marquette Ave, Minneapolis', why: 'All-day steakhouse service means no window anxiety. When the lunch is the message, this is the room that sends it.' },
        { name: 'St. Paul Grill', hood: 'Downtown St. Paul', hours: 'Lunch Mon–Sat 11–2', address: '350 Market St, St. Paul', why: 'Still the definitive St. Paul business lunch: white tablecloths, deep booths, a view of Rice Park, and a kitchen that respects the hour.' },
        { name: 'Zelo', hood: 'Downtown Minneapolis', hours: 'Lunch Tue–Thu 11:30–2', address: '831 Nicollet Mall, Minneapolis', why: 'The Nicollet Mall business-Italian classic, back after three dark years with a dedicated lunch service. Book the midweek slot.' },
        { name: 'W.A. Frost & Company', hood: 'Cathedral Hill, St. Paul', hours: 'Tue–Thu from noon, Fri from 11', address: '374 Selby Ave, St. Paul', why: 'The prettiest conversation-viable room in either city, and in season the garden is the best lunch table in Minnesota.' },
        { name: 'Indígena by Owamni', hood: 'Mill District, Minneapolis', hours: 'Tue–Sun from 11am', address: '806 S 2nd St, Minneapolis', why: 'Sean Sherman’s kitchen moved into the Guthrie in June 2026 and tripled in size. The statement lunch: bring the guest you want to remember it.' },
      ],
    },
    {
      title: 'The workhorses',
      blurb: 'Bookable, conversation-viable, and actually open. Where most of the metro’s working lunches happen now.',
      picks: [
        { name: 'The Freehouse', hood: 'North Loop, Minneapolis', hours: 'Mon–Fri from 11am', address: '701 N Washington Ave, Minneapolis', why: 'The North Loop default: big booths, all five weekdays, a menu the whole table can agree on, and nobody hovering for the table.' },
        { name: 'Red Rabbit', hood: 'North Loop, Minneapolis', hours: 'Tue–Fri from 11am', address: '201 N Washington Ave, Minneapolis', why: 'Pizza and pasta you can book: fast enough for an hour, casual enough for a team, good enough that nobody feels managed.' },
        { name: 'Smack Shack', hood: 'North Loop, Minneapolis', hours: 'Daily from 11am', address: '603 N Washington Ave, Minneapolis', why: 'A lobster roll makes any meeting feel like a win. Spacious, reservable, seven days a week.' },
        { name: 'EaTo', hood: 'Mill District, Minneapolis', hours: 'Mon–Fri from 11am', address: '305 S Washington Ave, Minneapolis', why: 'Jamie Malone’s Italian in the old Eastside space, holding down weekday lunch on a stretch that lost most of its rooms.' },
        { name: 'Red Cow', hood: 'North Loop + Selby, St. Paul', hours: 'Tue–Fri from 11am, closed Mon', address: '208 1st Ave N, Minneapolis · 393 Selby Ave, St. Paul', why: 'Polished burgers and a wine list on both sides of the river. Note the St. Paul room moved from Grand Avenue to Selby at Western.' },
        { name: "DeGidio's", hood: 'West 7th, St. Paul', hours: 'Mon–Fri from 11am', address: '425 7th St W, St. Paul', why: 'The sleeper. Old-school red-sauce supper club with weekday-lunch-first hours and booths quiet enough to actually talk business.' },
        { name: "Brit's Pub", hood: 'Downtown Minneapolis', hours: 'Weekdays from 11:30am', address: '1110 Nicollet Mall, Minneapolis', why: 'Nooks inside, lawn bowling upstairs in season. Call ahead on event days; the lawn does private parties.' },
        { name: 'Fogo de Chão', hood: 'Downtown Minneapolis', hours: 'Mon–Fri 11–3', address: '645 Hennepin Ave, Minneapolis', why: 'Continuous service and lunch pricing. Better for the relationship lunch than the note-taking one; hard to write while the meat keeps coming.' },
      ],
    },
    {
      title: 'Casual, counter, and worth it',
      blurb: 'No tablecloths, sometimes no reservations. Let the food do the hosting.',
      picks: [
        { name: 'Gai Noi', hood: 'Loring Park, Minneapolis', hours: 'Daily from 11am, walk-in only', address: '1610 Harmon Pl, Minneapolis', why: 'The best food on this page. No reservations at any size, but at noon on a Tuesday the room is yours.' },
        { name: 'Cossetta', hood: 'West 7th, St. Paul', hours: 'Daily from 11am', address: '211 7th St W, St. Paul', why: 'Counter-service and loud, which is the point. The casual meeting where the mostaccioli carries the conversation.' },
        { name: "Broders' Pasta Bar", hood: 'Fulton, Minneapolis', hours: 'Daily from 11am, walk-in only', address: '5000 Penn Ave S, Minneapolis', why: 'Real table service, no reservations. Arrive at 11:15 and the risk disappears; the cucina across the street handles the grab-and-go version.' },
        { name: "Cecil's Deli", hood: 'Highland Park, St. Paul', hours: 'Daily 9–8', address: '651 Cleveland Ave S, St. Paul', why: 'A proper Jewish deli since 1949 with a sit-down room in back. Order the Reuben, skip the formality.' },
        { name: "Kramarczuk's", hood: 'Northeast Minneapolis', hours: 'Tue–Sat from 10am', address: '215 E Hennepin Ave, Minneapolis', why: 'Cafeteria-line sausage and pierogi with room to spread out. Now closed Sunday and Monday, a quiet sign of the times.' },
        { name: "Brunson's Pub", hood: 'Payne-Phalen, St. Paul', hours: 'Daily from 11am', address: '956 Payne Ave, St. Paul', why: 'The East Side’s welcoming booth-lined pub. The lunch meeting where everyone leaves in a better mood.' },
        { name: 'France 44', hood: 'Linden Hills, Minneapolis', hours: 'Sandwiches Mon–Sat 10–7', address: '4351 France Ave S, Minneapolis', why: 'Cheese-counter sandwiches, a little bistro seating, and wine by the glass. The one-on-one lunch that feels like playing hooky.' },
      ],
    },
    {
      title: 'The daytime rooms',
      blurb: 'Built for daylight: cafes that took over lunch’s job, laptop-friendly, done by three.',
      picks: [
        { name: 'The Lynhall', hood: 'LynLake, Minneapolis', hours: 'Mon–Fri to 2:30pm', address: '2640 Lyndale Ave S, Minneapolis', why: 'Restaurant service is back after the events-only pivot. Big tables, good light, the purpose-built laptop-and-conversation meeting.' },
        { name: 'Wise Acre Eatery', hood: 'Tangletown, Minneapolis', hours: 'Daily, kitchen 8–3', address: '5401 Nicollet Ave S, Minneapolis', why: 'Farm-to-table from their own Plato acres, daytime only, first-come. Get there before noon and take the window.' },
        { name: 'The Buttered Tin', hood: 'Lowertown, St. Paul', hours: 'Daily 7–3', address: '237 7th St E, St. Paul', why: 'Bright, bustling, counter-order. The coffee-plus-lunch meeting with a bakery case working against your better judgment.' },
      ],
    },
  ],
  callFirst: {
    blurb: 'Almost certainly serving lunch, but their own sites would not confirm it on our check. One call saves the trip.',
    picks: [
      { name: 'The Capital Grille', note: 'Weekday lunch by every recent listing; their site blocked our verification.', address: '801 Hennepin Ave, Minneapolis' },
      { name: "Herbie's on the Park", note: 'Lunch menu 11–4 per recent listings, and hours move on Wild game days.', address: '317 Washington St, St. Paul' },
      { name: 'The Local', note: 'The famous snugs are made for a quiet lunch; their site posts no hours.', address: '931 Nicollet Mall, Minneapolis' },
    ],
  },
};
