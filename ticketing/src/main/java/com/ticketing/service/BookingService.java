package com.ticketing.service;

import com.ticketing.dto.booking.BookingHistoryItem;
import com.ticketing.dto.booking.BookingRequest;
import com.ticketing.dto.booking.BookingResponse;

import java.util.List;

public interface BookingService {
    BookingResponse createBooking(BookingRequest request, Long userId);
    List<BookingHistoryItem> getBookingHistory(Long userId);
    void cancelBooking(Long bookingId, Long userId);
}
