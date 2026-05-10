package com.ticketing.service;

import com.ticketing.dto.payment.PaymentRequest;
import com.ticketing.dto.payment.PaymentResponse;

public interface PaymentService {
    PaymentResponse processPayment(PaymentRequest request, Long userId);
}
