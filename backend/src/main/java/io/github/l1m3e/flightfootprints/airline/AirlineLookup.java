package io.github.l1m3e.flightfootprints.airline;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.stereotype.Service;

/**
 * Finds the airline that a piece of text means: an IATA or ICAO code, the English name,
 * the Chinese name or one of the other names in the airlines table.
 *
 * <p>Upper and lower case, spaces and punctuation make no difference, so "cathay pacific",
 * "CathayPacific", "国泰航空" and "cx" all find the same airline. The migration that moved
 * the existing flights to airline codes (V5) compares in the same way.
 */
@Service
public class AirlineLookup {

    /** Characters that are skipped when two names are compared. */
    private static final String IGNORED = " 　.,-'’()（）·";

    private final AirlineQueries queries;

    /**
     * Every name and code, in its comparable form, with the airline it belongs to. The
     * airlines are created by Flyway migrations and never change while the application
     * runs, so this is built once, on first use.
     */
    private volatile Map<String, Airline> byLabel;

    AirlineLookup(AirlineQueries queries) {
        this.queries = queries;
    }

    /** The airline the text stands for, or empty when it fits none or more than one. */
    public Optional<Airline> find(String codeOrName) {
        if (codeOrName == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(index().get(comparable(codeOrName)));
    }

    private Map<String, Airline> index() {
        Map<String, Airline> index = byLabel;
        if (index == null) {
            index = buildIndex(queries.findAll());
            byLabel = index;
        }
        return index;
    }

    static Map<String, Airline> buildIndex(List<Airline> airlines) {
        Map<String, Airline> index = new HashMap<>();
        // A name that two airlines share identifies neither of them.
        Set<String> shared = new HashSet<>();
        for (Airline airline : airlines) {
            for (String label : labelsOf(airline)) {
                Airline other = index.putIfAbsent(label, airline);
                if (other != null && !other.iata().equals(airline.iata())) {
                    shared.add(label);
                }
            }
        }
        index.keySet().removeAll(shared);
        return Map.copyOf(index);
    }

    private static List<String> labelsOf(Airline airline) {
        List<String> labels = new ArrayList<>();
        labels.add(comparable(airline.iata()));
        labels.add(comparable(airline.icao()));
        labels.add(comparable(airline.name()));
        if (airline.nameZh() != null) {
            labels.add(comparable(airline.nameZh()));
        }
        airline.aliases().forEach(alias -> labels.add(comparable(alias)));
        labels.removeIf(String::isEmpty);
        return labels;
    }

    /** The form in which names are compared: lower case, without spaces and punctuation. */
    static String comparable(String text) {
        StringBuilder result = new StringBuilder(text.length());
        text.toLowerCase(Locale.ROOT).codePoints()
                .filter(character -> IGNORED.indexOf(character) < 0)
                .forEach(result::appendCodePoint);
        return result.toString();
    }
}
