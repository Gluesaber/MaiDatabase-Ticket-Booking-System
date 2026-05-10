package com.ticketing.dto.report;

import java.math.BigDecimal;

public record TopRegionPoint(String province, long ticketsSold, BigDecimal totalIncome) {}
