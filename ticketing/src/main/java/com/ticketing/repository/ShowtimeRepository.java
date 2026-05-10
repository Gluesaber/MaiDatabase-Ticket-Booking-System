package com.ticketing.repository;

import com.ticketing.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {
    List<Showtime> findByEvent_EventId(Long eventId);

    @Query(value = """
            SELECT COUNT(*) FROM showtimes s
            JOIN events e ON e.event_id = s.event_id
            WHERE s.venue_id   = :venueId
              AND s.showtime_id <> :excludeId
              AND s.show_schedules < :endTime
              AND (s.show_schedules + (e.duration_minutes * INTERVAL '1 minute')) > :startTime
            """, nativeQuery = true)
    int countConflictingShowtimes(
            @Param("venueId")    Long venueId,
            @Param("startTime")  OffsetDateTime startTime,
            @Param("endTime")    OffsetDateTime endTime,
            @Param("excludeId")  Long excludeId
    );
}
