package com.ticketing.controller;

import com.ticketing.dto.booking.BookingHistoryItem;
import com.ticketing.dto.booking.BookingRequest;
import com.ticketing.dto.booking.BookingResponse;
import com.ticketing.security.UserPrincipal;
import com.ticketing.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @RequestBody BookingRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(request, principal.getUserId()));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        bookingService.cancelBooking(id, principal.getUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/history")
    public ResponseEntity<List<BookingHistoryItem>> getHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.getBookingHistory(principal.getUserId()));
    }
}
