package com.ega.bank_backend.dto;

import com.ega.bank_backend.entity.AccountType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountResponseDTO(
                Long id,
                String accountNumber,
                AccountType accountType,
                BigDecimal balance,
                LocalDateTime createdAt,
                String ownerName,
                Long clientId) {
}
