package com.ticketing.service;

import com.ticketing.dto.venue.VenueLayoutResponse;
import com.ticketing.dto.venue.VenueRequest;
import com.ticketing.dto.venue.VenueResponse;

import java.util.List;

public interface VenueService {
    List<VenueResponse> listAll();
    VenueResponse create(VenueRequest request);
    VenueResponse update(Long venueId, VenueRequest request);
    void delete(Long venueId);
    VenueLayoutResponse getLayout(Long venueId, Long showtimeId);
}
