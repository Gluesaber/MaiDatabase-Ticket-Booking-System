package com.ticketing.dto.auth;

public record UserDto(Long userId, String email, String firstName, String lastName, String role) {}
