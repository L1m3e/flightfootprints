package io.github.l1m3e.flightfootprints.flight;

import static io.github.l1m3e.flightfootprints.TestRequests.csrfToken;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

class FlightApiIntegrationTests extends IntegrationTest {

    private static final String PVG_TO_JFK = flight("2024-05-01", "PVG", "JFK");

    @Test
    void visitorsCanReadFlightsButNotChangeThem() {
        long id = create(signInAsAdmin(), PVG_TO_JFK);

        assertThat(mvc.get().uri("/api/flights")).hasStatusOk().bodyJson().extractingPath("$").asArray().hasSize(1);
        assertThat(mvc.get().uri("/api/flights/" + id)).hasStatusOk();

        assertThat(mvc.post().uri("/api/flights").with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(PVG_TO_JFK))
                .hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(mvc.put().uri("/api/flights/" + id).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(PVG_TO_JFK))
                .hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(mvc.delete().uri("/api/flights/" + id).with(csrfToken()))
                .hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(countFlights()).isEqualTo(1);
    }

    @Test
    void signedInRegularUsersCannotChangeFlightsEither() {
        long id = create(signInAsAdmin(), PVG_TO_JFK);
        register("Amelia", USER_PASSWORD);
        MockHttpSession user = signIn("Amelia", USER_PASSWORD);

        assertThat(mvc.post().uri("/api/flights").session(user).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(PVG_TO_JFK))
                .hasStatus(HttpStatus.FORBIDDEN)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
        assertThat(mvc.put().uri("/api/flights/" + id).session(user).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(flight("2020-01-01", "PVG", "NRT")))
                .hasStatus(HttpStatus.FORBIDDEN);
        assertThat(mvc.delete().uri("/api/flights/" + id).session(user).with(csrfToken()))
                .hasStatus(HttpStatus.FORBIDDEN);

        assertThat(countFlights()).isEqualTo(1);
        assertThat(mvc.get().uri("/api/flights/" + id))
                .bodyJson().extractingPath("$.flightDate").isEqualTo("2024-05-01");
    }

    @Test
    void theAdministratorNeedsACsrfTokenToo() {
        assertThat(mvc.post().uri("/api/flights").session(signInAsAdmin())
                .contentType(MediaType.APPLICATION_JSON).content(PVG_TO_JFK))
                .hasStatus(HttpStatus.FORBIDDEN);
        assertThat(countFlights()).isZero();
    }

    @Test
    void creatingAFlightComputesTheDistanceAndReturnsBothAirports() {
        MvcTestResult created = mvc.post().uri("/api/flights").session(signInAsAdmin()).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(PVG_TO_JFK)
                .exchange();

        assertThat(created).hasStatus(HttpStatus.CREATED);
        long id = idFromLocation(created);
        assertThat(created).bodyJson().isLenientlyEqualTo("""
                {
                  "id": %d,
                  "flightDate": "2024-05-01",
                  "flightNo": "MU587",
                  "airline": {"iata": "MU", "name": "China Eastern Airlines", "nameZh": "中国东方航空"},
                  "from": {"iata": "PVG", "city": "Shanghai (Pudong)", "cityZh": "上海", "country": "CN"},
                  "to": {"iata": "JFK", "city": "New York", "cityZh": "纽约", "country": "US"},
                  "aircraft": "Boeing 777-300ER",
                  "seat": "32A",
                  "cabin": "ECONOMY",
                  "notes": "First long-haul flight"
                }
                """.formatted(id));
        // 11 862 km is the published great-circle distance between the two airports.
        assertThat(created).bodyJson().extractingPath("$.distanceKm").asNumber()
                .satisfies(distance -> assertThat(distance.intValue()).isBetween(11_840, 11_885));
    }

    @Test
    void inputIsTidiedBeforeItIsStored() {
        long id = create(signInAsAdmin(), """
                {"flightDate": "2024-05-01", "flightNo": " mu 587 ", "airline": "  Footprint Air ",
                 "fromIata": "pvg", "toIata": "jfk", "aircraft": "   ", "seat": "32a", "notes": ""}
                """);

        assertThat(mvc.get().uri("/api/flights/" + id)).hasStatusOk().bodyJson().isLenientlyEqualTo("""
                {"flightNo": "MU587", "airline": {"name": "Footprint Air"}, "from": {"iata": "PVG"},
                 "to": {"iata": "JFK"}, "aircraft": null, "seat": "32A", "cabin": null, "notes": null}
                """);
    }

    /** However the airline is written, the flight ends up with its code and both of its names. */
    @ParameterizedTest(name = "\"{0}\" is {1}")
    @CsvSource(delimiter = '|', textBlock = """
            CX                      | CX | Cathay Pacific         | 国泰航空
            cx                      | CX | Cathay Pacific         | 国泰航空
            CPA                     | CX | Cathay Pacific         | 国泰航空
            Cathay Pacific          | CX | Cathay Pacific         | 国泰航空
            cathaypacific           | CX | Cathay Pacific         | 国泰航空
            国泰航空                | CX | Cathay Pacific         | 国泰航空
            Cathay                  | CX | Cathay Pacific         | 国泰航空
            All Nippon Airways      | NH | All Nippon Airways     | 全日空
            ANA                     | NH | All Nippon Airways     | 全日空
            东航                    | MU | China Eastern Airlines | 中国东方航空
            T'way Air               | TW | T'way Air              | 德威航空
            tway air                | TW | T'way Air              | 德威航空
            9C                      | 9C | Spring Airlines        | 春秋航空
            """)
    void aKnownAirlineIsStoredByItsCodeWithBothItsNames(String typed, String iata, String name, String nameZh) {
        long id = create(signInAsAdmin(), flightWithAirline(typed));

        assertThat(mvc.get().uri("/api/flights/" + id)).hasStatusOk()
                .bodyJson().extractingPath("$.airline").asMap()
                .containsEntry("iata", iata).containsEntry("name", name).containsEntry("nameZh", nameZh);
        assertThat(jdbc.sql("SELECT airline_iata FROM flights WHERE id = :id").param("id", id)
                .query(String.class).single()).isEqualTo(iata);
    }

    @Test
    void anAirlineWithoutAChineseNameHasNone() {
        long id = create(signInAsAdmin(), flightWithAirline("Air Premia"));

        assertThat(mvc.get().uri("/api/flights/" + id)).hasStatusOk().bodyJson().isLenientlyEqualTo("""
                {"airline": {"iata": "YP", "name": "Air Premia", "nameZh": null}}
                """);
    }

    @Test
    void anAirlineThatIsNotInTheListIsStoredAsTyped() {
        long id = create(signInAsAdmin(), flightWithAirline("Footprint Air"));

        assertThat(mvc.get().uri("/api/flights/" + id)).hasStatusOk().bodyJson().isLenientlyEqualTo("""
                {"airline": {"iata": null, "name": "Footprint Air", "nameZh": null}}
                """);
    }

    @Test
    void changingTheAirlineReplacesTheCodeAndBothNames() {
        MockHttpSession admin = signInAsAdmin();
        long id = create(admin, flightWithAirline("国泰航空"));

        assertThat(mvc.put().uri("/api/flights/" + id).session(admin).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(flightWithAirline("Footprint Air")))
                .hasStatusOk()
                .bodyJson().isLenientlyEqualTo("""
                        {"airline": {"iata": null, "name": "Footprint Air", "nameZh": null}}
                        """);
        assertThat(mvc.put().uri("/api/flights/" + id).session(admin).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(flightWithAirline("NH")))
                .hasStatusOk()
                .bodyJson().isLenientlyEqualTo("""
                        {"airline": {"iata": "NH", "name": "All Nippon Airways", "nameZh": "全日空"}}
                        """);
    }

    @Test
    void onlyDateAirlineAndAirportsAreRequired() {
        long id = create(signInAsAdmin(), """
                {"flightDate": "2019-07-20", "airline": "Air China", "fromIata": "PEK", "toIata": "SHA"}
                """);

        assertThat(mvc.get().uri("/api/flights/" + id)).hasStatusOk().bodyJson().isLenientlyEqualTo("""
                {"flightNo": null, "aircraft": null, "seat": null, "cabin": null, "notes": null}
                """);
    }

    @Test
    void flightsAreListedNewestFirst() {
        MockHttpSession admin = signInAsAdmin();
        long oldest = create(admin, flight("2023-05-01", "PVG", "JFK"));
        long sameDayFirst = create(admin, flight("2024-08-15", "JFK", "LHR"));
        long sameDaySecond = create(admin, flight("2024-08-15", "LHR", "PVG"));

        assertThat(mvc.get().uri("/api/flights"))
                .hasStatusOk()
                .bodyJson().extractingPath("$[*].id").asArray()
                .containsExactly((int) sameDaySecond, (int) sameDayFirst, (int) oldest);
    }

    @Test
    void updatingAFlightRecomputesTheDistanceAndKeepsItsCreationTime() {
        MockHttpSession admin = signInAsAdmin();
        long id = create(admin, PVG_TO_JFK);
        Instant createdAt = timestamp("created_at", id);
        Instant firstUpdate = timestamp("updated_at", id);

        assertThat(mvc.put().uri("/api/flights/" + id).session(admin).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(flight("2024-05-02", "PVG", "NRT")))
                .hasStatusOk()
                .bodyJson().isLenientlyEqualTo("""
                        {"id": %d, "flightDate": "2024-05-02", "to": {"iata": "NRT"}}
                        """.formatted(id))
                // Shanghai - Tokyo Narita is 1 788 km.
                .extractingPath("$.distanceKm").asNumber()
                .satisfies(distance -> assertThat(distance.intValue()).isBetween(1_770, 1_805));

        assertThat(countFlights()).isEqualTo(1);
        assertThat(timestamp("created_at", id)).isEqualTo(createdAt);
        assertThat(timestamp("updated_at", id)).isAfterOrEqualTo(firstUpdate);
    }

    @Test
    void deletingAFlightRemovesIt() {
        MockHttpSession admin = signInAsAdmin();
        long id = create(admin, PVG_TO_JFK);

        assertThat(mvc.delete().uri("/api/flights/" + id).session(admin).with(csrfToken()))
                .hasStatus(HttpStatus.NO_CONTENT);

        assertThat(countFlights()).isZero();
        assertThat(mvc.get().uri("/api/flights/" + id))
                .hasStatus(HttpStatus.NOT_FOUND)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
        assertThat(mvc.delete().uri("/api/flights/" + id).session(admin).with(csrfToken()))
                .hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    void aFlightThatDoesNotExistCannotBeChanged() {
        assertThat(mvc.put().uri("/api/flights/999999").session(signInAsAdmin()).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(PVG_TO_JFK))
                .hasStatus(HttpStatus.NOT_FOUND);
        assertThat(countFlights()).isZero();
    }

    @Test
    void missingRequiredFieldsAreAllReported() {
        assertThat(postAsAdmin("""
                {"flightNo": "MU587"}
                """))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson().extractingPath("$.errors[*].field").asArray()
                .containsExactlyInAnyOrder("flightDate", "airline", "fromIata", "toIata");
        assertThat(countFlights()).isZero();
    }

    @Test
    void airportsMustExistAndDiffer() {
        assertThat(postAsAdmin(flight("2024-05-01", "ZZZ", "JFK")))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson().isLenientlyEqualTo("""
                        {"errors": [{"field": "fromIata", "code": "UnknownAirport"}]}
                        """);
        assertThat(postAsAdmin(flight("2024-05-01", "PVG", "PVG")))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson().isLenientlyEqualTo("""
                        {"errors": [{"field": "toIata", "code": "SameAirport"}]}
                        """);
        assertThat(countFlights()).isZero();
    }

    @Test
    void aDateInTheFutureIsRejected() {
        assertThat(postAsAdmin(flight(LocalDate.now().plusDays(10).toString(), "PVG", "JFK")))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson().isLenientlyEqualTo("""
                        {"errors": [{"field": "flightDate", "code": "InFuture"}]}
                        """);
        // Today is fine, wherever in the world "today" is.
        assertThat(postAsAdmin(flight(LocalDate.now().toString(), "PVG", "JFK"))).hasStatus(HttpStatus.CREATED);
    }

    @Test
    void malformedValuesAreRejected() {
        assertThat(postAsAdmin(PVG_TO_JFK.replace("MU587", "587-MU")))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson().extractingPath("$.errors[*].field").asArray().containsExactly("flightNo");
        assertThat(postAsAdmin(PVG_TO_JFK.replace("ECONOMY", "LUXURY")))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
        assertThat(postAsAdmin(PVG_TO_JFK.replace("2024-05-01", "yesterday")))
                .hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(countFlights()).isZero();
    }

    private static String flightWithAirline(String airline) {
        return """
                {"flightDate": "2024-05-01", "airline": "%s", "fromIata": "PVG", "toIata": "JFK"}
                """.formatted(airline);
    }

    private static String flight(String date, String from, String to) {
        return """
                {"flightDate": "%s", "flightNo": "MU587", "airline": "China Eastern Airlines",
                 "fromIata": "%s", "toIata": "%s", "aircraft": "Boeing 777-300ER",
                 "seat": "32A", "cabin": "ECONOMY", "notes": "First long-haul flight"}
                """.formatted(date, from, to);
    }

    private MvcTestResult postAsAdmin(String json) {
        return mvc.post().uri("/api/flights").session(signInAsAdmin()).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(json)
                .exchange();
    }

    /** Creates a flight and returns its id. */
    private long create(MockHttpSession admin, String json) {
        MvcTestResult created = mvc.post().uri("/api/flights").session(admin).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(json)
                .exchange();
        assertThat(created).hasStatus(HttpStatus.CREATED);
        return idFromLocation(created);
    }

    private static long idFromLocation(MvcTestResult created) {
        String location = created.getResponse().getHeader("Location");
        assertThat(location).startsWith("/api/flights/");
        return Long.parseLong(location.substring("/api/flights/".length()));
    }

    private long countFlights() {
        return jdbc.sql("SELECT count(*) FROM flights").query(Long.class).single();
    }

    private Instant timestamp(String column, long id) {
        return jdbc.sql("SELECT " + column + " FROM flights WHERE id = :id").param("id", id)
                .query(java.sql.Timestamp.class).single().toInstant();
    }
}
