package com.ticketing.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "venues")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Venue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "venue_id")
    private Long venueId;

    @Column(nullable = false, length = 255)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id", nullable = false)
    private Address address;

    @Column(nullable = false)
    private Integer capacity;
}
