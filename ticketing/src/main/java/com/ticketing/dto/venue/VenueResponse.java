package com.ticketing.dto.venue;

public record VenueResponse(
        Long venueId,
        String name,
        Integer capacity,
        AddressDto address
) {}
