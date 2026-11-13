# Flight Footprints

A personal site that keeps a record of every flight I have taken: a timeline of flights,
the routes drawn on a world map, and statistics about distance, airports and airlines.

The project is being built in stages. See the [roadmap](#roadmap) for what exists today.

## Tech stack

| Part     | Tools                                                                                      |
| -------- | ------------------------------------------------------------------------------------------ |
| Backend  | Java 25, Spring Boot 4 (Web MVC), Spring Data JDBC, Flyway, PostgreSQL 18                  |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, React Router, TanStack Query, i18next |
| Tests    | JUnit, Testcontainers                                                                      |
| CI       | GitHub Actions                                                                             |

The interface is available in Chinese and English.

## Repository layout

```
backend/       Spring Boot API (Gradle)
frontend/      React single-page app (Vite)
scripts/       Maintenance scripts
compose.yaml   PostgreSQL for local development
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

The development database listens on `127.0.0.1:5433` (database, user and password are all
`flightfootprints`). Its data lives in a Docker volume and survives restarts. To start
over with an empty database, run `docker compose down -v` in the repository root; this
deletes all local development data.

## Checks

```bash
# Backend: integration tests against a real PostgreSQL (needs Docker)
cd backend && ./gradlew test

# Frontend
cd frontend && npm run typecheck && npm run lint && npm run build
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
- [ ] Accounts, admin login, and creating, editing and deleting flights
- [ ] World map with great-circle routes
- [ ] Statistics page and timeline
- [ ] Aircraft side views with airline liveries
- [ ] Dockerfile, production Compose file and deployment guide

## Credits

- Airport data: [OurAirports](https://ourairports.com/data/), public domain
- UI components: [shadcn/ui](https://ui.shadcn.com/), MIT License
- Typeface: [Geist](https://vercel.com/font), SIL Open Font License 1.1
- Icons: [Lucide](https://lucide.dev/), ISC License
