package io.github.l1m3e.flightfootprints.health;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
class HealthController {

    private final JdbcClient jdbcClient;

    HealthController(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    /**
     * Queries the database on purpose: a 200 from this endpoint proves that the web
     * layer, the connection pool, the schema and the airport import all work.
     */
    @GetMapping
    Health health() {
        long airports = jdbcClient.sql("SELECT count(*) FROM airports").query(Long.class).single();
        return new Health("UP", airports);
    }

    record Health(String status, long airports) {
    }
}
