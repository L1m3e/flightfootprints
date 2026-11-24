package io.github.l1m3e.flightfootprints.flight;

import java.time.LocalDate;
import java.util.Locale;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * What the form sends to create or change a flight. The distance is not part of it:
 * the backend always computes that from the two airports.
 *
 * @param airline the airline's IATA code ("CX") or its name in any language ("Cathay
 *                Pacific", "国泰航空"). The backend finds the airline it means and stores
 *                its code and both names; a name it does not know is stored as typed.
 */
public record FlightRequest(
        @NotNull LocalDate flightDate,
        @Pattern(regexp = Flight.FLIGHT_NO_PATTERN) String flightNo,
        @NotBlank @Size(max = 60) String airline,
        @NotNull @Pattern(regexp = "^[A-Z]{3}$") String fromIata,
        @NotNull @Pattern(regexp = "^[A-Z]{3}$") String toIata,
        @Size(max = 60) String aircraft,
        @Size(max = 5) String seat,
        Cabin cabin,
        @Size(max = 2000) String notes) {

    /**
     * Tidies the input before it is validated: surrounding spaces go, empty optional
     * fields become null, and codes are upper-cased, so " mu 587 " is accepted as "MU587".
     */
    public FlightRequest {
        flightNo = upperCase(trimToNull(flightNo == null ? null : flightNo.replace(" ", "")));
        airline = trimToNull(airline);
        fromIata = upperCase(trimToNull(fromIata));
        toIata = upperCase(trimToNull(toIata));
        aircraft = trimToNull(aircraft);
        seat = upperCase(trimToNull(seat));
        notes = trimToNull(notes);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.strip();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String upperCase(String value) {
        return value == null ? null : value.toUpperCase(Locale.ROOT);
    }
}
