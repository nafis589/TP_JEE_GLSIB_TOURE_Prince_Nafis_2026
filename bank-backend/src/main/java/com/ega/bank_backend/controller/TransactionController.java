package com.ega.bank_backend.controller;

import com.ega.bank_backend.dto.TransactionRequestDTO;
import com.ega.bank_backend.entity.Transaction;
import com.ega.bank_backend.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/deposit")
    @PreAuthorize("hasRole('ADMIN')")
    public String deposit(@Valid @RequestBody TransactionRequestDTO dto) {
        transactionService.deposit(dto);
        return "Dépôt effectué avec succès";
    }

    @PostMapping("/withdraw")
    @PreAuthorize("hasRole('ADMIN')")
    public String withdraw(@Valid @RequestBody TransactionRequestDTO dto) {
        transactionService.withdraw(dto);
        return "Retrait effectué avec succès";
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('CLIENT') and @clientSecurity.isAccountOwner(authentication, #dto.accountNumber()))")
    public String transfer(@Valid @RequestBody TransactionRequestDTO dto) {
        transactionService.transfer(dto);
        return "Virement effectué avec succès";
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Transaction> getAllHistory() {
        return transactionService.getAllTransactions();
    }

    @GetMapping("/history/{accountNumber}")
    @PreAuthorize("hasRole('ADMIN') or @clientSecurity.isAccountOwner(authentication, #accountNumber)")
    public List<Transaction> getHistory(
            @PathVariable String accountNumber,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return transactionService.getHistory(accountNumber, start, end);
    }

    @GetMapping("/statement/{accountNumber}")
    @PreAuthorize("hasRole('ADMIN') or @clientSecurity.isAccountOwner(authentication, #accountNumber)")
    public String getStatement(
            @PathVariable String accountNumber,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return transactionService.generateBankStatement(accountNumber, start, end);
    }
}
