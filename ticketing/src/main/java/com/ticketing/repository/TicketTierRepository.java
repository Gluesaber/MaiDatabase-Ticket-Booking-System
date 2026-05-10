package com.ticketing.repository;

import com.ticketing.entity.TicketTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketTierRepository extends JpaRepository<TicketTier, Long> {
    List<TicketTier> findByShowtime_ShowtimeId(Long showtimeId);

    @Query("SELECT COALESCE(SUM(t.totalAmount), 0) FROM TicketTier t WHERE t.showtime.showtimeId = :showtimeId")
    int sumTotalAmountByShowtime(@Param("showtimeId") Long showtimeId);
}
