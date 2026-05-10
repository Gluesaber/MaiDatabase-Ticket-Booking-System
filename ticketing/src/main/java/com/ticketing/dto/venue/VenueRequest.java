package com.ticketing.dto.venue;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VenueRequest(
        @NotBlank String name,
        @NotNull @Min(1) Integer capacity,
        String addressLine,
        String street,
        String subDistrict,
        String district,
        String province,
        String postalCode
) {}
