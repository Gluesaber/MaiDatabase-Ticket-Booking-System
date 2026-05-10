package com.ticketing.repository;

import com.ticketing.entity.Ticket;
import com.ticketing.entity.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByBooking_BookingId(Long bookingId);
    List<Ticket> findByTier_Showtime_ShowtimeIdAndStatusNot(Long showtimeId, TicketStatus excludedStatus);
    int countByTier_TierIdAndStatusNot(Long tierId, TicketStatus excludedStatus);
    boolean existsBySeatCodeAndTier_Showtime_ShowtimeIdAndStatusNot(String seatCode, Long showtimeId, TicketStatus excludedStatus);
}
