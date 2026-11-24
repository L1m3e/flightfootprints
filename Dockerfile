# syntax=docker/dockerfile:1

# One image for the whole site, built in three steps. Only the last step is what gets
# shipped: the first two contain Node, a JDK and Gradle, which are needed to build the
# site but not to run it.

# ---- 1. The frontend: TypeScript and CSS in, static files out (frontend/dist).
FROM node:22-slim AS frontend
WORKDIR /build/frontend
# Dependencies first. Docker reuses this layer until package-lock.json changes, so
# editing source code does not download every package again.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# The version shown in the corner of every page; vite.config.ts reads it from one level up.
COPY VERSION /build/VERSION
RUN npm run build

# ---- 2. The backend: one jar, with the frontend inside it.
FROM eclipse-temurin:25-jdk AS backend
WORKDIR /build/backend
COPY backend/gradlew ./
COPY backend/gradle ./gradle
COPY backend/settings.gradle.kts backend/build.gradle.kts ./
# Downloads Gradle and the libraries. Reused until the build files change.
RUN ./gradlew --no-daemon dependencies > /dev/null
COPY backend/src ./src
# build.gradle.kts reads the version from ../VERSION. It is copied only now, after the
# libraries were downloaded, so a new version does not download them all again.
COPY VERSION /build/VERSION
# build.gradle.kts picks the frontend up from ../frontend/dist.
COPY --from=frontend /build/frontend/dist /build/frontend/dist
# The tests are not run here: they need a database in Docker, and CI runs them.
# The jar is then split into layers, so that an update which only changes the
# application does not replace the 50 MB of libraries next to it.
RUN ./gradlew --no-daemon bootJar \
 && cp build/libs/*.jar application.jar \
 && java -Djarmode=tools -jar application.jar extract --layers --destination extracted

# ---- 3. What runs: a Java runtime and the application.
FROM eclipse-temurin:25-jre
WORKDIR /application
# curl is only there for the health check at the end. The account has no rights of its
# own, so that the site does not run as root.
RUN apt-get update \
 && apt-get install --yes --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --no-create-home --uid 10001 flightfootprints
# From what changes least to what changes most.
COPY --from=backend /build/backend/extracted/dependencies/ ./
COPY --from=backend /build/backend/extracted/spring-boot-loader/ ./
COPY --from=backend /build/backend/extracted/snapshot-dependencies/ ./
COPY --from=backend /build/backend/extracted/application/ ./
USER flightfootprints
# See backend/src/main/resources/application-prod.yaml.
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
# Docker asks the application every ten seconds whether it is well. `docker ps` shows the
# answer, and Compose waits for "healthy" before it starts the proxy in front.
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=12 \
  CMD curl --fail --silent --output /dev/null http://localhost:8080/api/health || exit 1
ENTRYPOINT ["java", "-jar", "application.jar"]
