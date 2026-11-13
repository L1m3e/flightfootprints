-- Reference data from OurAirports (public domain).
-- The rows are loaded by AirportImporter on the first startup, not by this migration.
CREATE TABLE airports (
    iata    VARCHAR(3)       NOT NULL,
    name    TEXT             NOT NULL,
    city    TEXT,
    country VARCHAR(2)       NOT NULL,
    lat     DOUBLE PRECISION NOT NULL,
    lon     DOUBLE PRECISION NOT NULL,

    CONSTRAINT airports_pkey           PRIMARY KEY (iata),
    CONSTRAINT airports_iata_format    CHECK (iata ~ '^[A-Z]{3}$'),
    CONSTRAINT airports_country_format CHECK (country ~ '^[A-Z]{2}$'),
    CONSTRAINT airports_lat_range      CHECK (lat BETWEEN -90 AND 90),
    CONSTRAINT airports_lon_range      CHECK (lon BETWEEN -180 AND 180)
);
