package io.github.l1m3e.flightfootprints.web;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class TimeConfig {

    /**
     * Code that needs "now" asks this bean instead of calling LocalDate.now() directly,
     * so a test can hand it a clock that stands still.
     */
    @Bean
    Clock clock() {
        return Clock.systemDefaultZone();
    }
}
