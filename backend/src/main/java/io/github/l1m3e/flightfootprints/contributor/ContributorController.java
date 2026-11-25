package io.github.l1m3e.flightfootprints.contributor;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Who may call what is decided in SecurityConfig, not here: everyone may read the list,
 * and like every other change under /api, changing it requires the ADMIN role.
 */
@RestController
@RequestMapping("/api/contributors")
class ContributorController {

    private final ContributorService contributorService;

    ContributorController(ContributorService contributorService) {
        this.contributorService = contributorService;
    }

    @GetMapping
    List<ContributorResponse> list() {
        return contributorService.list();
    }

    /** 201 Created, with the address of the new entry in the Location header. */
    @PostMapping
    ResponseEntity<ContributorResponse> create(@Valid @RequestBody ContributorRequest request) {
        ContributorResponse created = contributorService.create(request);
        return ResponseEntity.created(URI.create("/api/contributors/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    ContributorResponse update(@PathVariable long id, @Valid @RequestBody ContributorRequest request) {
        return contributorService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable long id) {
        contributorService.delete(id);
    }
}
