-- Accounts. The administrator's row is created and kept in sync from the ADMIN_USERNAME
-- and ADMIN_PASSWORD environment variables at startup; everyone else registers as USER.
CREATE TABLE users (
    id            BIGINT      GENERATED ALWAYS AS IDENTITY,
    username      VARCHAR(32) NOT NULL,
    -- Never the password itself: a salted one-way hash, prefixed with its algorithm ("{bcrypt}...").
    password_hash TEXT        NOT NULL,
    role          VARCHAR(16) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL,

    CONSTRAINT users_pkey            PRIMARY KEY (id),
    CONSTRAINT users_username_format CHECK (username ~ '^[A-Za-z0-9_.-]{3,32}$'),
    CONSTRAINT users_role_valid      CHECK (role IN ('ADMIN', 'USER'))
);

-- Usernames are unique whatever their case: "Liam" and "liam" are the same account.
CREATE UNIQUE INDEX users_username_lower_key ON users (lower(username));
