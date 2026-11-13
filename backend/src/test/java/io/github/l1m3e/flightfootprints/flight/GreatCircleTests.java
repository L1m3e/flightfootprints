package io.github.l1m3e.flightfootprints.flight;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

/** Plain unit tests: no Spring, no database. Reference distances are the published great-circle values. */
class GreatCircleTests {

    @Test
    void knownRoutes() {
        // New York JFK - London Heathrow
        assertThat(GreatCircle.distanceKm(40.639447, -73.779317, 51.470748, -0.459909)).isCloseTo(5540, within(15.0));
        // Shanghai Pudong - New York JFK
        assertThat(GreatCircle.distanceKm(31.1434, 121.805, 40.639447, -73.779317)).isCloseTo(11862, within(25.0));
    }

    @Test
    void routeAcrossThe180thMeridian() {
        // Tokyo Narita (140°E) - Los Angeles (118°W) is 8 773 km across the Pacific. A formula
        // that mishandled the jump from +180° to -180° would go the long way round the globe.
        assertThat(GreatCircle.distanceKm(35.76858, 140.388714, 33.942501, -118.407997)).isCloseTo(8773, within(20.0));
    }

    @Test
    void quarterAndHalfOfTheEquator() {
        double circumference = 2 * Math.PI * GreatCircle.EARTH_RADIUS_KM;

        assertThat(GreatCircle.distanceKm(0, 0, 0, 90)).isCloseTo(circumference / 4, within(0.001));
        assertThat(GreatCircle.distanceKm(0, 0, 0, 180)).isCloseTo(circumference / 2, within(0.001));
        assertThat(GreatCircle.distanceKm(90, 0, -90, 0)).isCloseTo(circumference / 2, within(0.001));
    }

    @Test
    void aPointIsZeroKilometresFromItself() {
        assertThat(GreatCircle.distanceKm(31.1434, 121.805, 31.1434, 121.805)).isZero();
    }

    @Test
    void directionDoesNotMatter() {
        double outbound = GreatCircle.distanceKm(31.1434, 121.805, 40.639447, -73.779317);
        double inbound = GreatCircle.distanceKm(40.639447, -73.779317, 31.1434, 121.805);

        assertThat(outbound).isEqualTo(inbound);
    }
}
