package io.github.l1m3e.flightfootprints.airport;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import org.junit.jupiter.api.Test;

class AirportSearchIntegrationTests extends IntegrationTest {

    @Test
    void anExactCodeComesFirstWhateverItsCase() {
        assertThat(mvc.get().uri("/api/airports").param("q", "pvg"))
                .hasStatusOk()
                .bodyJson().extractingPath("$[0]").asMap()
                .containsEntry("iata", "PVG")
                .containsEntry("name", "Shanghai Pudong International Airport")
                .containsEntry("country", "CN");
    }

    @Test
    void aCityNameFindsAllItsAirports() {
        assertThat(mvc.get().uri("/api/airports").param("q", "Shanghai"))
                .hasStatusOk()
                .bodyJson().extractingPath("$[*].iata").asArray()
                .contains("PVG", "SHA");
    }

    @Test
    void partOfAnAirportNameIsEnough() {
        assertThat(mvc.get().uri("/api/airports").param("q", "heathrow"))
                .hasStatusOk()
                .bodyJson().extractingPath("$[*].iata").asArray()
                .containsExactly("LHR");
    }

    @Test
    void codesThatStartWithTheTermRankAboveNamesThatContainIt() {
        assertThat(mvc.get().uri("/api/airports").param("q", "a"))
                .hasStatusOk()
                .bodyJson().extractingPath("$[*].iata").asArray()
                .hasSize(10)
                .allSatisfy(iata -> assertThat((String) iata).startsWith("A"));
    }

    @Test
    void anEmptyTermReturnsNothing() {
        assertThat(mvc.get().uri("/api/airports")).hasStatusOk().bodyJson().isStrictlyEqualTo("[]");
        assertThat(mvc.get().uri("/api/airports").param("q", "   ")).hasStatusOk().bodyJson().isStrictlyEqualTo("[]");
    }

    @Test
    void wildcardCharactersAreTakenLiterally() {
        // Unescaped, "%" would match every airport and "___" every three-letter code.
        assertThat(mvc.get().uri("/api/airports").param("q", "%")).hasStatusOk().bodyJson().isStrictlyEqualTo("[]");
        assertThat(mvc.get().uri("/api/airports").param("q", "___")).hasStatusOk().bodyJson().isStrictlyEqualTo("[]");
    }
}
