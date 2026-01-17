package com.ega.bank_backend.controller;

import com.ega.bank_backend.dto.ClientRequestDTO;
import com.ega.bank_backend.dto.ClientResponseDTO;
import com.ega.bank_backend.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ClientResponseDTO> createClient(@Valid @RequestBody ClientRequestDTO dto) {
        return new ResponseEntity<>(clientService.createClient(dto), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ClientResponseDTO> getAllClients() {
        return clientService.getAllClients();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @clientSecurity.isOwner(authentication, #id)")
    public ClientResponseDTO getClientById(@PathVariable Long id) {
        return clientService.getClientById(id);
    }

    @GetMapping("/me")
    public ClientResponseDTO getMyProfile(Authentication authentication) {
        return clientService.getClientByUsername(authentication.getName());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ClientResponseDTO updateClient(@PathVariable Long id, @Valid @RequestBody ClientRequestDTO dto) {
        return clientService.updateClient(id, dto);
    }

    @PutMapping("/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> suspendClient(@PathVariable Long id) {
        clientService.suspendClient(id);
        return ResponseEntity.ok().body("{\"message\": \"Client suspendu avec succès\"}");
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> activateClient(@PathVariable Long id) {
        clientService.activateClient(id);
        return ResponseEntity.ok().body("{\"message\": \"Client réactivé avec succès\"}");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClient(@PathVariable Long id) {
        clientService.deleteClient(id);
    }
}
