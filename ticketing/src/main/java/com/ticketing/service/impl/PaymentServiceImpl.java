package com.ticketing.service.impl;

import com.ticketing.dto.payment.PaymentRequest;
import com.ticketing.dto.payment.PaymentResponse;
import com.ticketing.entity.Booking;
import com.ticketing.entity.Payment;
import com.ticketing.entity.Ticket;
import com.ticketing.entity.enums.BookingStatus;
import com.ticketing.entity.enums.PaymentMethod;
import com.ticketing.entity.enums.PaymentStatus;
import com.ticketing.exception.BookingValidationException;
import com.ticketing.exception.ResourceNotFoundException;
import com.ticketing.exception.UnauthorizedAccessException;
import com.ticketing.repository.BookingRepository;
import com.ticketing.repository.PaymentRepository;
import com.ticketing.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @Override
    @Transactional
    public PaymentResponse processPayment(PaymentRequest request, Long userId) {
        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + request.bookingId()));

        if (!booking.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedAccessException("This booking does not belong to you.");
        }
        if (!booking.isPending()) {
            throw new BookingValidationException("Booking is not in PENDING state.");
        }
        if (booking.hasExpired()) {
            booking.expire();
            bookingRepository.save(booking);
            throw new BookingValidationException("Booking has expired. Please create a new booking.");
        }

        BigDecimal expectedTotal = booking.getTickets().stream()
                .filter(Ticket::isActive)
                .map(Ticket::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (request.amount().compareTo(expectedTotal) != 0) {
            throw new BookingValidationException(
                    "Payment amount mismatch. Expected: " + expectedTotal);
        }

        Payment payment = Payment.builder()
                .booking(booking)
                .paymentMethod(PaymentMethod.valueOf(request.paymentMethod()))
                .amount(request.amount())
                .status(PaymentStatus.COMPLETED)
                .timestamp(OffsetDateTime.now())
                .build();

        paymentRepository.save(payment);

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.getTickets().stream()
                .filter(Ticket::isActive)
                .forEach(Ticket::confirm);
        bookingRepository.save(booking);

        return new PaymentResponse(
                payment.getPaymentId(), booking.getBookingId(),
                payment.getPaymentMethod().name(), payment.getAmount(),
                payment.getStatus().name(), payment.getTimestamp());
    }
}
