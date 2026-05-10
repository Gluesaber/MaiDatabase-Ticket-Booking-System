-- ============================================================
-- 1. Event descriptions
-- ============================================================
UPDATE events SET description =
  'Follow Tanjiro and the Demon Slayer Corps as they board the mysterious Mugen Train to investigate a series of disappearances. With the Flame Hashira Kyojuro Rengoku by their side, they must face off against a powerful demon manipulating the passengers'' dreams.'
WHERE event_id = 12;

UPDATE events SET description =
  'Gotham City faces its greatest threat yet as the chaotic criminal mastermind known as the Joker unleashes a wave of terror. Batman must push himself to his physical and psychological limits to save the city and its soul from descending into absolute madness.'
WHERE event_id = 13;

UPDATE events SET description =
  'Young Chihiro stumbles into a magical, hidden world ruled by spirits, gods, and a formidable witch. To save her parents and find her way back home, she must navigate this breathtakingly strange bathhouse and discover her inner courage.'
WHERE event_id = 14;

UPDATE events SET description =
  'A retired legendary hitman is forced back into the criminal underworld after the tragic loss of his beloved dog. Armed with unmatched lethal skills and a thirst for vengeance, he leaves a trail of destruction through the neon-lit streets of the assassin syndicate.'
WHERE event_id = 15;

UPDATE events SET description =
  'Step into the secret life of toys in this heartwarming adventure where Woody, a traditional pull-string cowboy, meets Buzz Lightyear, a deluded space ranger. Together, they must overcome their differences and survive the outside world to reunite with their owner, Andy.'
WHERE event_id = 16;

UPDATE events SET description =
  'Get ready for an intense, high-octane adult concert experience featuring the raw and heavy sounds of Korn. This uncompromising live show delivers a visceral blend of nu-metal classics and electrifying performances meant for mature audiences only.'
WHERE event_id = 17;

UPDATE events SET description =
  'Dive into an exclusive, unfiltered night of live music with Tonnam, designed strictly for mature fans. Expect a bold, boundary-pushing performance filled with provocative themes and unforgettable stage energy.'
WHERE event_id = 18;

-- ============================================================
-- 2. Seed 200 bookings spread across past 90 days
--    Tiers: 51-53 (Demon Slayer s22), 54-56 (Dark Knight s23),
--           57-58 (Spirited Away s24), 59-60 (John Wick s25),
--           61-63 (Toy Story s26)
--    Seat codes unique per showtime: SD### / DK### / SA### / JW### / TS###
--    Status: ~85% CONFIRMED, ~10% CANCELLED, ~5% EXPIRED
--    Timestamps weighted towards evening hours (18-22)
-- ============================================================
DO $$
DECLARE
  v_booking_id      bigint;
  v_status          booking_status;
  v_ticket_status   ticket_status;
  v_rand            float;
  v_secs            int;
  v_day_offset      int;
  v_ts              timestamptz;
  v_seat_code       text;
  v_rw              int;
  v_cum             int;
  v_sh_idx          int;

  -- Tier data (13 tiers across 5 showtimes)
  v_showtime_ids  int[]     := ARRAY[22,22,22,23,23,23,24,24,25,25,26,26,26];
  v_tier_ids      int[]     := ARRAY[51,52,53,54,55,56,57,58,59,60,61,62,63];
  v_prices        numeric[] := ARRAY[1500,800,500,2000,1000,600,1200,600,1800,900,800,400,200];
  -- Weights: VIP=1, Standard=3-4, Economy=4-5 (more realistic distribution)
  v_weights       int[]     := ARRAY[1,3,4,1,4,5,1,3,1,3,1,4,5];
  v_total_weight  int       := 36;

  -- Seat counters per showtime [idx 1=s22, 2=s23, 3=s24, 4=s25, 5=s26]
  -- Start s22 at 10 to avoid any collision with existing VIP-xx seat codes
  v_sc            int[]     := ARRAY[10,1,1,1,1];
  v_sc_prefixes   text[]    := ARRAY['SD','DK','SA','JW','TS'];

  v_users         int[]              := ARRAY[4,5,6,7,8,9,10,11,12,13];
  v_methods       payment_method_type[] :=
    ARRAY['CREDIT_CARD','DEBIT_CARD','QR_CODE','BANK_TRANSFER','WALLET']::payment_method_type[];

  v_tier_idx  int;
  v_user_id   int;
  v_method    payment_method_type;
  v_price     numeric;
  v_tier_id   int;
  v_showtime_id int;
BEGIN
  FOR i IN 1..200 LOOP
    -- Weighted tier selection
    v_rw  := 1 + (random() * (v_total_weight - 1))::int;
    v_cum := 0;
    v_tier_idx := 1;
    FOR j IN 1..13 LOOP
      v_cum := v_cum + v_weights[j];
      IF v_rw <= v_cum THEN v_tier_idx := j; EXIT; END IF;
    END LOOP;

    v_tier_id     := v_tier_ids[v_tier_idx];
    v_price       := v_prices[v_tier_idx];
    v_showtime_id := v_showtime_ids[v_tier_idx];

    -- Map showtime → counter index (22→1, 23→2, 24→3, 25→4, 26→5)
    v_sh_idx    := v_showtime_id - 21;
    v_seat_code := v_sc_prefixes[v_sh_idx] || LPAD(v_sc[v_sh_idx]::text, 3, '0');
    v_sc[v_sh_idx] := v_sc[v_sh_idx] + 1;

    -- Random customer
    v_user_id := v_users[1 + (random() * 9.99)::int];

    -- Timestamp: past 90 days, weighted towards evening
    v_day_offset := (random() * 89)::int;
    v_rand := random();
    IF    v_rand < 0.50 THEN v_secs := 64800 + (random() * 14400)::int;  -- 18:00-22:00
    ELSIF v_rand < 0.75 THEN v_secs := 43200 + (random() * 21600)::int;  -- 12:00-18:00
    ELSE                     v_secs := 28800 + (random() * 14400)::int;  -- 08:00-12:00
    END IF;
    v_ts := (CURRENT_DATE - v_day_offset)::timestamp
            + (v_secs || ' seconds')::interval;

    -- Booking status
    v_rand := random();
    IF    v_rand < 0.85 THEN v_status := 'CONFIRMED'; v_ticket_status := 'CONFIRMED';
    ELSIF v_rand < 0.95 THEN v_status := 'CANCELLED'; v_ticket_status := 'CANCELLED';
    ELSE                     v_status := 'EXPIRED';   v_ticket_status := 'CANCELLED';
    END IF;

    v_method := v_methods[1 + (random() * 4.99)::int];

    -- Insert booking
    INSERT INTO bookings (user_id, timestamp, expires_at, status)
    VALUES (v_user_id, v_ts, v_ts + interval '15 minutes', v_status)
    RETURNING booking_id INTO v_booking_id;

    -- Insert ticket
    INSERT INTO tickets (tier_id, booking_id, seat_code, status, price)
    VALUES (v_tier_id, v_booking_id, v_seat_code, v_ticket_status, v_price);

    -- Payment only for CONFIRMED
    IF v_status = 'CONFIRMED' THEN
      INSERT INTO payments (booking_id, payment_method, amount, status, timestamp)
      VALUES (v_booking_id, v_method, v_price, 'COMPLETED', v_ts + interval '3 minutes');
    END IF;

  END LOOP;
END;
$$;

-- Verify results
SELECT
  (SELECT COUNT(*) FROM bookings)                                 AS total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'CONFIRMED')      AS confirmed,
  (SELECT COUNT(*) FROM bookings WHERE status = 'CANCELLED')      AS cancelled,
  (SELECT COUNT(*) FROM bookings WHERE status = 'EXPIRED')        AS expired,
  (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='COMPLETED') AS total_revenue,
  (SELECT COUNT(*) FROM events WHERE description IS NOT NULL)     AS events_with_desc;
