package com.ticketing.service.impl;

import com.ticketing.dto.venue.*;
import com.ticketing.entity.Address;
import com.ticketing.entity.TicketTier;
import com.ticketing.entity.Venue;
import com.ticketing.entity.enums.TicketStatus;
import com.ticketing.exception.ResourceNotFoundException;
import com.ticketing.repository.AddressRepository;
import com.ticketing.repository.TicketRepository;
import com.ticketing.repository.TicketTierRepository;
import com.ticketing.repository.VenueRepository;
import com.ticketing.service.VenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class VenueServiceImpl implements VenueService {

    private final VenueRepository venueRepository;
    private final AddressRepository addressRepository;
    private final TicketTierRepository ticketTierRepository;
    private final TicketRepository ticketRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VenueResponse> listAll() {
        return venueRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public VenueResponse create(VenueRequest req) {
        Address address = addressRepository.save(Address.builder()
                .addressLine(req.addressLine())
                .street(req.street())
                .subDistrict(req.subDistrict())
                .district(req.district())
                .province(req.province())
                .postalCode(req.postalCode())
                .build());
        Venue venue = venueRepository.save(Venue.builder()
                .name(req.name())
                .capacity(req.capacity())
                .address(address)
                .build());
        return toResponse(venue);
    }

    @Override
    @Transactional
    public VenueResponse update(Long venueId, VenueRequest req) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + venueId));
        venue.setName(req.name());
        venue.setCapacity(req.capacity());
        Address addr = venue.getAddress();
        addr.setAddressLine(req.addressLine());
        addr.setStreet(req.street());
        addr.setSubDistrict(req.subDistrict());
        addr.setDistrict(req.district());
        addr.setProvince(req.province());
        addr.setPostalCode(req.postalCode());
        return toResponse(venueRepository.save(venue));
    }

    @Override
    @Transactional
    public void delete(Long venueId) {
        if (!venueRepository.existsById(venueId))
            throw new ResourceNotFoundException("Venue not found: " + venueId);
        venueRepository.deleteById(venueId);
    }

    @Override
    @Transactional(readOnly = true)
    public VenueLayoutResponse getLayout(Long venueId, Long showtimeId) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + venueId));

        Set<String> takenSeats = ticketRepository
                .findByTier_Showtime_ShowtimeIdAndStatusNot(showtimeId, TicketStatus.CANCELLED)
                .stream()
                .map(t -> t.getSeatCode())
                .collect(Collectors.toSet());

        List<VenueSectionDto> sections = ticketTierRepository
                .findByShowtime_ShowtimeId(showtimeId)
                .stream()
                .map(tier -> buildSection(tier, takenSeats))
                .toList();

        return new VenueLayoutResponse(venue.getVenueId(), venue.getName(), venue.getCapacity(), sections);
    }

    private VenueResponse toResponse(Venue v) {
        Address a = v.getAddress();
        return new VenueResponse(
                v.getVenueId(),
                v.getName(),
                v.getCapacity(),
                new AddressDto(
                        a.getAddressId(),
                        a.getAddressLine(),
                        a.getStreet(),
                        a.getSubDistrict(),
                        a.getDistrict(),
                        a.getProvince(),
                        a.getPostalCode()));
    }

    private VenueSectionDto buildSection(TicketTier tier, Set<String> takenSeats) {
        String prefix = deriveSeatPrefix(tier.getTierName());
        int padWidth = String.valueOf(tier.getTotalAmount()).length();

        List<SeatDto> seats = IntStream.rangeClosed(1, tier.getTotalAmount())
                .mapToObj(i -> {
                    String code = prefix + "-" + String.format("%0" + padWidth + "d", i);
                    return new SeatDto(code, !takenSeats.contains(code));
                })
                .toList();

        return new VenueSectionDto(tier.getTierId(), tier.getTierName(), tier.getPrice(), seats);
    }

    private String deriveSeatPrefix(String tierName) {
        return switch (tierName.toUpperCase()) {
            case "VIP"      -> "VIP";
            case "STANDARD" -> "STD";
            case "ECONOMY"  -> "ECO";
            default -> tierName.substring(0, Math.min(3, tierName.length())).toUpperCase();
        };
    }
}
