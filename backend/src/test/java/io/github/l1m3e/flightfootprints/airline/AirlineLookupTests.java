package io.github.l1m3e.flightfootprints.airline;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class AirlineLookupTests extends IntegrationTest {

    @Autowired
    private AirlineLookup lookup;

    @Autowired
    private AirlineQueries queries;

    /**
     * Guards the data as much as the code: if a migration ever gave two airlines the same
     * name or code, neither could be found by it, and this test would say which.
     */
    @Test
    void everyAirlineIsFoundByEachOfItsNamesAndCodes() {
        List<Airline> airlines = queries.findAll();
        assertThat(airlines).hasSize(110);

        for (Airline airline : airlines) {
            List<String> labels = new ArrayList<>(List.of(airline.iata(), airline.icao(), airline.name()));
            if (airline.nameZh() != null) {
                labels.add(airline.nameZh());
            }
            labels.addAll(airline.aliases());

            for (String label : labels) {
                assertThat(lookup.find(label))
                        .as("\"%s\" should find %s (%s)", label, airline.name(), airline.iata())
                        .map(Airline::iata).contains(airline.iata());
            }
        }
    }

    @Test
    void caseSpacesAndPunctuationMakeNoDifference() {
        assertThat(lookup.find("  cathay   PACIFIC ")).map(Airline::iata).contains("CX");
        assertThat(lookup.find("cathaypacific")).map(Airline::iata).contains("CX");
        assertThat(lookup.find("Tway Air")).map(Airline::iata).contains("TW");
        assertThat(lookup.find("t-way air")).map(Airline::iata).contains("TW");
        assertThat(lookup.find("中国　国际航空")).map(Airline::iata).contains("CA");
    }

    @Test
    void textThatIsNoAirlineFindsNothing() {
        assertThat(lookup.find("Footprint Air")).isEmpty();
        assertThat(lookup.find("Cathay Pacific Cargo")).isEmpty();
        assertThat(lookup.find("")).isEmpty();
        assertThat(lookup.find("   ")).isEmpty();
        assertThat(lookup.find(null)).isEmpty();
    }

    @Test
    void aNameThatTwoAirlinesShareFindsNeither() {
        Airline first = new Airline("AA", "AAA", "First Air", "同名航空", List.of("Shared"));
        Airline second = new Airline("BB", "BBB", "Second Air", null, List.of("shared", "同名航空"));

        Map<String, Airline> index = AirlineLookup.buildIndex(List.of(first, second));

        assertThat(index).doesNotContainKeys("shared", "同名航空");
        assertThat(index).containsEntry("firstair", first).containsEntry("bb", second);
    }
}
