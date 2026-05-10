package com.ticketing.dto.report;

import java.math.BigDecimal;

public record TopEventPoint(String eventTitle, long ticketsSold, BigDecimal totalIncome) {}
