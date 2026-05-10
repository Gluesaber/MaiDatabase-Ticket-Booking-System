package com.ticketing.service;

import com.ticketing.dto.event.CreateEventRequest;
import com.ticketing.dto.event.EventResponse;
import com.ticketing.dto.event.UpdateEventRequest;
import com.ticketing.security.UserPrincipal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface EventService {
    List<EventResponse> getAllEvents();
    List<EventResponse> getMyEvents(Long userId);
    EventResponse getEventById(Long id);
    EventResponse createEvent(CreateEventRequest request, Long createdByUserId);
    EventResponse updateEvent(Long eventId, UpdateEventRequest request, UserPrincipal principal);
    void deleteEvent(Long eventId, UserPrincipal principal);
    List<EventResponse> searchEvents(List<Long> tagIds, BigDecimal minPrice, BigDecimal maxPrice, LocalDate startDate, LocalDate endDate);
}
