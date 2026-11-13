package io.github.l1m3e.flightfootprints.airport;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Loads the bundled airport list into the database on startup, but only while the
 * {@code airports} table is still empty. Every later startup finds the rows and does
 * nothing, so restarting the application never touches existing data.
 */
@Component
public class AirportImporter implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AirportImporter.class);

    // ON CONFLICT makes the statement idempotent: if two instances start against an
    // empty database at the same moment, the second one simply inserts nothing.
    private static final String INSERT_SQL = """
            INSERT INTO airports (iata, name, city, country, lat, lon)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (iata) DO NOTHING
            """;

    private static final int BATCH_SIZE = 500;

    private final AirportRepository airports;
    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final Resource csv;

    AirportImporter(AirportRepository airports, JdbcTemplate jdbcTemplate, TransactionTemplate transactionTemplate,
            @Value("classpath:data/airports.csv") Resource csv) {
        this.airports = airports;
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.csv = csv;
    }

    @Override
    public void run(ApplicationArguments args) {
        importIfEmpty();
    }

    /**
     * Imports the CSV when the table is empty.
     *
     * @return the number of airports read from the CSV, or 0 when the import was skipped
     */
    public int importIfEmpty() {
        if (airports.count() > 0) {
            log.info("Airport import skipped: the airports table already has data");
            return 0;
        }

        List<Airport> rows = readCsv();

        // One transaction for all batches: either every airport is stored or none is.
        // Without it, a crash halfway through would leave a partly filled table that
        // the "is it empty?" check above would then never repair.
        transactionTemplate.executeWithoutResult(
                status -> jdbcTemplate.batchUpdate(INSERT_SQL, rows, BATCH_SIZE, AirportImporter::bind));

        log.info("Imported {} airports from {}", rows.size(), csv.getDescription());
        return rows.size();
    }

    private List<Airport> readCsv() {
        CSVFormat format = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).get();
        try (Reader reader = new InputStreamReader(csv.getInputStream(), StandardCharsets.UTF_8);
                CSVParser parser = format.parse(reader)) {
            List<Airport> rows = new ArrayList<>();
            for (CSVRecord line : parser) {
                rows.add(new Airport(
                        line.get("iata"),
                        line.get("name"),
                        blankToNull(line.get("city")),
                        line.get("country"),
                        Double.parseDouble(line.get("lat")),
                        Double.parseDouble(line.get("lon"))));
            }
            return rows;
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read " + csv.getDescription(), e);
        }
    }

    private static void bind(PreparedStatement ps, Airport airport) throws SQLException {
        ps.setString(1, airport.iata());
        ps.setString(2, airport.name());
        ps.setString(3, airport.city());
        ps.setString(4, airport.country());
        ps.setDouble(5, airport.lat());
        ps.setDouble(6, airport.lon());
    }

    private static String blankToNull(String value) {
        return value.isBlank() ? null : value;
    }
}
