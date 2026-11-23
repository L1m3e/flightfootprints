# Flight Footprints

A personal site that keeps a record of every flight I have taken: a timeline of flights,
the routes drawn on a world map, and statistics about distance, airports and airlines.

The project is being built in stages. See the [roadmap](#roadmap) for what exists today.

## Tech stack

| Part     | Tools                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| Backend  | Java 25, Spring Boot 4 (Web MVC), Spring Security, Spring Data JDBC, Flyway, PostgreSQL 18                         |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, React Router, TanStack Query, react-hook-form, zod, i18next |
| Map      | MapLibre GL JS through react-map-gl, OpenFreeMap vector tiles, Turf for great-circle arcs                          |
| Charts   | Recharts                                                                                                           |
| Tests    | JUnit and Testcontainers (backend), Vitest (frontend)                                                              |
| CI       | GitHub Actions                                                                                                     |

The interface is available in Chinese and English.

## Repository layout

```
backend/       Spring Boot API (Gradle)
frontend/      React single-page app (Vite)
scripts/       Maintenance scripts
compose.yaml   PostgreSQL for local development
.env.example   Template for the settings described under "Configuration"
```

## Running locally

You need JDK 25, Node 22.22 or newer, and Docker.

Start the backend:

```bash
cd backend
./gradlew bootRun
```

Spring Boot starts the PostgreSQL container from `compose.yaml` by itself, applies the
Flyway migrations and, on the first start, imports the airport list. The API listens on
<http://localhost:8080>; try <http://localhost:8080/api/health>.

Start the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite dev server forwards every request under `/api` to
the backend, so the browser only ever talks to one origin.

To add flights you need an administrator account: see [Configuration](#configuration).

The development database listens on `127.0.0.1:5433` (database, user and password are all
`flightfootprints`). Its data lives in a Docker volume and survives restarts. To start
over with an empty database, run `docker compose down -v` in the repository root; this
deletes all local development data.

## Configuration

Settings come from environment variables. For local development, copy `.env.example` to
`.env` in the repository root and fill it in; the backend reads that file by itself, and
git ignores it.

| Variable               | Meaning                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `ADMIN_USERNAME`       | Username of the site's only administrator.                                            |
| `ADMIN_PASSWORD`       | The administrator's password, at least 12 characters. Only a hash of it is stored.    |
| `REGISTRATION_ENABLED` | `false` stops visitors from creating accounts. Defaults to `true`.                    |

The backend creates or updates the administrator on every start, so changing
`ADMIN_PASSWORD` and restarting is how the password is rotated. Without the two `ADMIN_`
variables there is no administrator and the site is read-only.

The frontend has one optional build-time setting: `VITE_MAP_STYLE_URL`, the address of a
MapLibre style to use as the basemap instead of OpenFreeMap's. Put it in
`frontend/.env.local`.

## Accounts and permissions

| Who             | Can read | Can add, change and delete flights |
| --------------- | -------- | ---------------------------------- |
| Visitor         | yes      | no                                 |
| Registered user | yes      | no                                 |
| Administrator   | yes      | yes                                |

Signing in uses a session cookie. Every request that changes something must also carry
the CSRF token: the backend sets it in the `XSRF-TOKEN` cookie and expects the same value
in the `X-XSRF-TOKEN` header.

## The map

Every flight is drawn as its own great-circle arc, the shortest path over the Earth's
surface. Flights between the same two airports lie side by side. Clicking an arc, or its
row in the list next to the map, shows the details of that flight; the selection is part
of the address (`/map?flight=12`), so it can be linked to.

Routes across the 180° meridian, such as Tokyo to Los Angeles, need care: the arc is
split into two lines that meet exactly on the meridian, which the map then shows as one
unbroken route. The map can also be switched to a globe.

The basemap comes from [OpenFreeMap](https://openfreemap.org/), a free service without an
API key. If it cannot be reached, the routes and airports are still drawn, on a plain
background.

## The timeline

The home page lists every flight, newest first, under a heading for each year that also
gives the year's number of flights and distance. A card shows the route, the distance and
whatever else was recorded about the flight, and links to it on the map. A line above the
timeline sums up the whole log.

## Statistics

The statistics page shows:

- the number of flights and the total distance, also in miles and as trips around the
  equator
- how many airports and how many countries and regions were visited
- the flights per year, as a chart or as a table, including the years without a flight
- the airlines, ranked by number of flights
- the ten most visited airports, where take-offs and landings both count
- the longest and the shortest flight, each with a link to the map

PostgreSQL does the counting, one query per figure, so the application never loads every
flight just to add them up. Airline names are free text and are grouped without regard to
upper and lower case.

## Aircraft drawings

A flight card shows a side view of the aircraft in the airline's colours when the site
has a drawing for it. Both are worked out from what was typed in:

- the airline from the first two characters of the flight number (`CA` in `CA818`), or
  from the airline's name when there is no flight number
- the aircraft type from the free-text aircraft field, which understands spellings such
  as `Boeing 747-8`, `B748`, `747-8i` and `波音747-8`

A drawing is put together from two separate pieces of data, the shape of an aircraft type
and the livery of an airline, so any type can wear any livery. When the type is unknown
or has not been drawn, the card has no picture; an unknown airline gets an unpainted
aircraft. A flight number that one airline sells for a flight operated by another shows
the selling airline's colours.

The site recognises 22 aircraft types and 110 airlines. One shape (Boeing 747-8) and one
livery (Air China) are drawn so far. What exists and how to add a drawing is described in
[frontend/src/features/aircraft](frontend/src/features/aircraft/README.md).

## API

Every error is returned as an RFC 9457 problem document (`application/problem+json`).

| Method              | Path                 | Who             | Purpose                                      |
| ------------------- | -------------------- | --------------- | -------------------------------------------- |
| `GET`               | `/api/health`        | everyone        | Status and number of airports                |
| `GET`               | `/api/flights`       | everyone        | All flights, newest first                    |
| `GET`               | `/api/flights/{id}`  | everyone        | One flight                                   |
| `POST`              | `/api/flights`       | administrator   | Add a flight                                 |
| `PUT`, `DELETE`     | `/api/flights/{id}`  | administrator   | Change or delete a flight                    |
| `GET`               | `/api/stats`         | everyone        | Totals, rankings and flights per year        |
| `GET`               | `/api/airports?q=`   | everyone        | Search airports by code, city or name        |
| `GET`               | `/api/auth/me`       | everyone        | Who is signed in                             |
| `POST`              | `/api/auth/register` | visitors        | Create a regular account                     |
| `POST`              | `/api/auth/login`    | visitors        | Sign in (form fields `username`, `password`) |
| `POST`              | `/api/auth/logout`   | signed-in users | Sign out                                     |

The distance of a flight is never sent by the client: the backend computes the
great-circle distance between the two airports with the haversine formula.

## Checks

```bash
# Backend: integration tests against a real PostgreSQL (needs Docker)
cd backend && ./gradlew test

# Frontend
cd frontend && npm run typecheck && npm run lint && npm test && npm run build
```

The same checks run in GitHub Actions on every push to `main` and on every pull request.

## Airport data

Airports come from [OurAirports](https://ourairports.com/data/), which releases its data
into the public domain. The repository contains a filtered copy,
`backend/src/main/resources/data/airports.csv`, with the large and medium airports that
have an IATA code.

To refresh that file from the latest OurAirports data:

```bash
node scripts/update-airports.mjs
```

The backend reads the CSV only while its `airports` table is empty, so an existing
database keeps the airports it already has.

## Roadmap

- [x] Project skeleton: monorepo, Flyway migrations, airport import, health check
- [x] Accounts, admin login, and creating, editing and deleting flights
- [x] World map with great-circle routes
- [x] Statistics page and timeline
- [ ] Aircraft side views with airline liveries (shown on the timeline and the map; one aircraft and one livery drawn so far)
- [ ] Dockerfile, production Compose file and deployment guide

## Credits

- Airport data: [OurAirports](https://ourairports.com/data/), public domain
- Basemap: [OpenFreeMap](https://openfreemap.org/), © [OpenMapTiles](https://www.openmaptiles.org/),
  data from [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Map rendering: [MapLibre GL JS](https://maplibre.org/), BSD 3-Clause License
- Charts: [Recharts](https://recharts.org/), MIT License
- Aircraft drawings: made for this project. Airline names, liveries and logos belong to
  the airlines and are shown only to identify them.
- UI components: [shadcn/ui](https://ui.shadcn.com/) and [Base UI](https://base-ui.com/), MIT License
- Typeface: [Geist](https://vercel.com/font), SIL Open Font License 1.1
- Icons: [Lucide](https://lucide.dev/), ISC License
