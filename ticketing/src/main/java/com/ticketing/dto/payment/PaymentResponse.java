package com.ticketing.dto.payment;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PaymentResponse(
        Long paymentId,
        Long bookingId,
        String paymentMethod,
        BigDecimal amount,
        String status,
        OffsetDateTime timestamp) {}
