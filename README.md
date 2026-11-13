# Flight Footprints

A personal site that keeps a record of every flight I have taken: a timeline of flights,
the routes drawn on a world map, and statistics about distance, airports and airlines.

The project is being built in stages. See the [roadmap](#roadmap) for what exists today.

## Tech stack

| Part     | Tools                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| Backend  | Java 25, Spring Boot 4 (Web MVC), Spring Security, Spring Data JDBC, Flyway, PostgreSQL 18                         |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui, React Router, TanStack Query, react-hook-form, zod, i18next |
| Tests    | JUnit, Testcontainers                                                                                              |
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

## Accounts and permissions

| Who             | Can read | Can add, change and delete flights |
| --------------- | -------- | ---------------------------------- |
| Visitor         | yes      | no                                 |
| Registered user | yes      | no                                 |
| Administrator   | yes      | yes                                |

Signing in uses a session cookie. Every request that changes something must also carry
the CSRF token: the backend sets it in the `XSRF-TOKEN` cookie and expects the same value
in the `X-XSRF-TOKEN` header.

## API

Every error is returned as an RFC 9457 problem document (`application/problem+json`).

| Method              | Path                 | Who             | Purpose                                      |
| ------------------- | -------------------- | --------------- | -------------------------------------------- |
| `GET`               | `/api/health`        | everyone        | Status and number of airports                |
| `GET`               | `/api/flights`       | everyone        | All flights, newest first                    |
| `GET`               | `/api/flights/{id}`  | everyone        | One flight                                   |
| `POST`              | `/api/flights`       | administrator   | Add a flight                                 |
| `PUT`, `DELETE`     | `/api/flights/{id}`  | administrator   | Change or delete a flight                    |
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
- [x] Accounts, admin login, and creating, editing and deleting flights
- [ ] World map with great-circle routes
- [ ] Statistics page and timeline
- [ ] Aircraft side views with airline liveries
- [ ] Dockerfile, production Compose file and deployment guide

## Credits

- Airport data: [OurAirports](https://ourairports.com/data/), public domain
- UI components: [shadcn/ui](https://ui.shadcn.com/) and [Base UI](https://base-ui.com/), MIT License
- Typeface: [Geist](https://vercel.com/font), SIL Open Font License 1.1
- Icons: [Lucide](https://lucide.dev/), ISC License
