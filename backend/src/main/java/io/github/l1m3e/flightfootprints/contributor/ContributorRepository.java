package io.github.l1m3e.flightfootprints.contributor;

import java.util.List;

import org.springframework.data.repository.ListCrudRepository;

public interface ContributorRepository extends ListCrudRepository<Contributor, Long> {

    /** In the order they were added: whoever joined first stays at the top. */
    List<Contributor> findAllByOrderByIdAsc();
}
