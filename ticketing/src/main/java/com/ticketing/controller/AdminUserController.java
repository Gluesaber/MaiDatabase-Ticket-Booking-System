package com.ticketing.controller;

import com.ticketing.dto.admin.UpdateRoleRequest;
import com.ticketing.dto.admin.UserDto;
import com.ticketing.entity.Role;
import com.ticketing.entity.User;
import com.ticketing.exception.BookingValidationException;
import com.ticketing.exception.ResourceNotFoundException;
import com.ticketing.repository.RoleRepository;
import com.ticketing.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<UserDto>> listUsers() {
        List<UserDto> users = userRepository.findAll().stream()
                .map(u -> new UserDto(
                        u.getUserId(), u.getEmail(),
                        u.getFirstName(), u.getLastName(),
                        u.getRole().getRoleName()))
                .toList();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}/role")
    @Transactional
    public ResponseEntity<UserDto> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        Role role = roleRepository.findByRoleName(request.roleName())
                .orElseThrow(() -> new BookingValidationException("Invalid role: " + request.roleName()));
        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.ok(new UserDto(
                user.getUserId(), user.getEmail(),
                user.getFirstName(), user.getLastName(),
                user.getRole().getRoleName()));
    }
}
