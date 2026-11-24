package io.github.l1m3e.flightfootprints.lookup;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import io.github.l1m3e.flightfootprints.airline.Airline;
import io.github.l1m3e.flightfootprints.airline.AirlineLookup;
import io.github.l1m3e.flightfootprints.airport.Airport;
import io.github.l1m3e.flightfootprints.airport.AirportRepository;
import io.github.l1m3e.flightfootprints.flight.FlightNumber;
import io.github.l1m3e.flightfootprints.web.FieldValidationException;

/**
 * Turns a flight number into something the form can fill in. The provider knows outside
 * codes; this service resolves them against our own airports and airlines, drops routes
 * whose airports we do not have, and keeps the answer focused on the route the form
 * already shows.
 *
 * <p>Only providers are outside this class: adding another data source means adding one
 * {@link FlightLookupProvider}, not touching this logic.
 */
@Service
public class FlightLookupService {

    private static final Logger log = LoggerFactory.getLogger(FlightLookupService.class);

    private static final Pattern FLIGHT_NUMBER = Pattern.compile(FlightNumber.PATTERN);

    private final FlightLookupProvider provider;
    private final AirportRepository airports;
    private final AirlineLookup airlines;

    FlightLookupService(FlightLookupProvider provider, AirportRepository airports, AirlineLookup airlines) {
        this.provider = provider;
        this.airports = airports;
        this.airlines = airlines;
    }

    /**
     * @param flightNo      what the user typed; spaces and lower case are forgiven
     * @param date          the flight's date, or null when the form has none yet
     * @param preferredFrom IATA code already chosen in the form, used to pick between routes
     * @param preferredTo   IATA code already chosen in the form, used to pick between routes
     * @throws FieldValidationException        when the flight number has the wrong shape
     * @throws FlightNotFoundException         when no known route matches
     * @throws FlightLookupUnavailableException when the provider itself failed
     */
    public List<FlightLookupResponse> lookup(String flightNo, LocalDate date, String preferredFrom,
            String preferredTo) {
        String number = FlightNumber.normalize(flightNo);
        if (!FLIGHT_NUMBER.matcher(number).matches()) {
            throw new FieldValidationException("flightNo", "Pattern", "must be a flight number such as MU587");
        }

        List<FlightLookupResponse> routes = provider.lookup(number, date).stream()
                .map(result -> toResponse(number, result))
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (routes.isEmpty()) {
            throw new FlightNotFoundException("No flight found for " + number + ".");
        }
        return preferRoute(routes, preferredFrom, preferredTo);
    }

    /** Null when the provider named an airport we do not have: the form cannot use that route. */
    private FlightLookupResponse toResponse(String flightNo, FlightLookupResult result) {
        String fromIata = normalizeCode(result.fromIata());
        String toIata = normalizeCode(result.toIata());
        if (fromIata == null || toIata == null) {
            return null;
        }
        Optional<Airport> from = airports.findById(fromIata);
        Optional<Airport> to = airports.findById(toIata);
        if (from.isEmpty() || to.isEmpty()) {
            log.info("Lookup for {} found {} -> {}, but that airport is not in the database.", flightNo, fromIata,
                    toIata);
            return null;
        }
        return new FlightLookupResponse(flightNo, from.get(), to.get(),
                blankToNull(result.aircraftIcao()), blankToNull(result.aircraftModel()),
                airlineOf(result));
    }

    private FlightLookupAirline airlineOf(FlightLookupResult result) {
        Optional<Airline> known = airlines.find(result.airlineIata())
                .or(() -> airlines.find(result.airlineName()));
        if (known.isPresent()) {
            Airline airline = known.get();
            return new FlightLookupAirline(airline.iata(), airline.name(), airline.nameZh());
        }
        String iata = normalizeCode(result.airlineIata());
        String name = blankToNull(result.airlineName());
        return iata == null && name == null ? null : new FlightLookupAirline(iata, name, null);
    }

    /**
     * A number can stand for both directions (MU587 and MU588 are not the same, but a
     * callsign can be reused). When the form already has one airport, prefer the routes
     * that agree with it; if none do, show every route rather than guessing.
     */
    private static List<FlightLookupResponse> preferRoute(List<FlightLookupResponse> routes, String preferredFrom,
            String preferredTo) {
        String from = normalizeCode(preferredFrom);
        String to = normalizeCode(preferredTo);
        if (from == null && to == null) {
            return routes;
        }
        List<FlightLookupResponse> matching = routes.stream()
                .filter(route -> (from == null || from.equals(route.from().iata()))
                        && (to == null || to.equals(route.to().iata())))
                .toList();
        return matching.isEmpty() ? routes : matching;
    }

    private static String normalizeCode(String value) {
        String trimmed = blankToNull(value);
        return trimmed == null ? null : trimmed.toUpperCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.strip();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
