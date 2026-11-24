-- A flight now refers to its airline by IATA code and keeps the airline's name in English
-- and in Chinese. Until now it held one piece of text, in whichever language it was typed
-- in, so the page showed "国泰航空" to English readers as well.

ALTER TABLE flights RENAME COLUMN airline TO airline_name;

ALTER TABLE flights
    -- NULL for an airline that is not in the airlines table: that flight keeps the name
    -- as it was typed, in airline_name, and has no Chinese name.
    ADD COLUMN airline_iata    VARCHAR(2),
    ADD COLUMN airline_name_zh VARCHAR(60),
    ADD CONSTRAINT flights_airline_iata_fkey FOREIGN KEY (airline_iata) REFERENCES airlines (iata);

-- The flights that exist already. What was typed is looked up among everything an airline
-- is known by: its English name, its Chinese name, its other names and its two codes.
-- Upper and lower case, spaces and punctuation make no difference, so "cathaypacific"
-- finds Cathay Pacific. A flight is only changed when exactly one airline fits.
WITH known_by AS (
    SELECT iata, name AS label FROM airlines
    UNION ALL
    SELECT iata, name_zh FROM airlines WHERE name_zh IS NOT NULL
    UNION ALL
    SELECT iata, unnest(aliases) FROM airlines
    UNION ALL
    SELECT iata, iata FROM airlines
    UNION ALL
    SELECT iata, icao FROM airlines
),
found AS (
    SELECT f.id, min(k.iata) AS iata
    FROM flights f
    JOIN known_by k
      ON translate(lower(k.label), ' 　.,-''’()（）·', '') = translate(lower(f.airline_name), ' 　.,-''’()（）·', '')
    GROUP BY f.id
    HAVING count(DISTINCT k.iata) = 1
)
UPDATE flights f
SET airline_iata    = a.iata,
    airline_name    = a.name,
    airline_name_zh = a.name_zh
FROM found
JOIN airlines a ON a.iata = found.iata
WHERE f.id = found.id;

-- Nothing is dropped: a flight whose airline was not found stays exactly as it was. Each
-- one is reported in the log of the migration, so it can be corrected by hand.
DO $$
DECLARE
    flight RECORD;
BEGIN
    FOR flight IN
        SELECT id, flight_date, flight_no, airline_name FROM flights WHERE airline_iata IS NULL ORDER BY id
    LOOP
        RAISE WARNING 'Flight % on % (%): the airline "%" is not in the airlines table and was kept as typed',
            flight.id, flight.flight_date, coalesce(flight.flight_no, 'no flight number'), flight.airline_name;
    END LOOP;
END
$$;
