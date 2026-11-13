package io.github.l1m3e.flightfootprints.airport;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/airports")
class AirportController {

    private static final int MAX_RESULTS = 10;
    private static final int MAX_TERM_LENGTH = 50;

    private final AirportRepository airports;

    AirportController(AirportRepository airports) {
        this.airports = airports;
    }

    /** Autocomplete: GET /api/airports?q=pvg. An empty term returns nothing instead of everything. */
    @GetMapping
    List<Airport> search(@RequestParam(name = "q", defaultValue = "") String query) {
        String term = query.strip();
        if (term.isEmpty()) {
            return List.of();
        }
        if (term.length() > MAX_TERM_LENGTH) {
            term = term.substring(0, MAX_TERM_LENGTH);
        }
        return airports.search(term, MAX_RESULTS);
    }
}
