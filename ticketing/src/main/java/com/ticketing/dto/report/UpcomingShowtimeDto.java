package com.ticketing.dto.report;

import java.time.OffsetDateTime;

public record UpcomingShowtimeDto(
        long showtimeId,
        String eventTitle,
        String venueName,
        OffsetDateTime showSchedules,
        long totalCapacity,
        long bookedTickets
) {}
