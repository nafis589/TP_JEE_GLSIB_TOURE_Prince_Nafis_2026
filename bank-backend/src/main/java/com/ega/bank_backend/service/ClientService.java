package com.ega.bank_backend.service;

import com.ega.bank_backend.dto.ClientRequestDTO;
import com.ega.bank_backend.dto.ClientResponseDTO;
import com.ega.bank_backend.dto.AccountResponseDTO;
import com.ega.bank_backend.entity.Client;
import com.ega.bank_backend.exception.ResourceNotFoundException;
import com.ega.bank_backend.repository.ClientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ClientService {

    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public ClientResponseDTO createClient(ClientRequestDTO dto) {
        Client client = new Client();
        mapToEntity(dto, client);
        Client saved = clientRepository.save(client);
        return mapToResponseDTO(saved);
    }

    public ClientResponseDTO updateClient(Long id, ClientRequestDTO dto) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable avec l'ID: " + id));
        mapToEntity(dto, client);
        Client saved = clientRepository.save(client);
        return mapToResponseDTO(saved);
    }

    public List<ClientResponseDTO> getAllClients() {
        return clientRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public ClientResponseDTO getClientById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable avec l'ID: " + id));
        return mapToResponseDTO(client);
    }

    public ClientResponseDTO getClientByUsername(String username) {
        Client client = clientRepository.findAll().stream()
                .filter(c -> c.getUser() != null && c.getUser().getUsername().equals(username))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable pour l'utilisateur: " + username));
        return mapToResponseDTO(client);
    }

    public void deleteClient(Long id) {
        if (!clientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Client introuvable avec l'ID: " + id);
        }
        clientRepository.deleteById(id);
    }

    public void suspendClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable avec l'ID: " + id));
        client.setStatus(com.ega.bank_backend.entity.ClientStatus.SUSPENDED);
        clientRepository.save(client);
    }

    public void activateClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable avec l'ID: " + id));
        client.setStatus(com.ega.bank_backend.entity.ClientStatus.ACTIVE);
        clientRepository.save(client);
    }

    private void mapToEntity(ClientRequestDTO dto, Client client) {
        client.setFirstName(dto.firstName());
        client.setLastName(dto.lastName());
        client.setEmail(dto.email());
        client.setBirthDate(dto.birthDate());
        client.setGender(dto.gender());
        client.setAddress(dto.address());
        client.setPhoneNumber(dto.phoneNumber());
        client.setNationality(dto.nationality());
    }

    private ClientResponseDTO mapToResponseDTO(Client client) {
        List<AccountResponseDTO> accounts = client.getAccounts().stream()
                .map(acc -> new AccountResponseDTO(
                        acc.getId(),
                        acc.getAccountNumber(),
                        acc.getAccountType(),
                        acc.getBalance(),
                        acc.getCreatedAt(),
                        client.getFirstName() + " " + client.getLastName(),
                        client.getId()))
                .collect(Collectors.toList());

        return new ClientResponseDTO(
                client.getId(),
                client.getFirstName(),
                client.getLastName(),
                client.getEmail(),
                client.getStatus(),
                accounts);
    }
}
