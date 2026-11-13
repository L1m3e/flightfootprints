package io.github.l1m3e.flightfootprints.flight;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import io.github.l1m3e.flightfootprints.airport.Airport;
import io.github.l1m3e.flightfootprints.airport.AirportRepository;
import io.github.l1m3e.flightfootprints.web.FieldProblem;
import io.github.l1m3e.flightfootprints.web.FieldValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FlightService {

    private final FlightRepository flights;
    private final FlightQueries queries;
    private final AirportRepository airports;
    private final Clock clock;

    FlightService(FlightRepository flights, FlightQueries queries, AirportRepository airports, Clock clock) {
        this.flights = flights;
        this.queries = queries;
        this.airports = airports;
        this.clock = clock;
    }

    public List<FlightResponse> list() {
        return queries.findAll();
    }

    public FlightResponse get(long id) {
        return queries.findById(id).orElseThrow(() -> notFound(id));
    }

    @Transactional
    public FlightResponse create(FlightRequest request) {
        Flight saved = flights.save(toFlight(null, null, request));
        return get(saved.id());
    }

    @Transactional
    public FlightResponse update(long id, FlightRequest request) {
        Flight existing = flights.findById(id).orElseThrow(() -> notFound(id));
        // Same id and creation time as before; everything else comes from the request.
        flights.save(toFlight(existing.id(), existing.createdAt(), request));
        return get(id);
    }

    @Transactional
    public void delete(long id) {
        if (!flights.existsById(id)) {
            throw notFound(id);
        }
        flights.deleteById(id);
    }

    /**
     * Checks the rules that need the database or the clock, then builds the row to save.
     * The distance is always recomputed here, so it can never disagree with the airports.
     */
    private Flight toFlight(Long id, Instant createdAt, FlightRequest request) {
        Airport from = airports.findById(request.fromIata()).orElse(null);
        Airport to = airports.findById(request.toIata()).orElse(null);

        List<FieldProblem> problems = new ArrayList<>();
        if (from == null) {
            problems.add(new FieldProblem("fromIata", "UnknownAirport", "Unknown airport code"));
        }
        if (to == null) {
            problems.add(new FieldProblem("toIata", "UnknownAirport", "Unknown airport code"));
        }
        if (from != null && to != null && from.iata().equals(to.iata())) {
            problems.add(new FieldProblem("toIata", "SameAirport", "Departure and arrival airports must differ"));
        }
        // One day of slack: "today" on the server can still be "tomorrow" where the flight took off.
        if (request.flightDate().isAfter(LocalDate.now(clock).plusDays(1))) {
            problems.add(new FieldProblem("flightDate", "InFuture", "The flight date is in the future"));
        }
        if (!problems.isEmpty()) {
            throw new FieldValidationException(problems);
        }

        int distanceKm = Math.toIntExact(Math.round(GreatCircle.distanceKm(from.lat(), from.lon(), to.lat(), to.lon())));
        // updatedAt (and createdAt for a new flight) are filled in by Spring Data's auditing.
        return new Flight(id, request.flightDate(), request.flightNo(), request.airline(), from.iata(), to.iata(),
                request.aircraft(), request.seat(), request.cabin(), distanceKm, request.notes(), createdAt, null);
    }

    private static ResponseStatusException notFound(long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight " + id + " does not exist");
    }
}
