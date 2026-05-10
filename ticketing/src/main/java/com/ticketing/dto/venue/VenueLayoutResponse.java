package com.ticketing.dto.venue;

import java.util.List;

public record VenueLayoutResponse(Long venueId, String name, Integer capacity, List<VenueSectionDto> sections) {}
