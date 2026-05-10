package com.ticketing.dto.booking;

import java.math.BigDecimal;

public record TicketResponseDto(Long ticketId, String seatCode, String tierName, BigDecimal price, String status) {}
