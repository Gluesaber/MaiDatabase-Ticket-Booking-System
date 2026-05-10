package com.ticketing.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateRoleRequest(
        @NotBlank
        @Pattern(regexp = "^(admin|organizer|customer)$", message = "Role must be admin, organizer, or customer")
        String roleName) {}
