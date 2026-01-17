package com.ega.bank_backend.service;

import com.ega.bank_backend.dto.AccountRequestDTO;
import com.ega.bank_backend.dto.AccountResponseDTO;
import com.ega.bank_backend.entity.Account;
import com.ega.bank_backend.entity.Client;
import com.ega.bank_backend.exception.ResourceNotFoundException;
import com.ega.bank_backend.repository.AccountRepository;
import com.ega.bank_backend.repository.ClientRepository;
import org.iban4j.CountryCode;
import org.iban4j.Iban;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AccountService {

    private final AccountRepository accountRepository;
    private final ClientRepository clientRepository;

    public AccountService(AccountRepository accountRepository, ClientRepository clientRepository) {
        this.accountRepository = accountRepository;
        this.clientRepository = clientRepository;
    }

    public AccountResponseDTO createAccount(AccountRequestDTO dto) {
        Client owner = clientRepository.findById(dto.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable avec l'ID: " + dto.clientId()));

        if (owner.getStatus() == com.ega.bank_backend.entity.ClientStatus.SUSPENDED) {
            throw new IllegalArgumentException("Impossible de créer un compte pour un client suspendu");
        }

        Account account = new Account();
        account.setAccountType(dto.accountType());
        account.setOwner(owner);
        account.setAccountNumber(generateUniqueAccountNumber());

        Account saved = accountRepository.save(account);
        return mapToResponseDTO(saved);
    }

    public AccountResponseDTO getAccountByNumber(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Compte introuvable avec le numéro: " + accountNumber));
        return mapToResponseDTO(account);
    }

    public List<AccountResponseDTO> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public List<AccountResponseDTO> getAccountsByUsername(String username) {
        return accountRepository.findAll().stream()
                .filter(acc -> acc.getOwner().getUser() != null
                        && acc.getOwner().getUser().getUsername().equals(username))
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    private String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            accountNumber = Iban.random(CountryCode.FR).toString();
        } while (accountRepository.findByAccountNumber(accountNumber).isPresent());
        return accountNumber;
    }

    private AccountResponseDTO mapToResponseDTO(Account account) {
        return new AccountResponseDTO(
                account.getId(),
                account.getAccountNumber(),
                account.getAccountType(),
                account.getBalance(),
                account.getCreatedAt(),
                account.getOwner().getFirstName() + " " + account.getOwner().getLastName(),
                account.getOwner().getId());
    }
}
