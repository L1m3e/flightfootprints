import org.gradle.api.tasks.testing.logging.TestExceptionFormat

plugins {
    java
    id("org.springframework.boot") version "4.1.2"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "io.github.l1m3e"
// The version of the whole site is one line in the VERSION file in the repository root;
// the frontend reads the same file (frontend/vite.config.ts). "dev" is only seen where
// the file is not there yet: the step of the Docker build that downloads the libraries,
// which must not start over each time the version changes.
version = rootDir.resolve("../VERSION").takeIf { it.isFile }?.readText()?.trim() ?: "dev"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

springBoot {
    // Writes the version into the jar (META-INF/build-info.properties), where the running
    // application finds it; GET /api/health reports it. The build time is left out: with
    // it the file would differ on every build, and nothing could be reused.
    buildInfo {
        excludes.set(setOf("time"))
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-data-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-flyway")
    implementation("org.flywaydb:flyway-database-postgresql")
    // Not managed by Spring Boot's BOM, so the version is pinned here.
    implementation("org.apache.commons:commons-csv:1.14.1")
    runtimeOnly("org.postgresql:postgresql")

    // Starts the Postgres container from ../compose.yaml on bootRun. `developmentOnly`
    // keeps it out of the production jar and off the test classpath.
    developmentOnly("org.springframework.boot:spring-boot-docker-compose")

    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.springframework.boot:spring-boot-starter-data-jdbc-test")
    testImplementation("org.springframework.boot:spring-boot-starter-validation-test")
    testImplementation("org.springframework.boot:spring-boot-starter-security-test")
    testImplementation("org.springframework.boot:spring-boot-starter-flyway-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:testcontainers-junit-jupiter")
    testImplementation("org.testcontainers:testcontainers-postgresql")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

// The built frontend goes into the jar as static content, which is where Spring Boot
// serves files from. `npm run build` in ../frontend creates the directory; while it does
// not exist, nothing is added and the backend builds on its own.
tasks.processResources {
    from("../frontend/dist") {
        into("static")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
    // Print each test's result, and the full stack trace of failures, to the console.
    // Without this Gradle only says "BUILD SUCCESSFUL", which is hard to read in CI logs.
    testLogging {
        events("passed", "skipped", "failed")
        exceptionFormat = TestExceptionFormat.FULL
    }
}
