package com.ticketing.service.impl;

import com.ticketing.dto.auth.*;
import com.ticketing.entity.Role;
import com.ticketing.entity.User;
import com.ticketing.exception.BookingValidationException;
import com.ticketing.exception.ResourceNotFoundException;
import com.ticketing.exception.UnauthorizedAccessException;
import com.ticketing.repository.RoleRepository;
import com.ticketing.repository.UserRepository;
import com.ticketing.service.AuthService;
import com.ticketing.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BookingValidationException("Email is already registered.");
        }

        Role customerRole = roleRepository.findByRoleName("customer")
                .orElseThrow(() -> new ResourceNotFoundException("Default role not configured."));

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .role(customerRole)
                .build();

        userRepository.save(user);
        return buildResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedAccessException("Invalid email or password."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        return buildResponse(user);
    }

    private AuthResponse buildResponse(User user) {
        UserDto dto = new UserDto(
                user.getUserId(), user.getEmail(),
                user.getFirstName(), user.getLastName(),
                user.getRole().getRoleName());
        return new AuthResponse(jwtService.generateToken(user), dto);
    }
}
