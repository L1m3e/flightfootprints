-- People who helped build the site, shown on the "Contributors" page. An administrator
-- adds, changes and removes them there; visitors only read the list.
CREATE TABLE contributors (
    id         BIGINT       GENERATED ALWAYS AS IDENTITY,
    name       VARCHAR(60)  NOT NULL,
    -- Where the name leads: a GitHub profile, a home page. Optional.
    link       VARCHAR(200),
    -- What the person did, in a sentence. Optional.
    note       VARCHAR(200),
    created_at TIMESTAMPTZ  NOT NULL,

    CONSTRAINT contributors_pkey           PRIMARY KEY (id),
    CONSTRAINT contributors_name_not_blank CHECK (btrim(name) <> ''),
    -- A link is put into the page as it is, so it must be a web address and nothing that
    -- a browser would run (such as "javascript:..."). The application checks this too.
    CONSTRAINT contributors_link_is_web    CHECK (link ~ '^https?://[^[:space:]]+$')
);
