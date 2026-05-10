package com.ticketing.dto.booking;

import com.ticketing.dto.event.TagDto;

import java.util.List;

public record EventContext(Long eventId, String title, String thumbnail, List<TagDto> tags) {}
