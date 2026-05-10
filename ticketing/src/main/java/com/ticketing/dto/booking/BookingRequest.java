package com.ticketing.dto.booking;

import java.util.List;

public record BookingRequest(Long showtimeId, List<TicketRequestDto> tickets) {}
