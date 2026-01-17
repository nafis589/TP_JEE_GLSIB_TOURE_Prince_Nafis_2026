package com.ega.bank_backend.service;

import com.ega.bank_backend.dto.TransactionRequestDTO;
import com.ega.bank_backend.entity.Account;
import com.ega.bank_backend.entity.Transaction;
import com.ega.bank_backend.entity.TransactionType;
import com.ega.bank_backend.exception.InsufficientBalanceException;
import com.ega.bank_backend.exception.ResourceNotFoundException;
import com.ega.bank_backend.repository.AccountRepository;
import com.ega.bank_backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    public TransactionService(TransactionRepository transactionRepository, AccountRepository accountRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
    }

    public void deposit(TransactionRequestDTO dto) {
        Account account = getAccount(dto.accountNumber());
        if (account.getOwner().getStatus() == com.ega.bank_backend.entity.ClientStatus.SUSPENDED) {
            throw new IllegalArgumentException("Opération impossible : Client suspendu");
        }
        account.setBalance(account.getBalance().add(dto.amount()));

        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.DEPOT);
        transaction.setAmount(dto.amount());
        transaction.setDescription(dto.description() != null ? dto.description() : "Dépôt sur compte");
        transaction.setAccount(account);

        transactionRepository.save(transaction);
        accountRepository.save(account);
    }

    public void withdraw(TransactionRequestDTO dto) {
        Account account = getAccount(dto.accountNumber());
        if (account.getOwner().getStatus() == com.ega.bank_backend.entity.ClientStatus.SUSPENDED) {
            throw new IllegalArgumentException("Opération impossible : Client suspendu");
        }
        if (account.getBalance().compareTo(dto.amount()) < 0) {
            throw new InsufficientBalanceException(
                    "Solde insuffisant pour le retrait sur le compte " + dto.accountNumber());
        }

        account.setBalance(account.getBalance().subtract(dto.amount()));

        Transaction transaction = new Transaction();
        transaction.setType(TransactionType.RETRAIT);
        transaction.setAmount(dto.amount());
        transaction.setDescription(dto.description() != null ? dto.description() : "Retrait du compte");
        transaction.setAccount(account);

        transactionRepository.save(transaction);
        accountRepository.save(account);
    }

    public void transfer(TransactionRequestDTO dto) {
        if (dto.targetAccountNumber() == null || dto.targetAccountNumber().isBlank()) {
            throw new IllegalArgumentException("Le numéro de compte de destination est obligatoire pour un virement");
        }

        Account sourceAccount = getAccount(dto.accountNumber());
        if (sourceAccount.getOwner().getStatus() == com.ega.bank_backend.entity.ClientStatus.SUSPENDED) {
            throw new IllegalArgumentException("Opération impossible : Client émetteur suspendu");
        }

        Account targetAccount = getAccount(dto.targetAccountNumber());
        // Should we check target account owner status too? Requirement says "Bloquer
        // les opérations... si le client est suspendu". Usually implies the initiator.
        // But if target is suspended, maybe they shouldn't receive? Let's stick to
        // initiator (source) for now unless specified.
        // Actually, for deposit/withdraw it's clear. For transfer, the "client" usually
        // refers to the one initiating the action.

        if (sourceAccount.getBalance().compareTo(dto.amount()) < 0) {
            throw new InsufficientBalanceException("Solde insuffisant pour le virement");
        }

        // Debit source
        sourceAccount.setBalance(sourceAccount.getBalance().subtract(dto.amount()));
        Transaction sourceTx = new Transaction();
        sourceTx.setType(TransactionType.VIREMENT);
        sourceTx.setAmount(dto.amount());
        sourceTx.setDescription("Virement vers " + dto.targetAccountNumber() + ": " + dto.description());
        sourceTx.setAccount(sourceAccount);
        sourceTx.setTargetAccountNumber(dto.targetAccountNumber());

        // Credit target
        targetAccount.setBalance(targetAccount.getBalance().add(dto.amount()));
        Transaction targetTx = new Transaction();
        targetTx.setType(TransactionType.VIREMENT);
        targetTx.setAmount(dto.amount());
        targetTx.setDescription("Reçu de " + dto.accountNumber() + ": " + dto.description());
        targetTx.setAccount(targetAccount);
        targetTx.setTargetAccountNumber(dto.accountNumber());

        transactionRepository.save(sourceTx);
        transactionRepository.save(targetTx);
        accountRepository.save(sourceAccount);
        accountRepository.save(targetAccount);
    }

    public List<Transaction> getHistory(String accountNumber, LocalDateTime start, LocalDateTime end) {
        Account account = getAccount(accountNumber);

        return transactionRepository.findByAccountIdAndTimestampBetween(account.getId(), start, end);
    }

    public String generateBankStatement(String accountNumber, LocalDateTime start, LocalDateTime end) {
        Account account = getAccount(accountNumber);
        List<Transaction> transactions = getHistory(accountNumber, start, end);

        StringBuilder sb = new StringBuilder();
        sb.append("===== RELEVE BANCAIRE =====\n");
        sb.append("Titulaire: ").append(account.getOwner().getFirstName()).append(" ")
                .append(account.getOwner().getLastName()).append("\n");
        sb.append("Compte: ").append(account.getAccountNumber()).append(" (").append(account.getAccountType())
                .append(")\n");
        sb.append("Période: ").append(start).append(" au ").append(end).append("\n");
        sb.append("Solde actuel: ").append(account.getBalance()).append("\n");
        sb.append("----------------------------\n");
        sb.append(String.format("%-20s | %-10s | %-10s | %-30s\n", "Date", "Type", "Montant", "Description"));

        for (Transaction t : transactions) {
            sb.append(String.format("%-20s | %-10s | %-10s | %-30s\n",
                    t.getTimestamp().toString().substring(0, 16),
                    t.getType(),
                    t.getAmount(),
                    t.getDescription()));
        }
        sb.append("----------------------------\n");
        return sb.toString();
    }

    private Account getAccount(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Compte introuvable: " + accountNumber));
    }
}
