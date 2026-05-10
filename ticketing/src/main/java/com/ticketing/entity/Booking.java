package com.ticketing.entity;

import com.ticketing.entity.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Long bookingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "timestamp", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime timestamp;

    @Column(name = "expires_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime expiresAt;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "booking_status")
    private BookingStatus status;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Ticket> tickets = new ArrayList<>();

    @OneToOne(mappedBy = "booking", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private Payment payment;

    public boolean isPending() {
        return this.status == BookingStatus.PENDING;
    }

    public boolean hasExpired() {
        return OffsetDateTime.now().isAfter(this.expiresAt);
    }

    public void cancel() {
        this.status = BookingStatus.CANCELLED;
        this.tickets.forEach(Ticket::cancel);
    }

    public void expire() {
        this.status = BookingStatus.EXPIRED;
        this.tickets.forEach(Ticket::cancel);
    }
}
