package io.github.l1m3e.flightfootprints.stats;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
class StatsController {

    private final StatsService statsService;

    StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping
    StatsResponse stats() {
        return statsService.stats();
    }
}
