package io.github.l1m3e.flightfootprints;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jdbc.repository.config.EnableJdbcAuditing;

@SpringBootApplication
// Finds the @ConfigurationProperties records (for example AuthProperties) in this package tree.
@ConfigurationPropertiesScan
// Fills @CreatedDate and @LastModifiedDate fields whenever an entity is saved.
@EnableJdbcAuditing
public class FlightFootprintsApplication {

    public static void main(String[] args) {
        SpringApplication.run(FlightFootprintsApplication.class, args);
    }
}
