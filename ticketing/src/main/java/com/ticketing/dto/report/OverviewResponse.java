package com.ticketing.dto.report;

import java.math.BigDecimal;
import java.util.List;

public record OverviewResponse(
        BigDecimal totalRevenue,
        long ticketsSoldThisMonth,
        long activeBookings,
        long totalUsers,
        List<RecentBookingDto> recentBookings,
        List<UpcomingShowtimeDto> upcomingShowtimes
) {}
