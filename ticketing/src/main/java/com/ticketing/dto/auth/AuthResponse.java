package com.ticketing.dto.auth;

public record AuthResponse(String token, UserDto user) {}
