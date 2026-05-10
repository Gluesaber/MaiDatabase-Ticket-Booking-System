package com.ticketing.dto.venue;

public record AddressDto(
        Long addressId,
        String addressLine,
        String street,
        String subDistrict,
        String district,
        String province,
        String postalCode
) {}
