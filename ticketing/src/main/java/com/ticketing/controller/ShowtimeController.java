package com.ticketing.controller;

import com.ticketing.dto.event.ShowtimeResponse;
import com.ticketing.dto.showtime.CreateShowtimeRequest;
import com.ticketing.dto.showtime.UpdateShowtimeRequest;
import com.ticketing.security.UserPrincipal;
import com.ticketing.service.ShowtimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @PostMapping
    public ResponseEntity<ShowtimeResponse> create(
            @Valid @RequestBody CreateShowtimeRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(showtimeService.create(req, principal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShowtimeResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShowtimeRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(showtimeService.update(id, req, principal));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        showtimeService.delete(id, principal);
        return ResponseEntity.noContent().build();
    }
}
