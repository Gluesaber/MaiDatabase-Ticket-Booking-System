package com.ticketing.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "addresses")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "address_id")
    private Long addressId;

    @Column(name = "address_line", length = 255)
    private String addressLine;

    @Column(length = 255)
    private String street;

    @Column(name = "sub_district", length = 100)
    private String subDistrict;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String province;

    @Column(name = "postal_code", length = 10)
    private String postalCode;
}
