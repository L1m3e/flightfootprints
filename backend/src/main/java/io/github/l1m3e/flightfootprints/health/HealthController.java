package io.github.l1m3e.flightfootprints.health;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.BuildProperties;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
class HealthController {

    private final JdbcClient jdbcClient;
    private final String version;

    /**
     * @param buildProperties what the build wrote into the jar (see build.gradle.kts). Not
     *                        there when the application is started without Gradle, from an
     *                        IDE for example; the version is then reported as "dev".
     */
    HealthController(JdbcClient jdbcClient, ObjectProvider<BuildProperties> buildProperties) {
        this.jdbcClient = jdbcClient;
        BuildProperties build = buildProperties.getIfAvailable();
        this.version = build == null || build.getVersion() == null ? "dev" : build.getVersion();
    }

    /**
     * Queries the database on purpose: a 200 from this endpoint proves that the web
     * layer, the connection pool, the schema and the airport import all work. The version
     * tells which release answered, which is the quickest way to see whether a deployment
     * has arrived.
     */
    @GetMapping
    Health health() {
        long airports = jdbcClient.sql("SELECT count(*) FROM airports").query(Long.class).single();
        return new Health("UP", version, airports);
    }

    record Health(String status, String version, long airports) {
    }
}
