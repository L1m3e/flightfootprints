CREATE TABLE flights (
    id          BIGINT      GENERATED ALWAYS AS IDENTITY,
    flight_date DATE        NOT NULL,
    flight_no   VARCHAR(8),
    airline     VARCHAR(60) NOT NULL,
    from_iata   VARCHAR(3)  NOT NULL,
    to_iata     VARCHAR(3)  NOT NULL,
    aircraft    VARCHAR(60),
    seat        VARCHAR(5),
    cabin       VARCHAR(20),
    -- Great-circle distance between the two airports, computed by the backend on every save.
    distance_km INTEGER     NOT NULL,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL,

    CONSTRAINT flights_pkey               PRIMARY KEY (id),
    CONSTRAINT flights_from_iata_fkey     FOREIGN KEY (from_iata) REFERENCES airports (iata),
    CONSTRAINT flights_to_iata_fkey       FOREIGN KEY (to_iata) REFERENCES airports (iata),
    CONSTRAINT flights_different_airports CHECK (from_iata <> to_iata),
    CONSTRAINT flights_cabin_valid        CHECK (cabin IN ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST')),
    CONSTRAINT flights_distance_valid     CHECK (distance_km >= 0)
);

-- The timeline lists flights newest first.
CREATE INDEX flights_flight_date_idx ON flights (flight_date DESC, id DESC);
