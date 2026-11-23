package io.github.l1m3e.flightfootprints.airline;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import org.junit.jupiter.api.Test;

class AirlineApiIntegrationTests extends IntegrationTest {

    @Test
    void anyoneCanReadTheAirlinesTheMigrationCreated() {
        assertThat(mvc.get().uri("/api/airlines"))
                .hasStatusOk()
                .bodyJson().extractingPath("$[*].iata").asArray()
                .hasSize(110)
                .doesNotHaveDuplicates()
                // Designators may start or end with a digit.
                .contains("CA", "MU", "9C", "3U", "B6", "U2");
    }

    @Test
    void icaoDesignatorsAreUniqueToo() {
        assertThat(mvc.get().uri("/api/airlines"))
                .hasStatusOk()
                .bodyJson().extractingPath("$[*].icao").asArray()
                .hasSize(110)
                .doesNotHaveDuplicates()
                .contains("CCA", "CES", "CQH");
    }

    @Test
    void anAirlineComesWithItsNamesInBothLanguagesAndTheOtherNamesPeopleUse() {
        assertThat(mvc.get().uri("/api/airlines"))
                .hasStatusOk()
                .bodyJson().extractingPath("$[?(@.iata == 'CA')]").asArray()
                .singleElement().asInstanceOf(org.assertj.core.api.InstanceOfAssertFactories.MAP)
                .containsEntry("icao", "CCA")
                .containsEntry("name", "Air China")
                .containsEntry("nameZh", "中国国际航空")
                .containsEntry("aliases", java.util.List.of("中国国航", "国航"));
    }

    @Test
    void anAirlineWithoutAChineseNameHasNoneAndNoAliasesIsAnEmptyList() {
        assertThat(mvc.get().uri("/api/airlines"))
                .hasStatusOk()
                .bodyJson().extractingPath("$[?(@.iata == 'YP')]").asArray()
                .singleElement().asInstanceOf(org.assertj.core.api.InstanceOfAssertFactories.MAP)
                .containsEntry("name", "Air Premia")
                .containsEntry("nameZh", null)
                .containsEntry("aliases", java.util.List.of());
    }
}
