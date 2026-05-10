package com.ticketing.dto.report;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record RecentBookingDto(
        long bookingId,
        String customerName,
        String eventTitle,
        String status,
        BigDecimal totalAmount,
        OffsetDateTime bookedAt
) {}
