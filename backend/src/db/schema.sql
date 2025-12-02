-- Schema baseado no PRD e script fornecido

CREATE TABLE IF NOT EXISTS roles (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(50) NOT NULL UNIQUE,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE,
    description  TEXT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id               BIGSERIAL PRIMARY KEY,
    full_name        VARCHAR(150) NOT NULL,
    email            VARCHAR(150) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    position_id      BIGINT REFERENCES positions(id),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_position_id ON users(position_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active   ON users(is_active);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id   BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

CREATE TABLE IF NOT EXISTS cost_centers (
    id                BIGSERIAL PRIMARY KEY,
    code              VARCHAR(50) UNIQUE,
    name              VARCHAR(150) NOT NULL,
    description       TEXT,
    kind              VARCHAR(30) NOT NULL DEFAULT 'PROJECT',
    approver_user_id  BIGINT REFERENCES users(id),
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_centers_approver_user_id ON cost_centers(approver_user_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_is_active        ON cost_centers(is_active);

CREATE TABLE IF NOT EXISTS cost_center_users (
    cost_center_id  BIGINT NOT NULL REFERENCES cost_centers(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (cost_center_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cost_center_users_user_id        ON cost_center_users(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_center_users_cost_center_id ON cost_center_users(cost_center_id);

CREATE TABLE IF NOT EXISTS trips (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50) UNIQUE,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    cost_center_id  BIGINT NOT NULL REFERENCES cost_centers(id),
    destination     VARCHAR(200) NOT NULL,
    purpose         TEXT NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    CHECK (status IN ('DRAFT', 'IN_APPROVAL', 'APPROVED', 'REJECTED')),
    submitted_at    TIMESTAMPTZ,
    approved_at     TIMESTAMPTZ,
    rejected_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_user_id         ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_cost_center_id  ON trips(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_trips_status          ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_start_date      ON trips(start_date);

CREATE TABLE IF NOT EXISTS expense_categories (
    id                    BIGSERIAL PRIMARY KEY,
    name                  VARCHAR(100) NOT NULL UNIQUE,
    description           TEXT,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    requires_attachment   BOOLEAN NOT NULL DEFAULT FALSE,
    is_reimbursable       BOOLEAN NOT NULL DEFAULT TRUE,
    is_km_category        BOOLEAN NOT NULL DEFAULT FALSE,
    max_amount_per_expense NUMERIC(12,2),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_categories_is_active ON expense_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_expense_categories_is_km     ON expense_categories(is_km_category);

CREATE TABLE IF NOT EXISTS payment_methods (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE,
    description  TEXT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);

CREATE TABLE IF NOT EXISTS expenses (
    id                    BIGSERIAL PRIMARY KEY,
    trip_id               BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    cost_center_id        BIGINT     REFERENCES cost_centers(id),
    expense_category_id   BIGINT NOT NULL REFERENCES expense_categories(id),
    payment_method_id     BIGINT     REFERENCES payment_methods(id),
    spent_at              DATE NOT NULL,
    description           TEXT,
    amount_original       NUMERIC(12,2) NOT NULL,
    amount_effective      NUMERIC(12,2) NOT NULL,
    currency_code         CHAR(3) NOT NULL DEFAULT 'BRL',
    km_quantity           NUMERIC(10,2),
    km_rate_applied       NUMERIC(10,4),
    km_capped             BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_url        TEXT,
    attachment_mime_type  VARCHAR(100),
    created_by_user_id    BIGINT NOT NULL REFERENCES users(id),
    updated_by_user_id    BIGINT     REFERENCES users(id),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_trip_id            ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_cost_center_id     ON expenses(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id        ON expenses(expense_category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_method_id  ON expenses(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_expenses_spent_at           ON expenses(spent_at);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by_user_id ON expenses(created_by_user_id);

CREATE TABLE IF NOT EXISTS km_policies (
    id                    BIGSERIAL PRIMARY KEY,
    position_id           BIGINT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    rate_per_km           NUMERIC(10,4) NOT NULL,
    max_km_per_trip       NUMERIC(10,2),
    max_amount_per_trip   NUMERIC(12,2),
    exceed_behavior       VARCHAR(10) NOT NULL DEFAULT 'CAP',
    CHECK (exceed_behavior IN ('CAP', 'WARN')),
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_km_policies_position_id
    ON km_policies(position_id)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_km_policies_is_active ON km_policies(is_active);

CREATE TABLE IF NOT EXISTS trip_approvals (
    id                BIGSERIAL PRIMARY KEY,
    trip_id           BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    actor_user_id     BIGINT NOT NULL REFERENCES users(id),
    approver_user_id  BIGINT REFERENCES users(id),
    action_type       VARCHAR(20) NOT NULL,
    CHECK (action_type IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'REOPENED', 'DELEGATED')),
    comment           TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_approvals_trip_id       ON trip_approvals(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_approvals_action_type   ON trip_approvals(action_type);
CREATE INDEX IF NOT EXISTS idx_trip_approvals_approver_id   ON trip_approvals(approver_user_id);

CREATE TABLE IF NOT EXISTS approval_delegations (
    id                   BIGSERIAL PRIMARY KEY,
    from_approver_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_approver_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_at             TIMESTAMPTZ NOT NULL,
    end_at               TIMESTAMPTZ,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_approval_delegations_from_approver ON approval_delegations(from_approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_delegations_to_approver   ON approval_delegations(to_approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_delegations_active        ON approval_delegations(is_active);

CREATE TABLE IF NOT EXISTS audit_logs (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT REFERENCES users(id),
    entity_type      VARCHAR(50) NOT NULL,
    entity_id        BIGINT,
    action           VARCHAR(50) NOT NULL,
    previous_values  JSONB,
    new_values       JSONB,
    description      TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id      ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity       ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at   ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS notifications (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL,
    channel          VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
    CHECK (channel IN ('EMAIL', 'SMS', 'WHATSAPP', 'PUSH')),
    subject          VARCHAR(200),
    body             TEXT,
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status   ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type     ON notifications(notification_type);

CREATE TABLE IF NOT EXISTS system_settings (
    id               BIGSERIAL PRIMARY KEY,
    key              VARCHAR(100) NOT NULL UNIQUE,
    value            TEXT NOT NULL,
    description      TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_resets (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reset_token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at       TIMESTAMPTZ NOT NULL,
    used_at          TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user_id    ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);
