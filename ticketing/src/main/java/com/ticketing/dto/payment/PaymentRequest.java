package com.ticketing.dto.payment;

import java.math.BigDecimal;

public record PaymentRequest(Long bookingId, String paymentMethod, BigDecimal amount) {}
