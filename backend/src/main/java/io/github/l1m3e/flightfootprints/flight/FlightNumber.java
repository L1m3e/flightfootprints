package io.github.l1m3e.flightfootprints.flight;

import java.util.Locale;

/**
 * The shape of a flight number, shared by the entity, the request and the lookup feature.
 */
public final class FlightNumber {

    /**
     * Two or three letters or digits for the airline, one to four digits, and an optional
     * letter for a sister flight such as MU587A.
     */
    public static final String PATTERN = "^[A-Z0-9]{2,3}[0-9]{1,4}[A-Z]?$";

    private FlightNumber() {
    }

    /** Drops spaces and lower case, so "mu 587" becomes "MU587". */
    public static String normalize(String value) {
        return value == null ? "" : value.replace(" ", "").toUpperCase(Locale.ROOT);
    }
}
