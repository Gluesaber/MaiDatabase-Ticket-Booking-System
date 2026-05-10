package com.ticketing.service.impl;

import com.ticketing.dto.event.*;
import com.ticketing.dto.event.UpdateEventRequest;
import com.ticketing.entity.*;
import com.ticketing.entity.enums.BookingStatus;
import com.ticketing.entity.enums.TicketStatus;
import com.ticketing.exception.BookingValidationException;
import com.ticketing.exception.ResourceNotFoundException;
import com.ticketing.exception.UnauthorizedAccessException;
import com.ticketing.repository.BookingRepository;
import com.ticketing.repository.EventRepository;
import com.ticketing.repository.EventTypeRepository;
import com.ticketing.repository.TicketRepository;
import com.ticketing.repository.UserRepository;
import com.ticketing.security.UserPrincipal;
import com.ticketing.service.EventService;
import com.ticketing.specification.EventSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final EventTypeRepository eventTypeRepository;
    private final TicketRepository ticketRepository;
    private final BookingRepository bookingRepository;

    private static final Set<BookingStatus> INACTIVE_STATUSES =
            Set.of(BookingStatus.CANCELLED, BookingStatus.EXPIRED);

    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> getMyEvents(Long userId) {
        return eventRepository.findByCreatedBy_UserIdOrderByEventIdDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EventResponse getEventById(Long id) {
        return eventRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + id));
    }

    @Override
    @Transactional
    public EventResponse createEvent(CreateEventRequest request, Long createdByUserId) {
        User organizer = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + createdByUserId));

        List<EventType> tags = eventTypeRepository.findAllById(request.tagIds());
        if (tags.size() != request.tagIds().size()) {
            throw new BookingValidationException("One or more tag IDs are invalid");
        }

        Event event = Event.builder()
                .title(request.title())
                .durationMinutes(request.durationMinutes())
                .rating(request.rating())
                .thumbnail(request.thumbnail())
                .description(request.description())
                .createdBy(organizer)
                .tags(new HashSet<>(tags))
                .build();

        return toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional
    public EventResponse updateEvent(Long eventId, UpdateEventRequest request, UserPrincipal principal) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        if ("ORGANIZER".equals(principal.getRole()) &&
                !event.getCreatedBy().getUserId().equals(principal.getUserId())) {
            throw new UnauthorizedAccessException("You do not own this event");
        }

        List<EventType> tags = eventTypeRepository.findAllById(request.tagIds());
        if (tags.size() != request.tagIds().size()) {
            throw new BookingValidationException("One or more tag IDs are invalid");
        }

        event.setTitle(request.title());
        event.setDurationMinutes(request.durationMinutes());
        event.setRating(request.rating());
        event.setThumbnail(request.thumbnail());
        event.setDescription(request.description());
        event.getTags().clear();
        event.getTags().addAll(tags);

        return toResponse(eventRepository.save(event));
    }

    @Override
    @Transactional
    public void deleteEvent(Long eventId, UserPrincipal principal) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        if ("ORGANIZER".equals(principal.getRole()) &&
                !event.getCreatedBy().getUserId().equals(principal.getUserId())) {
            throw new UnauthorizedAccessException("You do not own this event");
        }

        // Cancel all active bookings across every showtime before deleting
        event.getShowtimes().forEach(showtime -> {
            List<Booking> active = bookingRepository.findActiveByShowtimeId(
                    showtime.getShowtimeId(), INACTIVE_STATUSES);
            active.forEach(Booking::cancel);
            bookingRepository.saveAll(active);
        });

        eventRepository.deleteById(eventId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> searchEvents(
            String title,
            List<Long> tagIds,
            List<String> ratings,
            List<Long> venueIds,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            LocalDate startDate,
            LocalDate endDate) {
        OffsetDateTime start = startDate != null
                ? startDate.atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        OffsetDateTime end = endDate != null
                ? endDate.atTime(23, 59, 59).atOffset(ZoneOffset.UTC) : null;

        Specification<Event> spec = EventSpecification.withFilters(
                (title != null && !title.isBlank()) ? title : null,
                (tagIds != null && !tagIds.isEmpty()) ? tagIds : null,
                (ratings != null && !ratings.isEmpty()) ? ratings : null,
                (venueIds != null && !venueIds.isEmpty()) ? venueIds : null,
                minPrice, maxPrice, start, end);
        return eventRepository.findAll(spec).stream().map(this::toResponse).toList();
    }

    private EventResponse toResponse(Event event) {
        List<TagDto> tags = event.getTags().stream()
                .sorted((a, b) -> a.getTypeName().compareToIgnoreCase(b.getTypeName()))
                .map(t -> new TagDto(t.getTypeId(), t.getTypeName()))
                .toList();

        List<ShowtimeResponse> showtimes = event.getShowtimes().stream()
                .map(this::toShowtimeResponse)
                .toList();

        return new EventResponse(
                event.getEventId(), event.getTitle(),
                event.getDurationMinutes(), event.getRating(), event.getThumbnail(),
                event.getDescription(), tags, showtimes);
    }

    private ShowtimeResponse toShowtimeResponse(Showtime s) {
        Venue v = s.getVenue();
        VenueSummaryDto venue = new VenueSummaryDto(v.getVenueId(), v.getName(), v.getCapacity());

        List<TicketTierResponse> tiers = s.getTiers().stream()
                .map(t -> {
                    int booked = ticketRepository.countByTier_TierIdAndStatusNot(
                            t.getTierId(), TicketStatus.CANCELLED);
                    return new TicketTierResponse(
                            t.getTierId(), t.getTierName(), t.getPrice(),
                            t.getTotalAmount(), t.getTotalAmount() - booked);
                })
                .toList();

        return new ShowtimeResponse(
                s.getShowtimeId(), s.getEvent().getEventId(), venue,
                s.getShowSchedules(), s.getTicketPerPerson(), tiers);
    }
}
