package io.github.l1m3e.flightfootprints.flight;

/** Distance along the Earth's surface between two points given as latitude and longitude. */
public final class GreatCircle {

    /** Mean radius of the Earth in kilometres (IUGG value). */
    static final double EARTH_RADIUS_KM = 6371.0088;

    private GreatCircle() {
    }

    /**
     * Haversine formula. It treats the Earth as a sphere, which is off by at most about
     * 0.5 % compared with the real, slightly flattened shape: plenty for a flight log.
     *
     * <p>Only the difference between the two longitudes enters the formula, and only
     * through a squared sine, so routes that cross the 180° meridian need no special case.
     *
     * @return the distance in kilometres
     */
    public static double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double halfDeltaPhi = Math.toRadians(lat2 - lat1) / 2;
        double halfDeltaLambda = Math.toRadians(lon2 - lon1) / 2;

        double a = Math.sin(halfDeltaPhi) * Math.sin(halfDeltaPhi)
                + Math.cos(phi1) * Math.cos(phi2) * Math.sin(halfDeltaLambda) * Math.sin(halfDeltaLambda);

        // Rounding can push `a` a hair above 1 for points on opposite sides of the globe,
        // and asin of that would be NaN.
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
    }
}
