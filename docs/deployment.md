# Deploying Flight Footprints

One small server runs the whole site with Docker Compose:

```
visitor ── HTTPS ──▶ Caddy ── HTTP ──▶ application ──▶ PostgreSQL
                     :80 :443          :8080            :5432
                     published         inside Docker only
```

- **Caddy** answers visitors, gets and renews the HTTPS certificate by itself, and passes
  requests on.
- **The application** is one Docker image: Spring Boot with the built frontend inside.
- **PostgreSQL** keeps the flights in a Docker volume. It is not reachable from outside.

Everything is described by three files: [`Dockerfile`](../Dockerfile),
[`deploy/compose.yaml`](../deploy/compose.yaml) and [`deploy/Caddyfile`](../deploy/Caddyfile).

The steps below use Amazon Lightsail with Ubuntu as the example. Any Linux server with
Docker works the same way from step 3 on. Renting a server costs money; nothing in this
repository creates one for you.

## What you need

- A server with a public IP address. 1 GB of memory is enough to run the site. Building
  the image on the server needs about 2 GB; with less, add swap (step 3) or build the
  image elsewhere ([below](#building-the-image-somewhere-else)).
- A domain name, if you want HTTPS. Without one the site can run over plain HTTP on the
  IP address, which is fine for a first look but not for signing in.
- The repository in a place the server can clone it from, for example GitHub.

## 1. Create the server

In the Lightsail console:

1. Create an instance: platform **Linux/Unix**, blueprint **OS only → Ubuntu** (the latest
   LTS release), and a plan with at least 1 GB of memory.
2. Under **Networking**, create a **static IP** and attach it to the instance. Without it
   the address changes whenever the instance is stopped and started.
3. In the instance's **IPv4 firewall**, add a rule for **HTTPS (443)**. SSH (22) and
   HTTP (80) are open by default; both stay open: Caddy needs port 80 to obtain the
   certificate and to send visitors on to HTTPS.

## 2. Point the domain at the server

At your DNS provider, create an **A record** for the name you want
(`flights.example.com`) with the static IP as its value. Check from your own computer:

```bash
dig +short flights.example.com
```

It must print the static IP before you start the site. Caddy asks for the certificate on
the first start, and that fails while the name still points elsewhere.

## 3. Install Docker

Connect to the server with SSH, then:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Log out and in again, so that your user may run `docker`. Docker Compose is included.

On a server with less than 2 GB of memory, add swap space before building the image:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 4. Get the code

```bash
git clone https://github.com/<your-account>/flightfootprints.git
cd flightfootprints/deploy
```

## 5. Configure

```bash
cp .env.example .env
nano .env
```

| Setting                 | What to put there                                                                |
| ----------------------- | -------------------------------------------------------------------------------- |
| `SITE_ADDRESS`          | Your domain name, e.g. `flights.example.com`. `:80` for plain HTTP without one.  |
| `POSTGRES_PASSWORD`     | A long random password, e.g. the output of `openssl rand -hex 24`.               |
| `ADMIN_USERNAME`        | Name of the one account that may add, change and delete flights.                 |
| `ADMIN_PASSWORD`        | Its password, at least 12 characters.                                            |
| `ADDITIONAL_ADMINS`     | Optional: more administrators, as `name:password` pairs separated by commas.     |
| `REGISTRATION_ENABLED`  | `false` unless visitors should be able to create (read-only) accounts.           |
| `AERODATABOX_API_KEY`   | Optional: a key that also lets flight lookups report the aircraft type.          |
| `FLIGHT_LOOKUP_TIMEOUT` | Optional: how long a lookup may wait. Defaults to `8s`.                          |

`.env` holds every secret of the site. It is git-ignored and exists only on the server.

## 6. Start the site

```bash
docker compose up -d --build
```

The first build downloads the build tools and takes several minutes. Then check:

```bash
docker compose ps
```

All three services should be `running`, and `app` should turn `healthy` after about half
a minute. Open `https://flights.example.com`: the first request can take a few seconds
while Caddy obtains the certificate. Sign in with the administrator account and add a
flight.

The services restart by themselves after a crash or a reboot of the server.

## Updating the site

```bash
cd flightfootprints
git pull
cd deploy
docker compose up -d --build
```

The site is down for the few seconds it takes the new application to start. Changes to
the database are applied by the application itself when it starts (Flyway migrations);
there is nothing to run by hand. Old images pile up over time; `docker image prune`
removes them.

To change a setting, edit `.env` and run `docker compose up -d` again.

## Backups

Every flight is in the Docker volume of the `postgres` service. Save a copy regularly
and keep it somewhere else than on the server:

```bash
docker compose exec -T postgres pg_dump -U flightfootprints flightfootprints | gzip > "flightfootprints-$(date +%F).sql.gz"
```

To restore a copy, replace the database with an empty one and load the copy into it.
This overwrites what is there:

```bash
docker compose stop app
docker compose exec -T postgres dropdb -U flightfootprints flightfootprints
docker compose exec -T postgres createdb -U flightfootprints flightfootprints
gunzip -c flightfootprints-2026-01-31.sql.gz | docker compose exec -T postgres psql -U flightfootprints flightfootprints
docker compose start app
```

## Looking at what happens

```bash
docker compose logs -f app
```

Replace `app` with `caddy` or `postgres` for the other services.

| Symptom                                           | Likely cause                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Browser warns about the certificate, or no answer | The domain does not point to the server yet, or port 80 or 443 is closed in the firewall.              |
| `app` restarts, log says the password is wrong    | `POSTGRES_PASSWORD` was changed after the database was created. See the next section.                  |
| `app` exits while starting on a small server      | Out of memory. Add swap (step 3) or lower `JAVA_TOOL_OPTIONS` in `.env`.                               |

## Changing the database password

`POSTGRES_PASSWORD` is only used when the database is created. To change it later, tell
the database first, then the application:

```bash
docker compose exec postgres psql -U flightfootprints -c "ALTER USER flightfootprints PASSWORD 'the-new-password'"
nano .env                 # set POSTGRES_PASSWORD to the same value
docker compose up -d
```

## Building the image somewhere else

If the server is too small to build the image, build it on your own computer for the
server's processor type and send it over:

```bash
docker build --platform linux/amd64 -t flightfootprints .
docker save flightfootprints | gzip | ssh <user>@<server> 'gunzip | docker load'
```

Then start the site on the server without `--build`:

```bash
docker compose up -d
```

## Trying it on your own computer

The same setup runs locally, on other ports so that it does not need ports 80 and 443:

```bash
cd deploy
cp .env.example .env      # fill in POSTGRES_PASSWORD, ADMIN_USERNAME and ADMIN_PASSWORD
HTTP_PORT=8088 HTTPS_PORT=8443 docker compose up -d --build
```

Open <http://localhost:8088>. To stop it and delete its data:

```bash
docker compose down --volumes
```

## What keeps the site safe

- Only ports 80 and 443 are published. The database and the application are reachable
  from inside Docker's network only.
- The application runs as a user without privileges, in an image that contains a Java
  runtime and nothing to build with.
- Secrets are in `.env` on the server and nowhere else: not in the repository, not in
  the image.
- Behind HTTPS, the session and CSRF cookies carry the `Secure` flag, and browsers are
  told to use HTTPS only (HSTS).
- Only the administrator can change data; accounts that visitors create are read-only,
  and registration is off unless you turn it on.
