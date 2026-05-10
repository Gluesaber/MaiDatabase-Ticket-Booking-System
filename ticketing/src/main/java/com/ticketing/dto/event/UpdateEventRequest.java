package com.ticketing.dto.event;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;

public record UpdateEventRequest(
        @NotBlank String title,
        @NotNull @Min(1) Integer durationMinutes,
        @Pattern(regexp = "^(G|PG|PG-13|R|NC-17)$", message = "Rating must be one of: G, PG, PG-13, R, NC-17")
        String rating,
        String thumbnail,
        @NotEmpty List<Long> tagIds
) {}
