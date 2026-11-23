package io.github.l1m3e.flightfootprints.airline;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/airlines")
class AirlineController {

    private final AirlineQueries airlines;

    AirlineController(AirlineQueries airlines) {
        this.airlines = airlines;
    }

    /**
     * GET /api/airlines: every airline. Unlike the airports, of which there are thousands,
     * the list is short enough to send whole; the flight form looks things up in it itself.
     */
    @GetMapping
    List<Airline> all() {
        return airlines.findAll();
    }
}
