package com.ticketing.controller;

import com.ticketing.dto.payment.PaymentRequest;
import com.ticketing.dto.payment.PaymentResponse;
import com.ticketing.security.UserPrincipal;
import com.ticketing.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> processPayment(
            @RequestBody PaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(paymentService.processPayment(request, principal.getUserId()));
    }
}
