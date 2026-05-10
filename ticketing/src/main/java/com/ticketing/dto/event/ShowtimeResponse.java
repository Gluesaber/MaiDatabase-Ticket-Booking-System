package com.ticketing.dto.event;

import java.time.OffsetDateTime;
import java.util.List;

public record ShowtimeResponse(
        Long showtimeId,
        Long eventId,
        VenueSummaryDto venue,
        OffsetDateTime showSchedules,
        Integer ticketPerPerson,
        List<TicketTierResponse> tiers) {}
