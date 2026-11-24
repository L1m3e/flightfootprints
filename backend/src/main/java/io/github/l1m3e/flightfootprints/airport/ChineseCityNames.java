package io.github.l1m3e.flightfootprints.airport;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.sql.PreparedStatement;
import java.util.LinkedHashMap;
import java.util.Map;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Writes the Chinese city names from {@code data/airport-cities-zh.csv} into the
 * {@code airports} table.
 *
 * <p>It runs on every startup, after the airports have been imported, and changes only
 * the rows whose name differs from the file. A new database and one that has been running
 * for months therefore end up with the same names, and adding a name is one new line in
 * the file. The names are kept apart from {@code airports.csv} because that file is
 * regenerated from OurAirports, which has no Chinese names.
 */
@Component
public class ChineseCityNames {

    private static final Logger log = LoggerFactory.getLogger(ChineseCityNames.class);

    // One statement for all names: the two arrays are turned into rows (iata, city_zh)
    // and joined to the table. IS DISTINCT FROM also sees the difference between NULL and
    // a name, and leaves rows alone that already have the right one.
    private static final String UPDATE_SQL = """
            UPDATE airports a
            SET city_zh = names.city_zh
            FROM unnest(?::text[], ?::text[]) AS names(iata, city_zh)
            WHERE a.iata = names.iata
              AND a.city_zh IS DISTINCT FROM names.city_zh
            """;

    private final JdbcTemplate jdbcTemplate;
    private final Resource csv;

    ChineseCityNames(JdbcTemplate jdbcTemplate, @Value("classpath:data/airport-cities-zh.csv") Resource csv) {
        this.jdbcTemplate = jdbcTemplate;
        this.csv = csv;
    }

    /**
     * @return the number of airports whose Chinese city name was set or changed
     */
    public int apply() {
        Map<String, String> names = readCsv();
        String[] iataCodes = names.keySet().toArray(String[]::new);
        String[] cityNames = names.values().toArray(String[]::new);

        int changed = jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(UPDATE_SQL);
            statement.setArray(1, connection.createArrayOf("text", iataCodes));
            statement.setArray(2, connection.createArrayOf("text", cityNames));
            return statement;
        });

        if (changed > 0) {
            log.info("Set the Chinese city name of {} airports from {}", changed, csv.getDescription());
        }
        return changed;
    }

    /** IATA code to Chinese city name, in the order of the file. */
    Map<String, String> readCsv() {
        CSVFormat format = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).get();
        try (Reader reader = new InputStreamReader(csv.getInputStream(), StandardCharsets.UTF_8);
                CSVParser parser = format.parse(reader)) {
            Map<String, String> names = new LinkedHashMap<>();
            for (CSVRecord line : parser) {
                if (names.put(line.get("iata"), line.get("city_zh")) != null) {
                    throw new IllegalStateException(line.get("iata") + " is listed twice in " + csv.getDescription());
                }
            }
            return names;
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read " + csv.getDescription(), e);
        }
    }
}
