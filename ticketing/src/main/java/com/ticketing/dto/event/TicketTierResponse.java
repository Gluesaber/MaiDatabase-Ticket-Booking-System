package com.ticketing.dto.event;

import java.math.BigDecimal;

public record TicketTierResponse(Long tierId, String tierName, BigDecimal price, int totalAmount, int availableAmount) {}
