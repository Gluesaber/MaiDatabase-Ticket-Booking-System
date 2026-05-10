package com.ticketing.dto.report;

public record PeakSalesPoint(
        int hour,
        String label,
        long sun,
        long mon,
        long tue,
        long wed,
        long thu,
        long fri,
        long sat
) {}
