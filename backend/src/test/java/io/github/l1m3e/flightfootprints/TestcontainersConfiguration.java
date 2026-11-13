package io.github.l1m3e.flightfootprints;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Starts a throwaway PostgreSQL container for integration tests.
 *
 * <p>{@code @ServiceConnection} tells Spring Boot to take the JDBC URL, user and password
 * from the running container, so tests need no datasource properties at all.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    // Same major version as compose.yaml, so tests run against what development uses.
    @Bean
    @ServiceConnection
    PostgreSQLContainer postgresContainer() {
        return new PostgreSQLContainer(DockerImageName.parse("postgres:18-alpine"));
    }
}
