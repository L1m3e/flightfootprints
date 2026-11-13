package io.github.l1m3e.flightfootprints.flight;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Who may call what is decided in SecurityConfig, not here: reading is open to everyone,
 * every other method requires the ADMIN role.
 */
@RestController
@RequestMapping("/api/flights")
class FlightController {

    private final FlightService flightService;

    FlightController(FlightService flightService) {
        this.flightService = flightService;
    }

    @GetMapping
    List<FlightResponse> list() {
        return flightService.list();
    }

    @GetMapping("/{id}")
    FlightResponse get(@PathVariable long id) {
        return flightService.get(id);
    }

    /** 201 Created, with the address of the new flight in the Location header. */
    @PostMapping
    ResponseEntity<FlightResponse> create(@Valid @RequestBody FlightRequest request) {
        FlightResponse created = flightService.create(request);
        return ResponseEntity.created(URI.create("/api/flights/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    FlightResponse update(@PathVariable long id, @Valid @RequestBody FlightRequest request) {
        return flightService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable long id) {
        flightService.delete(id);
    }
}
