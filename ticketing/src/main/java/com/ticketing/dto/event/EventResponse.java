package com.ticketing.dto.event;

import java.util.List;

public record EventResponse(
        Long eventId,
        String title,
        Integer durationMinutes,
        String rating,
        String thumbnail,
        String description,
        List<TagDto> tags,
        List<ShowtimeResponse> showtimes) {}
