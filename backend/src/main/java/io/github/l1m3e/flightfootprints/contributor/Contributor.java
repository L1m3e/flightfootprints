package io.github.l1m3e.flightfootprints.contributor;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

/**
 * One row of the contributors table: somebody who helped build the site.
 *
 * @param link a web address the name leads to, {@code null} when there is none
 * @param note what the person did, {@code null} when nothing was written
 */
@Table("contributors")
public record Contributor(@Id Long id, String name, String link, String note, @CreatedDate Instant createdAt) {
}
