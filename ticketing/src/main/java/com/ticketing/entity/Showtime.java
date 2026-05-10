package com.ticketing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "showtimes")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Showtime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "showtime_id")
    private Long showtimeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    @Column(name = "show_schedules", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime showSchedules;

    @Column(name = "ticket_per_person", nullable = false)
    private Integer ticketPerPerson;

    @OneToMany(mappedBy = "showtime", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TicketTier> tiers = new ArrayList<>();
}
