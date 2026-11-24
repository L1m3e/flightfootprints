package io.github.l1m3e.flightfootprints.airport;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** The names are written when the application starts, which has happened before any test runs. */
class ChineseCityNamesTests extends IntegrationTest {

    @Autowired
    private ChineseCityNames chineseCityNames;

    /** Some tests change names on purpose. The table is shared, so each one puts them back. */
    @AfterEach
    void restoreTheNames() {
        chineseCityNames.apply();
    }

    private String cityZh(String iata) {
        return jdbc.sql("SELECT city_zh FROM airports WHERE iata = :iata").param("iata", iata)
                .query(String.class).optional().orElse(null);
    }

    @Test
    void theAirportsOfTheFlightsOnTheLiveSiteHaveTheirChineseNames() {
        assertThat(cityZh("HKG")).isEqualTo("香港");
        assertThat(cityZh("JFK")).isEqualTo("纽约");
        assertThat(cityZh("PVG")).isEqualTo("上海");
        assertThat(cityZh("WUH")).isEqualTo("武汉");
    }

    /** A code with a typing mistake would match no airport, and its name would silently go nowhere. */
    @Test
    void everyNameInTheFileBelongsToAnAirport() {
        Map<String, String> names = chineseCityNames.readCsv();
        List<String> airports = jdbc.sql("SELECT iata FROM airports").query(String.class).list();

        assertThat(names).isNotEmpty();
        assertThat(airports).containsAll(names.keySet());
        assertThat(names.values()).allSatisfy(name -> assertThat(name).isNotBlank());
        assertThat(jdbc.sql("SELECT count(*) FROM airports WHERE city_zh IS NOT NULL").query(Long.class).single())
                .isEqualTo(names.size());
    }

    @Test
    void everyAirportInGreaterChinaHasAChineseName() {
        assertThat(jdbc.sql("""
                SELECT iata FROM airports
                WHERE country IN ('CN', 'HK', 'MO', 'TW') AND city_zh IS NULL
                """).query(String.class).list()).isEmpty();
    }

    @Test
    void applyingTheNamesAgainChangesNothing() {
        assertThat(chineseCityNames.apply()).isZero();
    }

    @Test
    void aNameThatIsMissingOrWrongInTheDatabaseIsPutRight() {
        jdbc.sql("UPDATE airports SET city_zh = NULL WHERE iata = 'PVG'").update();
        jdbc.sql("UPDATE airports SET city_zh = '沪' WHERE iata = 'SHA'").update();

        assertThat(chineseCityNames.apply()).isEqualTo(2);

        assertThat(cityZh("PVG")).isEqualTo("上海");
        assertThat(cityZh("SHA")).isEqualTo("上海");
    }
}
