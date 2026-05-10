package com.ticketing.dto.venue;

import java.math.BigDecimal;
import java.util.List;

public record VenueSectionDto(Long tierId, String tierName, BigDecimal price, List<SeatDto> seats) {}
