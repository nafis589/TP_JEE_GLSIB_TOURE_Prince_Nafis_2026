package com.ega.bank_backend.dto;

import java.util.List;

public record ClientResponseDTO(
                Long id,
                String firstName,
                String lastName,
                String email,
                com.ega.bank_backend.entity.ClientStatus status,
                List<AccountResponseDTO> accounts) {
}
