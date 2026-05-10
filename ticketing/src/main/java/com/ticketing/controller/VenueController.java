package com.ticketing.controller;

import com.ticketing.dto.venue.VenueLayoutResponse;
import com.ticketing.dto.venue.VenueRequest;
import com.ticketing.dto.venue.VenueResponse;
import com.ticketing.service.VenueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/venues")
@RequiredArgsConstructor
public class VenueController {

    private final VenueService venueService;

    @GetMapping
    public ResponseEntity<List<VenueResponse>> listAll() {
        return ResponseEntity.ok(venueService.listAll());
    }

    @PostMapping
    public ResponseEntity<VenueResponse> create(@Valid @RequestBody VenueRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(venueService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VenueResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody VenueRequest req) {
        return ResponseEntity.ok(venueService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        venueService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/layout")
    public ResponseEntity<VenueLayoutResponse> getLayout(
            @PathVariable Long id,
            @RequestParam Long showtimeId) {
        return ResponseEntity.ok(venueService.getLayout(id, showtimeId));
    }
}
