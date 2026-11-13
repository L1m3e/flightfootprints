package io.github.l1m3e.flightfootprints.flight;

import java.time.Instant;
import java.time.LocalDate;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Table;

/**
 * One row of the flights table. Used for writing; reading goes through
 * {@link FlightQueries}, which also brings the two airports along.
 */
@Table("flights")
public record Flight(
        @Id Long id,
        LocalDate flightDate,
        String flightNo,
        String airline,
        String fromIata,
        String toIata,
        String aircraft,
        String seat,
        Cabin cabin,
        int distanceKm,
        String notes,
        @CreatedDate Instant createdAt,
        @LastModifiedDate Instant updatedAt) {

    /**
     * Airline designator (two or three letters or digits) followed by up to four digits and
     * an optional letter: MU587, CA818, 9C8887.
     */
    public static final String FLIGHT_NO_PATTERN = "^[A-Z0-9]{2,3}[0-9]{1,4}[A-Z]?$";
}
