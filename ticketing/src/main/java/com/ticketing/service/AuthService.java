package com.ticketing.service;

import com.ticketing.dto.auth.AuthResponse;
import com.ticketing.dto.auth.LoginRequest;
import com.ticketing.dto.auth.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
