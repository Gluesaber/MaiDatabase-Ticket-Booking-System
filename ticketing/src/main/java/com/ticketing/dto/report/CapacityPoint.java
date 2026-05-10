package com.ticketing.dto.report;

import java.time.OffsetDateTime;

public record CapacityPoint(
        String eventTitle,
        String venueName,
        OffsetDateTime showSchedules,
        long totalCapacity,
        long bookedTickets,
        double fillRate) {}
