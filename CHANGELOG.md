# Changelog

What changed in each version of Flight Footprints, newest first. The number of the
running version is shown in the bottom corner of every page and by `GET /api/health`.

Version numbers have three parts, `MAJOR.MINOR.PATCH`:

- **PATCH** (0.2.0 to 0.2.1): fixes only. Nothing looks or works differently on purpose.
- **MINOR** (0.2.1 to 0.3.0): something new, or a change to the database or the API.
- **MAJOR** (1.0.0): reserved for the day the site is considered complete.

## 0.3.0 (2026-11-24)

### Added

- **Looking a flight number up.** The flight form has a button next to the flight number.
  It asks the backend which route the number flies and fills in the departure and arrival
  airports, the airline and, when the provider knows it, the aircraft type. Several routes
  for one number are offered as a choice. The airports are set to the route that was
  found; an airline or an aircraft that was typed by hand is never replaced.
  Without configuration the free ADSBDB answers with the route and the airline. Setting
  `AERODATABOX_API_KEY` switches to AeroDataBox, which also knows the aircraft and the
  date. The button is shown to administrators only, because a lookup spends the provider's
  quota.
- **`GET /api/flights/lookup`.** The endpoint behind the button: `flightNo` is required,
  `date`, `from` and `to` are optional.

## 0.2.0 (2026-11-23)

Fixes and improvements after a review of the live site by a visitor who was not signed in.

### Fixed

- **Routes across the 180° meridian.** A route over the Arctic, such as Hong Kong to New
  York, was drawn with a stroke across the whole flat map and with a loop around the pole
  on the globe. Every route is now one unbroken line.
- **Registration switch.** With registration closed, a request with an empty or invalid
  body was answered with `400` and the list of invalid fields. It is now refused with `403`
  before the request is looked at, whatever it contains.
- **Place names.** "Hong Kong, Hong Kong" and "Hong Kong, 香港" are now "Hong Kong" and
  "香港": a city and a country or region with the same name are shown once.

### Added

- **Airline names in both languages.** A flight stores its airline as an IATA code with
  the English and the Chinese name, and each page shows the one for its language. The
  flight form accepts a code or a name in either language and says which airline it
  understood.
- **Chinese city names** for 482 airports: all of mainland China, Hong Kong, Macau and
  Taiwan, and the large airports elsewhere. Airports can be searched by them.
- **A loading screen for the map**, until the map has drawn itself.
- **Flights per month.** The chart on the statistics page can switch between years and
  months, and starts by month while all flights are in one year.
- **Version number** in the corner of every page and in `GET /api/health`, and this file.

### Changed

- Changing anything under `/api` needs the administrator role unless a rule says
  otherwise. Until now that was only true for flights.
- API: `airline` in a flight and in the statistics is an object
  (`{"iata": "CX", "name": "Cathay Pacific", "nameZh": "国泰航空"}`) instead of text;
  airports have a `cityZh`; the statistics have `flightsPerMonth`.
- Database: migrations V5 (airline code and Chinese name on flights; the existing flights
  are converted, and one whose airline is not recognised is kept as typed and reported in
  the log) and V6 (`airports.city_zh`).

## 0.1.0 (2026-11-23)

The first version on the live site: the timeline of flights, the route map, the
statistics page, accounts with an administrator, Chinese and English, and deployment with
Docker Compose and Caddy.
