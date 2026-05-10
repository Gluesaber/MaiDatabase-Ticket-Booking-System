package com.ticketing.entity;

import com.ticketing.entity.enums.TicketStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;

@Entity
@Table(name = "tickets")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Long ticketId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tier_id", nullable = false)
    private TicketTier tier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "seat_code", nullable = false, length = 20)
    private String seatCode;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ticket_status")
    private TicketStatus status;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    public boolean isActive() {
        return this.status != TicketStatus.CANCELLED;
    }

    public void cancel() {
        this.status = TicketStatus.CANCELLED;
    }

    public void confirm() {
        this.status = TicketStatus.CONFIRMED;
    }
}
