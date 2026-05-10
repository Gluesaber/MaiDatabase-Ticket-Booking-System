-- Seed 200 bookings (descriptions already applied)
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

  v_showtime_ids  int[]     := ARRAY[22,22,22,23,23,23,24,24,25,25,26,26,26];
  v_tier_ids      int[]     := ARRAY[51,52,53,54,55,56,57,58,59,60,61,62,63];
  v_prices        numeric[] := ARRAY[1500,800,500,2000,1000,600,1200,600,1800,900,800,400,200];
  v_weights       int[]     := ARRAY[1,3,4,1,4,5,1,3,1,3,1,4,5];
  v_total_weight  int       := 36;

  -- seat counters: index 1=showtime22, 2=23, 3=24, 4=25, 5=26
  -- start s22 at 10 to avoid collision with existing VIP-xx codes
  v_sc            int[]  := ARRAY[10,1,1,1,1];
  v_sc_prefixes   text[] := ARRAY['SD','DK','SA','JW','TS'];

  v_users   int[]               := ARRAY[4,5,6,7,8,9,10,11,12,13];
  v_methods payment_method_type[] :=
    ARRAY['CREDIT_CARD','DEBIT_CARD','QR_CODE','BANK_TRANSFER','WALLET']::payment_method_type[];

  v_tier_idx    int;
  v_user_id     int;
  v_method      payment_method_type;
  v_price       numeric;
  v_tier_id     int;
  v_showtime_id int;
  v_ui          int;
  v_mi          int;
BEGIN
  FOR i IN 1..200 LOOP
    -- Weighted tier selection
    v_rw  := 1 + (floor(random() * v_total_weight)::int % v_total_weight);
    v_cum := 0;
    v_tier_idx := 1;
    FOR j IN 1..13 LOOP
      v_cum := v_cum + v_weights[j];
      IF v_rw <= v_cum THEN v_tier_idx := j; EXIT; END IF;
    END LOOP;

    v_tier_id     := v_tier_ids[v_tier_idx];
    v_price       := v_prices[v_tier_idx];
    v_showtime_id := v_showtime_ids[v_tier_idx];

    -- showtime → counter index (22→1, 23→2, …, 26→5)
    v_sh_idx    := v_showtime_id - 21;
    v_seat_code := v_sc_prefixes[v_sh_idx] || LPAD(v_sc[v_sh_idx]::text, 3, '0');
    v_sc[v_sh_idx] := v_sc[v_sh_idx] + 1;

    -- Safe random user (index clamped by modulo)
    v_ui      := 1 + (floor(random() * 10)::int % 10);
    v_user_id := v_users[v_ui];

    -- Timestamp: past 90 days, evening-weighted
    v_day_offset := floor(random() * 90)::int;
    v_rand := random();
    IF    v_rand < 0.50 THEN v_secs := 64800 + floor(random() * 14400)::int;
    ELSIF v_rand < 0.75 THEN v_secs := 43200 + floor(random() * 21600)::int;
    ELSE                     v_secs := 28800 + floor(random() * 14400)::int;
    END IF;
    v_ts := (CURRENT_DATE - v_day_offset)::timestamp
            + (v_secs || ' seconds')::interval;

    -- Booking status
    v_rand := random();
    IF    v_rand < 0.85 THEN v_status := 'CONFIRMED'; v_ticket_status := 'CONFIRMED';
    ELSIF v_rand < 0.95 THEN v_status := 'CANCELLED'; v_ticket_status := 'CANCELLED';
    ELSE                     v_status := 'EXPIRED';   v_ticket_status := 'CANCELLED';
    END IF;

    -- Safe random payment method
    v_mi     := 1 + (floor(random() * 5)::int % 5);
    v_method := v_methods[v_mi];

    INSERT INTO bookings (user_id, timestamp, expires_at, status)
    VALUES (v_user_id, v_ts, v_ts + interval '15 minutes', v_status)
    RETURNING booking_id INTO v_booking_id;

    INSERT INTO tickets (tier_id, booking_id, seat_code, status, price)
    VALUES (v_tier_id, v_booking_id, v_seat_code, v_ticket_status, v_price);

    IF v_status = 'CONFIRMED' THEN
      INSERT INTO payments (booking_id, payment_method, amount, status, timestamp)
      VALUES (v_booking_id, v_method, v_price, 'COMPLETED', v_ts + interval '3 minutes');
    END IF;

  END LOOP;
END;
$$;

-- Summary
SELECT
  (SELECT COUNT(*) FROM bookings)                                       AS total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'CONFIRMED')            AS confirmed,
  (SELECT COUNT(*) FROM bookings WHERE status = 'CANCELLED')            AS cancelled,
  (SELECT COUNT(*) FROM bookings WHERE status = 'EXPIRED')              AS expired,
  (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='COMPLETED') AS total_revenue;
