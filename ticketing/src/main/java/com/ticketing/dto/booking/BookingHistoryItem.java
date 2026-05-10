package com.ticketing.dto.booking;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record BookingHistoryItem(
        Long bookingId,
        String status,
        BigDecimal totalAmount,
        OffsetDateTime timestamp,
        OffsetDateTime expiresAt,
        ShowtimeContext showtime,
        List<TicketResponseDto> tickets) {}
