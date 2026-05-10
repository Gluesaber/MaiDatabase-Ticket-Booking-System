package com.ticketing.service.impl;

import com.ticketing.dto.event.ShowtimeResponse;
import com.ticketing.dto.event.TicketTierResponse;
import com.ticketing.dto.event.VenueSummaryDto;
import com.ticketing.dto.showtime.CreateShowtimeRequest;
import com.ticketing.dto.showtime.TierRequest;
import com.ticketing.dto.showtime.TierUpdateItem;
import com.ticketing.dto.showtime.UpdateShowtimeRequest;
import com.ticketing.entity.Booking;
import com.ticketing.entity.Event;
import com.ticketing.entity.Showtime;
import com.ticketing.entity.TicketTier;
import com.ticketing.entity.Venue;
import com.ticketing.entity.enums.BookingStatus;
import com.ticketing.entity.enums.TicketStatus;
import com.ticketing.exception.BookingValidationException;
import com.ticketing.exception.ResourceNotFoundException;
import com.ticketing.exception.UnauthorizedAccessException;
import com.ticketing.repository.BookingRepository;
import com.ticketing.repository.EventRepository;
import com.ticketing.repository.ShowtimeRepository;
import com.ticketing.repository.TicketRepository;
import com.ticketing.repository.VenueRepository;
import com.ticketing.security.UserPrincipal;
import com.ticketing.service.ShowtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShowtimeServiceImpl implements ShowtimeService {

    private final ShowtimeRepository showtimeRepository;
    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final TicketRepository ticketRepository;
    private final BookingRepository bookingRepository;

    private static final Set<BookingStatus> INACTIVE_STATUSES =
            Set.of(BookingStatus.CANCELLED, BookingStatus.EXPIRED);

    @Override
    @Transactional
    public ShowtimeResponse create(CreateShowtimeRequest req, UserPrincipal principal) {
        Event event = eventRepository.findById(req.eventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + req.eventId()));

        if ("ORGANIZER".equals(principal.getRole()) &&
                !event.getCreatedBy().getUserId().equals(principal.getUserId())) {
            throw new UnauthorizedAccessException("You do not own this event");
        }

        Venue venue = venueRepository.findById(req.venueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + req.venueId()));

        int totalTierSeats = req.tiers().stream().mapToInt(TierRequest::totalAmount).sum();
        if (totalTierSeats > venue.getCapacity()) {
            throw new BookingValidationException(
                    "Total tier seats (" + totalTierSeats + ") exceeds venue capacity (" + venue.getCapacity() + ")");
        }

        OffsetDateTime endTime = req.showSchedules().plusMinutes(event.getDurationMinutes());
        if (showtimeRepository.countConflictingShowtimes(req.venueId(), req.showSchedules(), endTime, -1L) > 0) {
            throw new BookingValidationException(
                    "Venue '" + venue.getName() + "' is already booked during that time window.");
        }

        Showtime showtime = Showtime.builder()
                .event(event)
                .venue(venue)
                .showSchedules(req.showSchedules())
                .ticketPerPerson(req.ticketPerPerson())
                .build();

        req.tiers().forEach(t -> showtime.getTiers().add(TicketTier.builder()
                .showtime(showtime)
                .tierName(t.tierName())
                .price(t.price())
                .totalAmount(t.totalAmount())
                .build()));

        return toResponse(showtimeRepository.save(showtime));
    }

    @Override
    @Transactional
    public ShowtimeResponse update(Long showtimeId, UpdateShowtimeRequest req, UserPrincipal principal) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Showtime not found: " + showtimeId));

        if ("ORGANIZER".equals(principal.getRole()) &&
                !showtime.getEvent().getCreatedBy().getUserId().equals(principal.getUserId())) {
            throw new UnauthorizedAccessException("You do not own this showtime's event");
        }

        Venue venue = venueRepository.findById(req.venueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + req.venueId()));

        int totalSeats = req.tiers().stream().mapToInt(TierUpdateItem::totalAmount).sum();
        if (totalSeats > venue.getCapacity()) {
            throw new BookingValidationException(
                    "Total tier seats (" + totalSeats + ") exceeds venue capacity (" + venue.getCapacity() + ")");
        }

        OffsetDateTime endTime = req.showSchedules().plusMinutes(showtime.getEvent().getDurationMinutes());
        if (showtimeRepository.countConflictingShowtimes(req.venueId(), req.showSchedules(), endTime, showtimeId) > 0) {
            throw new BookingValidationException(
                    "Venue '" + venue.getName() + "' is already booked during that time window.");
        }

        // IDs of tiers that will be kept
        Set<Long> keptIds = req.tiers().stream()
                .filter(t -> t.tierId() != null)
                .map(TierUpdateItem::tierId)
                .collect(Collectors.toSet());

        // Remove tiers absent from the request — block if they have tickets
        Iterator<TicketTier> it = showtime.getTiers().iterator();
        while (it.hasNext()) {
            TicketTier tier = it.next();
            if (!keptIds.contains(tier.getTierId())) {
                int booked = ticketRepository.countByTier_TierIdAndStatusNot(
                        tier.getTierId(), TicketStatus.CANCELLED);
                if (booked > 0) {
                    throw new BookingValidationException(
                            "Cannot remove tier '" + tier.getTierName() + "': " + booked + " ticket(s) already booked.");
                }
                it.remove();
            }
        }

        // Update existing tiers / add new ones
        Map<Long, TicketTier> byId = showtime.getTiers().stream()
                .collect(Collectors.toMap(TicketTier::getTierId, t -> t));

        for (TierUpdateItem t : req.tiers()) {
            if (t.tierId() != null && byId.containsKey(t.tierId())) {
                TicketTier existing = byId.get(t.tierId());
                int booked = ticketRepository.countByTier_TierIdAndStatusNot(
                        t.tierId(), TicketStatus.CANCELLED);
                if (t.totalAmount() < booked) {
                    throw new BookingValidationException(
                            "Cannot reduce tier '" + t.tierName() + "' capacity below " + booked + " booked ticket(s).");
                }
                existing.setTierName(t.tierName());
                existing.setPrice(t.price());
                existing.setTotalAmount(t.totalAmount());
            } else if (t.tierId() == null) {
                showtime.getTiers().add(TicketTier.builder()
                        .showtime(showtime)
                        .tierName(t.tierName())
                        .price(t.price())
                        .totalAmount(t.totalAmount())
                        .build());
            }
        }

        showtime.setVenue(venue);
        showtime.setShowSchedules(req.showSchedules());
        showtime.setTicketPerPerson(req.ticketPerPerson());

        return toResponse(showtimeRepository.save(showtime));
    }

    @Override
    @Transactional
    public void delete(Long showtimeId, UserPrincipal principal) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Showtime not found: " + showtimeId));

        if ("ORGANIZER".equals(principal.getRole()) &&
                !showtime.getEvent().getCreatedBy().getUserId().equals(principal.getUserId())) {
            throw new UnauthorizedAccessException("You do not own this showtime's event");
        }

        // Cancel all active bookings before deleting
        List<Booking> active = bookingRepository.findActiveByShowtimeId(showtimeId, INACTIVE_STATUSES);
        active.forEach(Booking::cancel);
        bookingRepository.saveAll(active);

        showtimeRepository.deleteById(showtimeId);
    }

    private ShowtimeResponse toResponse(Showtime s) {
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
