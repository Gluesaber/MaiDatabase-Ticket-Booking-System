package com.ticketing.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "eventtypes")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EventType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "type_id")
    private Long typeId;

    @Column(name = "type_name", nullable = false, unique = true, length = 100)
    private String typeName;
}
