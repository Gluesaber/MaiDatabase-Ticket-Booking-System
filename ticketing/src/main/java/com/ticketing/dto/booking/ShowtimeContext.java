package com.ticketing.dto.booking;

import com.ticketing.dto.event.VenueSummaryDto;

import java.time.OffsetDateTime;

public record ShowtimeContext(OffsetDateTime showSchedules, VenueSummaryDto venue, EventContext event) {}
