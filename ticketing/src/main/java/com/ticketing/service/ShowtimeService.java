package com.ticketing.service;

import com.ticketing.dto.event.ShowtimeResponse;
import com.ticketing.dto.showtime.CreateShowtimeRequest;
import com.ticketing.dto.showtime.UpdateShowtimeRequest;
import com.ticketing.security.UserPrincipal;

public interface ShowtimeService {
    ShowtimeResponse create(CreateShowtimeRequest request, UserPrincipal principal);
    ShowtimeResponse update(Long showtimeId, UpdateShowtimeRequest request, UserPrincipal principal);
    void delete(Long showtimeId, UserPrincipal principal);
}
