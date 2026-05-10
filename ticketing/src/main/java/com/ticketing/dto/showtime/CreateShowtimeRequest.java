package com.ticketing.dto.showtime;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;

public record CreateShowtimeRequest(
        @NotNull Long eventId,
        @NotNull Long venueId,
        @NotNull OffsetDateTime showSchedules,
        @NotNull @Min(1) Integer ticketPerPerson,
        @NotEmpty @Valid List<TierRequest> tiers
) {}
