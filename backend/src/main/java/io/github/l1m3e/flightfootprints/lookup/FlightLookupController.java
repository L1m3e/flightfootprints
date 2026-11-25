package io.github.l1m3e.flightfootprints.lookup;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * The one endpoint behind the form's "look up" button. It is for administrators only (see
 * SecurityConfig): every call spends a little of an outside service's quota.
 */
@RestController
@RequestMapping("/api/flights/lookup")
class FlightLookupController {

    private final FlightLookupService service;

    FlightLookupController(FlightLookupService service) {
        this.service = service;
    }

    @GetMapping
    List<FlightLookupResponse> lookup(@RequestParam String flightNo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return service.lookup(flightNo, date, from, to);
    }
}
