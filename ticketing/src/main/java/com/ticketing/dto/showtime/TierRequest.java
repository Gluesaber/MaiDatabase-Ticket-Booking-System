package com.ticketing.dto.showtime;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TierRequest(
        @NotBlank String tierName,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        @NotNull @Min(1) Integer totalAmount
) {}
