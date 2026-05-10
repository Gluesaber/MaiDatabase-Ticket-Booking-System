package com.ticketing.service.impl;

import com.ticketing.dto.booking.*;
import com.ticketing.dto.event.VenueSummaryDto;
import com.ticketing.entity.*;
import com.ticketing.entity.enums.BookingStatus;
import com.ticketing.entity.enums.TicketStatus;
import com.ticketing.exception.BookingValidationException;
import com.ticketing.exception.ResourceNotFoundException;
import com.ticketing.exception.UnauthorizedAccessException;
import com.ticketing.repository.*;
import com.ticketing.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final int BOOKING_WINDOW_MINUTES = 15;

    private final BookingRepository bookingRepository;
    private final ShowtimeRepository showtimeRepository;
    private final TicketTierRepository ticketTierRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        Showtime showtime = showtimeRepository.findById(request.showtimeId())
                .orElseThrow(() -> new ResourceNotFoundException("Showtime not found: " + request.showtimeId()));

        validateQuota(request.tickets().size(), showtime.getTicketPerPerson());
        validateSeatAvailability(request.tickets(), showtime.getShowtimeId());

        Booking booking = Booking.builder()
                .user(user)
                .timestamp(OffsetDateTime.now())
                .expiresAt(OffsetDateTime.now().plusMinutes(BOOKING_WINDOW_MINUTES))
                .status(BookingStatus.PENDING)
                .build();

        bookingRepository.save(booking);

        List<Ticket> tickets = request.tickets().stream()
                .map(dto -> buildTicket(dto, booking))
                .toList();

        ticketRepository.saveAll(tickets);
        booking.setTickets(tickets);

        BigDecimal total = tickets.stream()
                .map(Ticket::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return toBookingResponse(booking, total);
    }

    @Override
    @Transactional
    public void cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        if (!booking.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedAccessException("This booking does not belong to you.");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BookingValidationException("Booking is already cancelled.");
        }
        if (booking.getStatus() == BookingStatus.EXPIRED) {
            throw new BookingValidationException("Cannot cancel an expired booking.");
        }

        booking.cancel();
        bookingRepository.save(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingHistoryItem> getBookingHistory(Long userId) {
        return bookingRepository.findByUser_UserIdOrderByTimestampDesc(userId).stream()
                .map(this::toHistoryItem)
                .toList();
    }

    private void validateQuota(int requested, int limit) {
        if (requested < 1) {
            throw new BookingValidationException("At least one ticket is required.");
        }
        if (requested > limit) {
            throw new BookingValidationException(
                    "This showtime allows at most " + limit + " ticket(s) per booking.");
        }
    }

    private void validateSeatAvailability(List<TicketRequestDto> tickets, Long showtimeId) {
        for (TicketRequestDto t : tickets) {
            boolean taken = ticketRepository.existsBySeatCodeAndTier_Showtime_ShowtimeIdAndStatusNot(
                    t.seatCode(), showtimeId, TicketStatus.CANCELLED);
            if (taken) {
                throw new BookingValidationException("Seat " + t.seatCode() + " is already taken.");
            }
        }
    }

    private Ticket buildTicket(TicketRequestDto dto, Booking booking) {
        TicketTier tier = ticketTierRepository.findById(dto.tierId())
                .orElseThrow(() -> new ResourceNotFoundException("Tier not found: " + dto.tierId()));
        return Ticket.builder()
                .tier(tier)
                .booking(booking)
                .seatCode(dto.seatCode())
                .status(TicketStatus.RESERVED)
                .price(tier.getPrice())
                .build();
    }

    private BookingResponse toBookingResponse(Booking booking, BigDecimal total) {
        List<TicketResponseDto> ticketDtos = booking.getTickets().stream()
                .map(t -> new TicketResponseDto(
                        t.getTicketId(), t.getSeatCode(),
                        t.getTier().getTierName(), t.getPrice(),
                        t.getStatus().name()))
                .toList();
        return new BookingResponse(
                booking.getBookingId(), booking.getStatus().name(),
                booking.getExpiresAt(), total, ticketDtos);
    }

    private BookingHistoryItem toHistoryItem(Booking booking) {
        if (booking.getTickets().isEmpty()) {
            return new BookingHistoryItem(
                    booking.getBookingId(), booking.getStatus().name(),
                    BigDecimal.ZERO, booking.getTimestamp(), booking.getExpiresAt(),
                    null, List.of());
        }

        Showtime s = booking.getTickets().get(0).getTier().getShowtime();
        Event e = s.getEvent();
        Venue v = s.getVenue();

        ShowtimeContext ctx = new ShowtimeContext(
                s.getShowSchedules(),
                new VenueSummaryDto(v.getVenueId(), v.getName(), v.getCapacity()),
                new EventContext(e.getEventId(), e.getTitle(), e.getThumbnail(),
                        e.getTags().stream()
                                .map(t -> new com.ticketing.dto.event.TagDto(t.getTypeId(), t.getTypeName()))
                                .toList()));

        List<TicketResponseDto> ticketDtos = booking.getTickets().stream()
                .map(t -> new TicketResponseDto(
                        t.getTicketId(), t.getSeatCode(),
                        t.getTier().getTierName(), t.getPrice(),
                        t.getStatus().name()))
                .toList();

        BigDecimal total = booking.getTickets().stream()
                .filter(Ticket::isActive)
                .map(Ticket::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new BookingHistoryItem(
                booking.getBookingId(), booking.getStatus().name(), total,
                booking.getTimestamp(), booking.getExpiresAt(), ctx, ticketDtos);
    }
}
