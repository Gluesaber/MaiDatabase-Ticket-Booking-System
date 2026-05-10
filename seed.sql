-- ============================================================
--  SEED DATA — Ticketing Platform
-- ============================================================

BEGIN;

-- Roles
INSERT INTO Roles (role_id, role_name) VALUES
    (1, 'admin'), (2, 'organizer'), (3, 'customer');

-- Users  (password for all: password)
INSERT INTO Users (user_id, role_id, email, first_name, last_name, password_hash) VALUES
    (1,  1, 'admin@nugget.com',    'Napat',    'Srisuk',   '$2a$10$vyPJKERabKaWtapflFboTuG2sjMlfjBrn3Wqybb8o0gC7smSH/Ur6'),
    (2,  2, 'wiroj@nugget.com',    'Wiroj',    'Tanaka',   '$2a$10$vyPJKERabKaWtapflFboTuG2sjMlfjBrn3Wqybb8o0gC7smSH/Ur6'),
    (3,  2, 'siriporn@nugget.com', 'Siriporn', 'Chaiyong', '$2a$10$vyPJKERabKaWtapflFboTuG2sjMlfjBrn3Wqybb8o0gC7smSH/Ur6'),
    (4,  3, 'alice@example.com',   'Alice',    'Johnson',  '$2a$10$vyPJKERabKaWtapflFboTuG2sjMlfjBrn3Wqybb8o0gC7smSH/Ur6'),
    (5,  3, 'bob@example.com',     'Bob',      'Smith',    '$2a$10$vyPJKERabKaWtapflFboTuG2sjMlfjBrn3Wqybb8o0gC7smSH/Ur6'),
    (6,  3, 'charlie@example.com', 'Charlie',  'Brown',    '$2a$10$vyPJKERabKaWtapflFboTuG2sjMlfjBrn3Wqybb8o0gC7smSH/Ur6'),
    (7,  3, 'diana@example.com',   'Diana',    'Prince',   '$2a$10$vyPJKERabKaWtapflFboTuG2sjMlfjBrn3Wqybb8o0gC7smSH/Ur6'),
    (8,  3, 'edward@example.com',  'Edward',   'Norton',   '$2a$10$vyPJKERabKaWtapflFboTuG2sjMlfjBrn3Wqybb8o0gC7smSH/Ur6'),
    (9,  3, 'fiona@example.com',   'Fiona',    'Green',    '$2a$10$vyPJKERabKaWtapflFboTuG2sjMlfjBrn3Wqybb8o0gC7smSH/Ur6'),
    (10, 3, 'george@example.com',  'George',   'Miller',   '$2a$10$vyPJKERabKaWtapflFboTuG2sjMlfjBrn3Wqybb8o0gC7smSH/Ur6'),
    (11, 3, 'helen@example.com',   'Helen',    'Troy',     '$2a$10$vyPJKERabKaWtapflFboTuG2sjMlfjBrn3Wqybb8o0gC7smSH/Ur6'),
    (12, 3, 'ivan@example.com',    'Ivan',     'Petrov',   '$2a$10$vyPJKERabKaWtapflFboTuG2sjMlfjBrn3Wqybb8o0gC7smSH/Ur6');

-- Addresses
INSERT INTO Addresses (address_id, address_line, street, sub_district, district, province, postal_code) VALUES
    (1, '1',  'Ratchadaphisek Rd', 'Huai Khwang', 'Huai Khwang', 'Bangkok', '10310'),
    (2, '88', 'Vibhavadi Rangsit', 'Chatuchak',   'Chatuchak',   'Bangkok', '10900'),
    (3, '3',  'Sukhumvit Soi 1',   'Khlong Toei', 'Khlong Toei', 'Bangkok', '10110'),
    (4, '56', 'Rama IX Rd',        'Huai Khwang', 'Huai Khwang', 'Bangkok', '10320'),
    (5, '21', 'Silom Rd',          'Silom',       'Bang Rak',    'Bangkok', '10500');

-- Venues
INSERT INTO Venues (venue_id, name, address_id, capacity) VALUES
    (1, 'Grand Theater',   1,  500),
    (2, 'City Arena',      2, 2000),
    (3, 'Jazz Club Silom', 3,  150),
    (4, 'Convention Hall', 4,  800);

-- EventTypes (tags)
INSERT INTO EventTypes (type_id, type_name) VALUES
    (1,  'Comedy'),
    (2,  'Concert'),
    (3,  'Conference'),
    (4,  'Exhibition'),
    (5,  'Musical'),
    (6,  'Other'),
    (7,  'Sport'),
    (8,  'Movie'),
    (9,  'Drama'),
    (10, 'Horror'),
    (11, 'Mystery'),
    (12, 'Thriller'),
    (13, 'Supernatural'),
    (14, 'Fantasy'),
    (15, 'Anime'),
    (16, 'Animation'),
    (17, 'Action'),
    (18, 'Romance'),
    (19, 'Documentary'),
    (20, 'Psychological'),
    (21, 'Sci-Fi'),
    (22, 'Adventure'),
    (23, 'Period');

-- Events (age-rated)
INSERT INTO Events (event_id, title, duration_minutes, rating, thumbnail, created_by) VALUES
    (1, 'Demon Slayer: Mugen Train', 117, 'PG-13', NULL, 2),
    (2, 'The Dark Knight',           152, 'PG-13', NULL, 2),
    (3, 'Spirited Away',             125, 'PG',    NULL, 3),
    (4, 'John Wick',                 101, 'R',     NULL, 2),
    (5, 'Toy Story',                  81, 'G',     NULL, 3);

-- EventTypeMappings
INSERT INTO EventTypeMappings (event_id, type_id) VALUES
    (1, 8),  (1, 15), (1, 17),  -- Demon Slayer → Movie, Anime, Action
    (2, 8),  (2, 12), (2, 17),  -- The Dark Knight → Movie, Thriller, Action
    (3, 8),  (3, 14), (3, 16),  -- Spirited Away → Movie, Fantasy, Animation
    (4, 8),  (4, 17),            -- John Wick → Movie, Action
    (5, 8),  (5, 16), (5, 22);  -- Toy Story → Movie, Animation, Adventure

-- Showtimes
INSERT INTO Showtimes (showtime_id, event_id, venue_id, show_schedules, ticket_per_person) VALUES
    (1, 1, 1, '2026-06-15 19:00:00+07', 4),
    (2, 2, 2, '2026-06-20 18:00:00+07', 4),
    (3, 3, 1, '2026-06-22 14:00:00+07', 2),
    (4, 4, 3, '2026-07-01 20:00:00+07', 4),
    (5, 5, 4, '2026-07-10 11:00:00+07', 6);

-- TicketTiers (totals kept within venue capacity)
INSERT INTO TicketTiers (tier_id, showtime_id, tier_name, price, total_amount) VALUES
    (1,  1, 'VIP',      1500.00,  50),  -- Grand Theater 500 cap: 50+200+250=500
    (2,  1, 'Standard',  800.00, 200),
    (3,  1, 'Economy',   500.00, 250),
    (4,  2, 'VIP',      2000.00, 100),  -- City Arena 2000 cap: 100+500+1000=1600
    (5,  2, 'Standard', 1000.00, 500),
    (6,  2, 'Economy',   600.00, 1000),
    (7,  3, 'VIP',      1200.00,  50),  -- Grand Theater: 50+200=250
    (8,  3, 'Standard',  600.00, 200),
    (9,  4, 'VIP',      1800.00,  30),  -- Jazz Club 150 cap: 30+120=150
    (10, 4, 'Standard',  900.00, 120),
    (11, 5, 'VIP',       800.00,  50),  -- Convention Hall 800 cap: 50+400+350=800
    (12, 5, 'Standard',  400.00, 400),
    (13, 5, 'Economy',   200.00, 350);

-- Reset sequences
SELECT setval('roles_role_id_seq',         (SELECT MAX(role_id)     FROM Roles));
SELECT setval('users_user_id_seq',         (SELECT MAX(user_id)     FROM Users));
SELECT setval('addresses_address_id_seq',  (SELECT MAX(address_id)  FROM Addresses));
SELECT setval('venues_venue_id_seq',       (SELECT MAX(venue_id)    FROM Venues));
SELECT setval('eventtypes_type_id_seq',    (SELECT MAX(type_id)     FROM EventTypes));
SELECT setval('events_event_id_seq',       (SELECT MAX(event_id)    FROM Events));
SELECT setval('showtimes_showtime_id_seq', (SELECT MAX(showtime_id) FROM Showtimes));
SELECT setval('tickettiers_tier_id_seq',   (SELECT MAX(tier_id)     FROM TicketTiers));

COMMIT;
