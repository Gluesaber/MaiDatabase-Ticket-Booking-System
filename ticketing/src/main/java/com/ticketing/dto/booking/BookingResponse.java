package com.ticketing.dto.booking;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record BookingResponse(
        Long bookingId,
        String status,
        OffsetDateTime expiresAt,
        BigDecimal totalAmount,
        List<TicketResponseDto> tickets) {}
