package com.ticketing.repository;

import com.ticketing.entity.Booking;
import com.ticketing.entity.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUser_UserIdOrderByTimestampDesc(Long userId);
    List<Booking> findAllByStatusAndExpiresAtBefore(BookingStatus status, OffsetDateTime cutoff);

    @Query("SELECT DISTINCT b FROM Booking b JOIN b.tickets t WHERE t.tier.showtime.showtimeId = :showtimeId AND b.status NOT IN :excludedStatuses")
    List<Booking> findActiveByShowtimeId(@Param("showtimeId") Long showtimeId,
                                         @Param("excludedStatuses") Collection<BookingStatus> excludedStatuses);
}
