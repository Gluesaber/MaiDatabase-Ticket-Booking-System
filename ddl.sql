-- ============================================================
--  TICKETING PLATFORM — PostgreSQL DDL
-- ============================================================

-- ENUMS
CREATE TYPE booking_status      AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED');
CREATE TYPE ticket_status       AS ENUM ('RESERVED', 'CONFIRMED', 'CANCELLED');
CREATE TYPE payment_status      AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE payment_method_type AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'QR_CODE', 'WALLET');

-- TABLES

CREATE TABLE Roles (
    role_id   BIGSERIAL   PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Users (
    user_id       BIGSERIAL    PRIMARY KEY,
    role_id       BIGINT       NOT NULL REFERENCES Roles(role_id)  ON DELETE RESTRICT,
    email         VARCHAR(255) NOT NULL UNIQUE,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE Addresses (
    address_id   BIGSERIAL    PRIMARY KEY,
    address_line VARCHAR(255),
    street       VARCHAR(255),
    sub_district VARCHAR(100),
    district     VARCHAR(100),
    province     VARCHAR(100),
    postal_code  VARCHAR(10)
);

CREATE TABLE Venues (
    venue_id   BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    address_id BIGINT       NOT NULL REFERENCES Addresses(address_id) ON DELETE RESTRICT,
    capacity   INT          NOT NULL CHECK (capacity > 0)
);

CREATE TABLE Events (
    event_id         BIGSERIAL     PRIMARY KEY,
    title            VARCHAR(255)  NOT NULL,
    duration_minutes INT           NOT NULL CHECK (duration_minutes > 0),
    rating           VARCHAR(5)    CHECK (rating IN ('G','PG','PG-13','R','NC-17')),
    thumbnail        TEXT,
    description      TEXT,
    created_by       BIGINT        NOT NULL REFERENCES Users(user_id) ON DELETE RESTRICT
);

CREATE TABLE EventTypes (
    type_id   BIGSERIAL    PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE EventTypeMappings (
    event_id BIGINT NOT NULL REFERENCES Events(event_id)    ON DELETE CASCADE,
    type_id  BIGINT NOT NULL REFERENCES EventTypes(type_id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, type_id)
);

CREATE TABLE Showtimes (
    showtime_id       BIGSERIAL   PRIMARY KEY,
    event_id          BIGINT      NOT NULL REFERENCES Events(event_id)  ON DELETE RESTRICT,
    venue_id          BIGINT      NOT NULL REFERENCES Venues(venue_id)  ON DELETE RESTRICT,
    show_schedules    TIMESTAMPTZ NOT NULL,
    ticket_per_person INT         NOT NULL DEFAULT 1 CHECK (ticket_per_person > 0)
);

CREATE TABLE TicketTiers (
    tier_id      BIGSERIAL      PRIMARY KEY,
    showtime_id  BIGINT         NOT NULL REFERENCES Showtimes(showtime_id) ON DELETE CASCADE,
    tier_name    VARCHAR(100)   NOT NULL,
    price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    total_amount INT            NOT NULL CHECK (total_amount > 0),
    UNIQUE (showtime_id, tier_name)
);

CREATE TABLE Bookings (
    booking_id BIGSERIAL      PRIMARY KEY,
    user_id    BIGINT         NOT NULL REFERENCES Users(user_id) ON DELETE RESTRICT,
    timestamp  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ    NOT NULL,
    status     booking_status NOT NULL DEFAULT 'PENDING',
    CONSTRAINT chk_expires_after_created CHECK (expires_at > timestamp)
);

CREATE TABLE Tickets (
    ticket_id  BIGSERIAL      PRIMARY KEY,
    tier_id    BIGINT         NOT NULL REFERENCES TicketTiers(tier_id) ON DELETE RESTRICT,
    booking_id BIGINT         NOT NULL REFERENCES Bookings(booking_id) ON DELETE CASCADE,
    seat_code  VARCHAR(20)    NOT NULL,
    status     ticket_status  NOT NULL DEFAULT 'RESERVED',
    price      NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE Payments (
    payment_id     BIGSERIAL           PRIMARY KEY,
    booking_id     BIGINT              NOT NULL REFERENCES Bookings(booking_id) ON DELETE CASCADE,
    payment_method payment_method_type NOT NULL,
    amount         NUMERIC(10, 2)      NOT NULL CHECK (amount > 0),
    status         payment_status      NOT NULL DEFAULT 'PENDING',
    timestamp      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_users_role       ON Users(role_id);
CREATE INDEX idx_etm_event        ON EventTypeMappings(event_id);
CREATE INDEX idx_etm_type         ON EventTypeMappings(type_id);
CREATE INDEX idx_showtimes_event  ON Showtimes(event_id);
CREATE INDEX idx_showtimes_venue  ON Showtimes(venue_id);
CREATE INDEX idx_tickettiers_show ON TicketTiers(showtime_id);
CREATE INDEX idx_bookings_user    ON Bookings(user_id);
CREATE INDEX idx_bookings_status  ON Bookings(status);
CREATE INDEX idx_tickets_booking  ON Tickets(booking_id);
CREATE INDEX idx_tickets_tier     ON Tickets(tier_id);
CREATE INDEX idx_payments_booking ON Payments(booking_id);

-- ============================================================
--  BUSINESS RULE 0: No venue double-booking (overlapping showtimes)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_venue_availability()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_duration_minutes INT;
    v_conflicts        INT;
BEGIN
    SELECT duration_minutes INTO v_duration_minutes
      FROM Events WHERE event_id = NEW.event_id;

    SELECT COUNT(*) INTO v_conflicts
      FROM Showtimes s
      JOIN Events e ON e.event_id = s.event_id
     WHERE s.venue_id     = NEW.venue_id
       AND s.showtime_id  <> NEW.showtime_id
       AND s.show_schedules < (NEW.show_schedules + v_duration_minutes * INTERVAL '1 minute')
       AND (s.show_schedules + e.duration_minutes * INTERVAL '1 minute') > NEW.show_schedules;

    IF v_conflicts > 0 THEN
        RAISE EXCEPTION 'Venue % is already booked during that time window.', NEW.venue_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_venue_availability
BEFORE INSERT OR UPDATE ON Showtimes
FOR EACH ROW EXECUTE FUNCTION fn_check_venue_availability();

-- ============================================================
--  BUSINESS RULE 1: Tier allocation <= venue capacity
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_tier_capacity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_capacity      INT;
    v_already_alloc INT;
BEGIN
    SELECT v.capacity INTO v_capacity
      FROM Venues v
      JOIN Showtimes s ON s.venue_id = v.venue_id
     WHERE s.showtime_id = NEW.showtime_id;

    SELECT COALESCE(SUM(total_amount), 0) INTO v_already_alloc
      FROM TicketTiers
     WHERE showtime_id = NEW.showtime_id
       AND (TG_OP = 'INSERT' OR tier_id <> NEW.tier_id);

    IF (v_already_alloc + NEW.total_amount) > v_capacity THEN
        RAISE EXCEPTION 'Tier allocation (%) would exceed venue capacity (%) for showtime %',
            v_already_alloc + NEW.total_amount, v_capacity, NEW.showtime_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_tier_capacity
BEFORE INSERT OR UPDATE ON TicketTiers
FOR EACH ROW EXECUTE FUNCTION fn_check_tier_capacity();

-- ============================================================
--  BUSINESS RULE 2: Seat codes unique per showtime
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_seat_uniqueness()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_showtime_id BIGINT;
    v_conflicts   INT;
BEGIN
    SELECT showtime_id INTO v_showtime_id
      FROM TicketTiers WHERE tier_id = NEW.tier_id;

    SELECT COUNT(*) INTO v_conflicts
      FROM Tickets tk
      JOIN TicketTiers tt ON tt.tier_id = tk.tier_id
     WHERE tt.showtime_id = v_showtime_id
       AND tk.seat_code   = NEW.seat_code
       AND tk.status      <> 'CANCELLED'
       AND (TG_OP = 'INSERT' OR tk.ticket_id <> NEW.ticket_id);

    IF v_conflicts > 0 THEN
        RAISE EXCEPTION 'Seat code "%" is already taken for showtime %',
            NEW.seat_code, v_showtime_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_seat_uniqueness
BEFORE INSERT OR UPDATE ON Tickets
FOR EACH ROW EXECUTE FUNCTION fn_check_seat_uniqueness();

-- ============================================================
--  BUSINESS RULE 3: Payment amount = sum of ticket prices
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_payment_amount()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_ticket_total NUMERIC(10, 2);
BEGIN
    SELECT COALESCE(SUM(price), 0) INTO v_ticket_total
      FROM Tickets
     WHERE booking_id = NEW.booking_id
       AND status     <> 'CANCELLED';

    IF NEW.amount <> v_ticket_total THEN
        RAISE EXCEPTION 'Payment amount (%) must equal total ticket price (%) for booking %',
            NEW.amount, v_ticket_total, NEW.booking_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_payment_amount
BEFORE INSERT OR UPDATE ON Payments
FOR EACH ROW EXECUTE FUNCTION fn_check_payment_amount();
