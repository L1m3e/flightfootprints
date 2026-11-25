package io.github.l1m3e.flightfootprints.contributor;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ContributorService {

    private final ContributorRepository contributors;

    ContributorService(ContributorRepository contributors) {
        this.contributors = contributors;
    }

    public List<ContributorResponse> list() {
        return contributors.findAllByOrderByIdAsc().stream().map(ContributorResponse::of).toList();
    }

    @Transactional
    public ContributorResponse create(ContributorRequest request) {
        // createdAt is filled in by Spring Data's auditing.
        Contributor saved = contributors.save(new Contributor(null, request.name(), request.link(), request.note(), null));
        return ContributorResponse.of(saved);
    }

    @Transactional
    public ContributorResponse update(long id, ContributorRequest request) {
        Contributor existing = contributors.findById(id).orElseThrow(() -> notFound(id));
        // Same id and creation time, so the entry keeps its place in the list.
        Contributor saved = contributors.save(
                new Contributor(existing.id(), request.name(), request.link(), request.note(), existing.createdAt()));
        return ContributorResponse.of(saved);
    }

    @Transactional
    public void delete(long id) {
        if (!contributors.existsById(id)) {
            throw notFound(id);
        }
        contributors.deleteById(id);
    }

    private static ResponseStatusException notFound(long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Contributor " + id + " does not exist");
    }
}
