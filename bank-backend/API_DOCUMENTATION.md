# 📚 Documentation Complète de l'API Bancaire EGA Bank

> **Version:** 1.0  
> **Date:** 18 Janvier 2026  
> **Base URL:** `http://localhost:3000/api`  
> **Auteur:** Projet JEE GLSIB - TOURE Prince Nafis  

---

## 📑 Table des Matières

1. [Introduction](#1-introduction)
2. [Configuration & Démarrage](#2-configuration--démarrage)
3. [Authentification JWT](#3-authentification-jwt)
4. [Endpoints Authentification](#4-endpoints-authentification)
5. [Endpoints Clients](#5-endpoints-clients)
6. [Endpoints Comptes](#6-endpoints-comptes)
7. [Endpoints Transactions](#7-endpoints-transactions)
8. [Modèles de Données (DTOs)](#8-modèles-de-données-dtos)
9. [Énumérations](#9-énumérations)
10. [Gestion des Erreurs](#10-gestion-des-erreurs)
11. [Exemples d'Intégration Frontend](#11-exemples-dintégration-frontend)
12. [Notes Importantes](#12-notes-importantes)

---

## 1. Introduction

L'API EGA Bank est une API REST sécurisée pour la gestion bancaire comprenant :
- **Gestion des clients** (CRUD complet)
- **Gestion des comptes bancaires** (création, consultation)
- **Opérations bancaires** (dépôt, retrait, virement)
- **Historique et relevés bancaires**
- **Authentification JWT avec rôles** (ADMIN/CLIENT)

### Technologies utilisées
- **Backend:** Spring Boot 3.x, Java 17
- **Base de données:** H2 (en mémoire)
- **Sécurité:** Spring Security + JWT
- **Validation:** Jakarta Validation
- **IBAN:** iban4j (génération automatique)

---

## 2. Configuration & Démarrage

### Variables d'environnement
```properties
server.port=3000
spring.datasource.url=jdbc:h2:mem:bankdb
```

### Utilisateur Admin par défaut
| Username | Password | Rôle |
|----------|----------|------|
| `admin` | `admin123` | ADMIN |

### Console H2 (Debug)
- **URL:** `http://localhost:3000/h2-console`
- **JDBC URL:** `jdbc:h2:mem:bankdb`
- **Username:** `sa`
- **Password:** `password`

### CORS
L'API autorise les requêtes depuis `http://localhost:4200` (Angular).

---

## 3. Authentification JWT

### Format du Header
```
Authorization: Bearer <votre_token_jwt>
```

### Flux d'authentification

```
┌─────────────┐     POST /api/auth/login      ┌─────────────┐
│   Frontend  │  ─────────────────────────►   │   Backend   │
│             │  {username, password}         │             │
│             │  ◄─────────────────────────   │             │
│             │  {token, username, role}      │             │
└─────────────┘                               └─────────────┘
       │
       │  Stocke le token (localStorage)
       ▼
┌─────────────┐    GET /api/clients/me        ┌─────────────┐
│   Frontend  │  ─────────────────────────►   │   Backend   │
│             │  Authorization: Bearer <token>│             │
│             │  ◄─────────────────────────   │             │
│             │  {id, firstName, lastName...} │             │
└─────────────┘                               └─────────────┘
```

### Rôles et Permissions

| Endpoint | ADMIN | CLIENT |
|----------|-------|--------|
| `POST /api/clients` | ✅ | ❌ |
| `GET /api/clients` | ✅ | ❌ |
| `GET /api/clients/{id}` | ✅ | ✅ (ses données seulement) |
| `GET /api/clients/me` | ✅ | ✅ |
| `PUT /api/clients/{id}` | ✅ | ❌ |
| `DELETE /api/clients/{id}` | ✅ | ❌ |
| `PUT /api/clients/{id}/suspend` | ✅ | ❌ |
| `PUT /api/clients/{id}/activate` | ✅ | ❌ |
| `POST /api/accounts` | ✅ | ❌ |
| `GET /api/accounts` | ✅ | ❌ |
| `GET /api/accounts/{accountNumber}` | ✅ | ✅ (son compte seulement) |
| `GET /api/accounts/my-accounts` | ✅ | ✅ |
| `POST /api/transactions/deposit` | ✅ | ❌ |
| `POST /api/transactions/withdraw` | ✅ | ❌ |
| `POST /api/transactions/transfer` | ✅ | ✅ (son compte source seulement) |
| `GET /api/transactions/history` | ✅ | ❌ |
| `GET /api/transactions/history/{accountNumber}` | ✅ | ✅ (son compte seulement) |
| `GET /api/transactions/statement/{accountNumber}` | ✅ | ✅ (son compte seulement) |

---

## 4. Endpoints Authentification

### 4.1 Inscription (Register)

Crée un nouveau compte utilisateur avec rôle CLIENT.

```http
POST /api/auth/register
Content-Type: application/json
```

**🔐 Authentification:** Non requise

#### Corps de la requête (RegisterRequest)

```json
{
    "username": "johndoe",
    "password": "monMotDePasse123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "birthDate": "1990-05-15",
    "gender": "M",
    "address": "123 Rue de Paris, 75001 Paris",
    "phoneNumber": "+33612345678",
    "nationality": "Française"
}
```

| Champ | Type | Obligatoire | Validation | Description |
|-------|------|-------------|------------|-------------|
| `username` | string | ✅ | NotBlank | Identifiant unique |
| `password` | string | ✅ | NotBlank | Mot de passe |
| `firstName` | string | ✅ | NotBlank | Prénom |
| `lastName` | string | ✅ | NotBlank | Nom de famille |
| `email` | string | ✅ | @Email, NotBlank | Email valide unique |
| `birthDate` | string | ❌ | Format ISO: `YYYY-MM-DD` | Date de naissance |
| `gender` | string | ❌ | - | Genre (M/F) |
| `address` | string | ❌ | - | Adresse complète |
| `phoneNumber` | string | ❌ | - | Numéro de téléphone |
| `nationality` | string | ❌ | - | Nationalité |

#### Réponse succès (200 OK)

```json
"Inscription réussie"
```

#### Réponse erreur (400 Bad Request)

```json
{
    "username": "Username obligatoire",
    "email": "Email invalide"
}
```

#### Réponse erreur (500 Internal Server Error)

```json
{
    "status": 500,
    "message": "Une erreur interne est survenue : Username déjà utilisé",
    "timestamp": "2026-01-18T15:30:00"
}
```

---

### 4.2 Connexion (Login)

Authentifie un utilisateur et retourne un token JWT.

```http
POST /api/auth/login
Content-Type: application/json
```

**🔐 Authentification:** Non requise

#### Corps de la requête (LoginRequest)

```json
{
    "username": "admin",
    "password": "admin123"
}
```

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `username` | string | ✅ | Identifiant utilisateur |
| `password` | string | ✅ | Mot de passe |

#### Réponse succès (200 OK) - LoginResponse

```json
{
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcz...",
    "username": "admin",
    "role": "ROLE_ADMIN"
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `token` | string | Token JWT à utiliser dans le header Authorization |
| `username` | string | Nom d'utilisateur |
| `role` | string | Rôle de l'utilisateur (`ROLE_ADMIN` ou `ROLE_CLIENT`) |

#### Réponse erreur (401 Unauthorized)

Identifiants incorrects.

---

## 5. Endpoints Clients

### 5.1 Créer un client

```http
POST /api/clients
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**🔐 Authentification:** ADMIN uniquement

#### Corps de la requête (ClientRequestDTO)

```json
{
    "firstName": "Marie",
    "lastName": "Dupont",
    "email": "marie.dupont@example.com",
    "birthDate": "1985-03-20",
    "gender": "F",
    "address": "45 Avenue des Champs-Élysées, 75008 Paris",
    "phoneNumber": "+33698765432",
    "nationality": "Française"
}
```

| Champ | Type | Obligatoire | Validation | Description |
|-------|------|-------------|------------|-------------|
| `firstName` | string | ✅ | NotBlank | Prénom |
| `lastName` | string | ✅ | NotBlank | Nom de famille |
| `email` | string | ✅ | @Email, NotBlank | Email unique |
| `birthDate` | string | ❌ | Format: `YYYY-MM-DD` | Date de naissance |
| `gender` | string | ❌ | - | Genre |
| `address` | string | ❌ | - | Adresse |
| `phoneNumber` | string | ❌ | - | Téléphone |
| `nationality` | string | ❌ | - | Nationalité |

#### Réponse succès (201 Created) - ClientResponseDTO

```json
{
    "id": 3,
    "firstName": "Marie",
    "lastName": "Dupont",
    "email": "marie.dupont@example.com",
    "status": "ACTIVE",
    "accounts": []
}
```

---

### 5.2 Lister tous les clients

```http
GET /api/clients
Authorization: Bearer <admin_token>
```

**🔐 Authentification:** ADMIN uniquement

#### Réponse succès (200 OK) - Array<ClientResponseDTO>

```json
[
    {
        "id": 1,
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@ega.com",
        "status": "ACTIVE",
        "accounts": []
    },
    {
        "id": 2,
        "firstName": "Toto",
        "lastName": "Boni",
        "email": "toto@ega.com",
        "status": "ACTIVE",
        "accounts": [
            {
                "id": 1,
                "accountNumber": "FR7630001007941234567890185",
                "accountType": "COURANT",
                "balance": 500000.00,
                "createdAt": "2026-01-18T10:30:00",
                "ownerName": "Toto Boni",
                "clientId": 2
            }
        ]
    }
]
```

---

### 5.3 Obtenir un client par ID

```http
GET /api/clients/{id}
Authorization: Bearer <token>
```

**🔐 Authentification:** ADMIN ou CLIENT propriétaire

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | Long (path) | ID du client |

#### Réponse succès (200 OK) - ClientResponseDTO

```json
{
    "id": 2,
    "firstName": "Toto",
    "lastName": "Boni",
    "email": "toto@ega.com",
    "status": "ACTIVE",
    "accounts": [
        {
            "id": 1,
            "accountNumber": "FR7630001007941234567890185",
            "accountType": "COURANT",
            "balance": 500000.00,
            "createdAt": "2026-01-18T10:30:00",
            "ownerName": "Toto Boni",
            "clientId": 2
        }
    ]
}
```

#### Réponse erreur (404 Not Found)

```json
{
    "status": 404,
    "message": "Client introuvable avec l'ID: 999",
    "timestamp": "2026-01-18T15:30:00"
}
```

---

### 5.4 Obtenir mon profil

```http
GET /api/clients/me
Authorization: Bearer <token>
```

**🔐 Authentification:** Tout utilisateur authentifié

#### Réponse succès (200 OK) - ClientResponseDTO

```json
{
    "id": 2,
    "firstName": "Toto",
    "lastName": "Boni",
    "email": "toto@ega.com",
    "status": "ACTIVE",
    "accounts": [
        {
            "id": 1,
            "accountNumber": "FR7630001007941234567890185",
            "accountType": "COURANT",
            "balance": 500000.00,
            "createdAt": "2026-01-18T10:30:00",
            "ownerName": "Toto Boni",
            "clientId": 2
        }
    ]
}
```

---

### 5.5 Modifier un client

```http
PUT /api/clients/{id}
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**🔐 Authentification:** ADMIN uniquement

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | Long (path) | ID du client |

#### Corps de la requête (ClientRequestDTO)

```json
{
    "firstName": "Marie-Claire",
    "lastName": "Dupont",
    "email": "marie.dupont@example.com",
    "address": "Nouvelle adresse, Paris"
}
```

#### Réponse succès (200 OK) - ClientResponseDTO

```json
{
    "id": 3,
    "firstName": "Marie-Claire",
    "lastName": "Dupont",
    "email": "marie.dupont@example.com",
    "status": "ACTIVE",
    "accounts": []
}
```

---

### 5.6 Suspendre un client

Suspend un client. Les clients suspendus ne peuvent plus effectuer d'opérations bancaires.

```http
PUT /api/clients/{id}/suspend
Authorization: Bearer <admin_token>
```

**🔐 Authentification:** ADMIN uniquement

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | Long (path) | ID du client à suspendre |

#### Réponse succès (200 OK)

```json
{
    "message": "Client suspendu avec succès"
}
```

---

### 5.7 Activer un client

Réactive un client précédemment suspendu.

```http
PUT /api/clients/{id}/activate
Authorization: Bearer <admin_token>
```

**🔐 Authentification:** ADMIN uniquement

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | Long (path) | ID du client à activer |

#### Réponse succès (200 OK)

```json
{
    "message": "Client réactivé avec succès"
}
```

---

### 5.8 Supprimer un client

```http
DELETE /api/clients/{id}
Authorization: Bearer <admin_token>
```

**🔐 Authentification:** ADMIN uniquement

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | Long (path) | ID du client à supprimer |

#### Réponse succès (204 No Content)

*Pas de corps de réponse*

---

## 6. Endpoints Comptes

### 6.1 Créer un compte

```http
POST /api/accounts
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**🔐 Authentification:** ADMIN uniquement

#### Corps de la requête (AccountRequestDTO)

```json
{
    "clientId": 2,
    "accountType": "COURANT"
}
```

| Champ | Type | Obligatoire | Validation | Description |
|-------|------|-------------|------------|-------------|
| `clientId` | Long | ✅ | NotNull | ID du client propriétaire |
| `accountType` | string | ✅ | NotNull | Type de compte: `COURANT` ou `EPARGNE` |

#### Réponse succès (201 Created) - AccountResponseDTO

```json
{
    "id": 1,
    "accountNumber": "FR7630001007941234567890185",
    "accountType": "COURANT",
    "balance": 0.00,
    "createdAt": "2026-01-18T15:30:00",
    "ownerName": "Toto Boni",
    "clientId": 2
}
```

#### Réponse erreur (400 Bad Request) - Client suspendu

```json
{
    "status": 500,
    "message": "Une erreur interne est survenue : Impossible de créer un compte pour un client suspendu",
    "timestamp": "2026-01-18T15:30:00"
}
```

---

### 6.2 Lister tous les comptes

```http
GET /api/accounts
Authorization: Bearer <admin_token>
```

**🔐 Authentification:** ADMIN uniquement

#### Réponse succès (200 OK) - Array<AccountResponseDTO>

```json
[
    {
        "id": 1,
        "accountNumber": "FR7630001007941234567890185",
        "accountType": "COURANT",
        "balance": 500000.00,
        "createdAt": "2026-01-18T10:30:00",
        "ownerName": "Toto Boni",
        "clientId": 2
    },
    {
        "id": 2,
        "accountNumber": "FR7630001007941234567890186",
        "accountType": "EPARGNE",
        "balance": 250000.00,
        "createdAt": "2026-01-18T11:00:00",
        "ownerName": "Toto Boni",
        "clientId": 2
    }
]
```

---

### 6.3 Obtenir un compte par numéro

```http
GET /api/accounts/{accountNumber}
Authorization: Bearer <token>
```

**🔐 Authentification:** ADMIN ou CLIENT propriétaire du compte

| Paramètre | Type | Description |
|-----------|------|-------------|
| `accountNumber` | string (path) | Numéro IBAN du compte |

#### Réponse succès (200 OK) - AccountResponseDTO

```json
{
    "id": 1,
    "accountNumber": "FR7630001007941234567890185",
    "accountType": "COURANT",
    "balance": 500000.00,
    "createdAt": "2026-01-18T10:30:00",
    "ownerName": "Toto Boni",
    "clientId": 2
}
```

#### Réponse erreur (404 Not Found)

```json
{
    "status": 404,
    "message": "Compte introuvable avec le numéro: FR7630001007941234567890999",
    "timestamp": "2026-01-18T15:30:00"
}
```

---

### 6.4 Obtenir mes comptes

```http
GET /api/accounts/my-accounts
Authorization: Bearer <token>
```

**🔐 Authentification:** Tout utilisateur authentifié

#### Réponse succès (200 OK) - Array<AccountResponseDTO>

```json
[
    {
        "id": 1,
        "accountNumber": "FR7630001007941234567890185",
        "accountType": "COURANT",
        "balance": 500000.00,
        "createdAt": "2026-01-18T10:30:00",
        "ownerName": "Toto Boni",
        "clientId": 2
    },
    {
        "id": 2,
        "accountNumber": "FR7630001007941234567890186",
        "accountType": "EPARGNE",
        "balance": 250000.00,
        "createdAt": "2026-01-18T11:00:00",
        "ownerName": "Toto Boni",
        "clientId": 2
    }
]
```

---

## 7. Endpoints Transactions

### 7.1 Effectuer un dépôt

```http
POST /api/transactions/deposit
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**🔐 Authentification:** ADMIN uniquement

#### Corps de la requête (TransactionRequestDTO)

```json
{
    "accountNumber": "FR7630001007941234567890185",
    "amount": 50000.00,
    "description": "Dépôt initial cash"
}
```

| Champ | Type | Obligatoire | Validation | Description |
|-------|------|-------------|------------|-------------|
| `accountNumber` | string | ✅ | NotBlank | Numéro IBAN du compte |
| `amount` | BigDecimal | ✅ | NotNull, min 0.01 | Montant à déposer |
| `description` | string | ❌ | - | Description de l'opération |

#### Réponse succès (200 OK)

```json
"Dépôt effectué avec succès"
```

#### Réponse erreur - Client suspendu

```json
{
    "status": 500,
    "message": "Une erreur interne est survenue : Opération impossible : Client suspendu",
    "timestamp": "2026-01-18T15:30:00"
}
```

---

### 7.2 Effectuer un retrait

```http
POST /api/transactions/withdraw
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**🔐 Authentification:** ADMIN uniquement

#### Corps de la requête (TransactionRequestDTO)

```json
{
    "accountNumber": "FR7630001007941234567890185",
    "amount": 10000.00,
    "description": "Retrait guichet"
}
```

| Champ | Type | Obligatoire | Validation | Description |
|-------|------|-------------|------------|-------------|
| `accountNumber` | string | ✅ | NotBlank | Numéro IBAN du compte |
| `amount` | BigDecimal | ✅ | NotNull, min 0.01 | Montant à retirer |
| `description` | string | ❌ | - | Description de l'opération |

#### Réponse succès (200 OK)

```json
"Retrait effectué avec succès"
```

#### Réponse erreur (400 Bad Request) - Solde insuffisant

```json
{
    "status": 400,
    "message": "Solde insuffisant pour le retrait sur le compte FR7630001007941234567890185",
    "timestamp": "2026-01-18T15:30:00"
}
```

---

### 7.3 Effectuer un virement

```http
POST /api/transactions/transfer
Content-Type: application/json
Authorization: Bearer <token>
```

**🔐 Authentification:** ADMIN ou CLIENT (propriétaire du compte source)

#### Corps de la requête (TransactionRequestDTO)

```json
{
    "accountNumber": "FR7630001007941234567890185",
    "targetAccountNumber": "FR7630001007941234567890186",
    "amount": 5000.00,
    "description": "Virement épargne mensuel"
}
```

| Champ | Type | Obligatoire | Validation | Description |
|-------|------|-------------|------------|-------------|
| `accountNumber` | string | ✅ | NotBlank | Numéro IBAN du compte source |
| `targetAccountNumber` | string | ✅ pour virement | NotBlank | Numéro IBAN du compte destination |
| `amount` | BigDecimal | ✅ | NotNull, min 0.01 | Montant à transférer |
| `description` | string | ❌ | - | Description de l'opération |

#### Réponse succès (200 OK)

```json
"Virement effectué avec succès"
```

#### Réponse erreur (400 Bad Request) - Solde insuffisant

```json
{
    "status": 400,
    "message": "Solde insuffisant pour le virement",
    "timestamp": "2026-01-18T15:30:00"
}
```

---

### 7.4 Liste Global des transactions (Admin)

```http
GET /api/transactions/history
Authorization: Bearer <admin_token>
```

**🔐 Authentification:** ADMIN uniquement

#### Réponse succès (200 OK) - Array<Transaction>

Identique à l'historique par compte, mais inclut toutes les transactions.

---

### 7.5 Historique des transactions

```http
GET /api/transactions/history/{accountNumber}?start={start}&end={end}
Authorization: Bearer <token>
```

**🔐 Authentification:** ADMIN ou CLIENT propriétaire du compte

| Paramètre | Type | Obligatoire | Format | Description |
|-----------|------|-------------|--------|-------------|
| `accountNumber` | string (path) | ✅ | IBAN | Numéro du compte |
| `start` | string (query) | ✅ | ISO DateTime | Date de début (ex: `2024-01-01T00:00:00`) |
| `end` | string (query) | ✅ | ISO DateTime | Date de fin (ex: `2026-12-31T23:59:59`) |

#### Exemple d'URL

```
GET /api/transactions/history/FR7630001007941234567890185?start=2024-01-01T00:00:00&end=2026-12-31T23:59:59
```

#### Réponse succès (200 OK) - Array<Transaction>

```json
[
    {
        "id": 1,
        "type": "DEPOT",
        "amount": 500000.00,
        "timestamp": "2026-01-18T10:30:00",
        "description": "Dépôt initial cash",
        "targetAccountNumber": null
    },
    {
        "id": 2,
        "type": "VIREMENT",
        "amount": 5000.00,
        "timestamp": "2026-01-18T11:00:00",
        "description": "Virement vers FR7630001007941234567890186: Virement épargne mensuel",
        "targetAccountNumber": "FR7630001007941234567890186"
    },
    {
        "id": 3,
        "type": "RETRAIT",
        "amount": 10000.00,
        "timestamp": "2026-01-18T12:00:00",
        "description": "Retrait guichet",
        "targetAccountNumber": null
    }
]
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | Long | ID de la transaction |
| `type` | string | Type: `DEPOT`, `RETRAIT`, ou `VIREMENT` |
| `amount` | BigDecimal | Montant de la transaction |
| `timestamp` | string | Date/heure de la transaction (ISO format) |
| `description` | string | Description de l'opération |
| `targetAccountNumber` | string \| null | Compte destination (pour virements) |

---

### 7.6 Relevé bancaire

Génère un relevé bancaire au format texte.

```http
GET /api/transactions/statement/{accountNumber}?start={start}&end={end}
Authorization: Bearer <token>
```

**🔐 Authentification:** ADMIN ou CLIENT propriétaire du compte

| Paramètre | Type | Obligatoire | Format | Description |
|-----------|------|-------------|--------|-------------|
| `accountNumber` | string (path) | ✅ | IBAN | Numéro du compte |
| `start` | string (query) | ✅ | ISO DateTime | Date de début |
| `end` | string (query) | ✅ | ISO DateTime | Date de fin |

#### Exemple d'URL

```
GET /api/transactions/statement/FR7630001007941234567890185?start=2024-01-01T00:00:00&end=2026-12-31T23:59:59
```

#### Réponse succès (200 OK) - String (format texte)

```
===== RELEVE BANCAIRE =====
Titulaire: Toto Boni
Compte: FR7630001007941234567890185 (COURANT)
Période: 2024-01-01T00:00:00 au 2026-12-31T23:59:59
Solde actuel: 485000.00
----------------------------
Date                 | Type       | Montant    | Description                   
2026-01-18T10:30     | DEPOT      | 500000.00  | Dépôt initial cash            
2026-01-18T11:00     | VIREMENT   | 5000.00    | Virement vers FR76...         
2026-01-18T12:00     | RETRAIT    | 10000.00   | Retrait guichet               
----------------------------
```

---

## 8. Modèles de Données (DTOs)

### 8.1 LoginRequest

```typescript
interface LoginRequest {
    username: string;  // Obligatoire
    password: string;  // Obligatoire
}
```

### 8.2 LoginResponse

```typescript
interface LoginResponse {
    token: string;     // Token JWT
    username: string;  // Nom d'utilisateur
    role: string;      // "ROLE_ADMIN" ou "ROLE_CLIENT"
}
```

### 8.3 RegisterRequest

```typescript
interface RegisterRequest {
    username: string;       // Obligatoire
    password: string;       // Obligatoire
    firstName: string;      // Obligatoire
    lastName: string;       // Obligatoire
    email: string;          // Obligatoire, format email
    birthDate?: string;     // Optionnel, format "YYYY-MM-DD"
    gender?: string;        // Optionnel
    address?: string;       // Optionnel
    phoneNumber?: string;   // Optionnel
    nationality?: string;   // Optionnel
}
```

### 8.4 ClientRequestDTO

```typescript
interface ClientRequestDTO {
    firstName: string;      // Obligatoire
    lastName: string;       // Obligatoire
    email: string;          // Obligatoire, format email
    birthDate?: string;     // Optionnel, format "YYYY-MM-DD"
    gender?: string;        // Optionnel
    address?: string;       // Optionnel
    phoneNumber?: string;   // Optionnel
    nationality?: string;   // Optionnel
}
```

### 8.5 ClientResponseDTO

```typescript
interface ClientResponseDTO {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    status: 'ACTIVE' | 'SUSPENDED';
    accounts: AccountResponseDTO[];
}
```

### 8.6 AccountRequestDTO

```typescript
interface AccountRequestDTO {
    accountType: 'COURANT' | 'EPARGNE';  // Obligatoire
    clientId: number;                      // Obligatoire
}
```

### 8.7 AccountResponseDTO

```typescript
interface AccountResponseDTO {
    id: number;
    accountNumber: string;              // Format IBAN
    accountType: 'COURANT' | 'EPARGNE';
    balance: number;                    // BigDecimal -> number
    createdAt: string;                  // Format ISO DateTime
    ownerName: string;                  // "Prénom Nom"
    clientId: number;
}
```

### 8.8 TransactionRequestDTO

```typescript
interface TransactionRequestDTO {
    accountNumber: string;           // Obligatoire
    amount: number;                  // Obligatoire, > 0.01
    description?: string;            // Optionnel
    targetAccountNumber?: string;    // Obligatoire pour virement
}
```

### 8.9 Transaction (Entité retournée par l'historique)

```typescript
interface Transaction {
    id: number;
    type: 'DEPOT' | 'RETRAIT' | 'VIREMENT';
    amount: number;
    timestamp: string;               // Format ISO DateTime
    description: string;
    targetAccountNumber?: string;    // Pour les virements
}
```

### 8.10 ErrorResponse

```typescript
interface ErrorResponse {
    status: number;      // Code HTTP (400, 404, 500, etc.)
    message: string;     // Message d'erreur
    timestamp: string;   // Date/heure de l'erreur
}
```

---

## 9. Énumérations

### 9.1 AccountType (Type de compte)

```typescript
type AccountType = 'COURANT' | 'EPARGNE';
```

| Valeur | Description |
|--------|-------------|
| `COURANT` | Compte courant |
| `EPARGNE` | Compte épargne |

### 9.2 TransactionType (Type de transaction)

```typescript
type TransactionType = 'DEPOT' | 'RETRAIT' | 'VIREMENT';
```

| Valeur | Description |
|--------|-------------|
| `DEPOT` | Dépôt d'argent sur le compte |
| `RETRAIT` | Retrait d'argent du compte |
| `VIREMENT` | Transfert entre deux comptes |

### 9.3 ClientStatus (Statut du client)

```typescript
type ClientStatus = 'ACTIVE' | 'SUSPENDED';
```

| Valeur | Description |
|--------|-------------|
| `ACTIVE` | Client actif (peut effectuer des opérations) |
| `SUSPENDED` | Client suspendu (ne peut plus effectuer d'opérations) |

### 9.4 Role (Rôle utilisateur)

```typescript
type Role = 'ADMIN' | 'CLIENT';
```

| Valeur | Description |
|--------|-------------|
| `ADMIN` | Agent bancaire avec accès complet |
| `CLIENT` | Client bancaire avec accès limité |

---

## 10. Gestion des Erreurs

### 10.1 Codes HTTP utilisés

| Code | Signification | Quand |
|------|---------------|-------|
| `200` | OK | Requête réussie |
| `201` | Created | Ressource créée (POST) |
| `204` | No Content | Suppression réussie |
| `400` | Bad Request | Validation échouée, solde insuffisant |
| `401` | Unauthorized | Token manquant ou invalide |
| `403` | Forbidden | Accès refusé (rôle insuffisant) |
| `404` | Not Found | Ressource non trouvée |
| `500` | Internal Server Error | Erreur serveur |

### 10.2 Format des erreurs

#### Erreur standard

```json
{
    "status": 404,
    "message": "Client introuvable avec l'ID: 999",
    "timestamp": "2026-01-18T15:30:00"
}
```

#### Erreurs de validation

```json
{
    "firstName": "Le nom est obligatoire",
    "email": "Email invalide",
    "amount": "Le montant doit être supérieur à 0"
}
```

#### Erreur d'accès refusé

```json
{
    "status": 403,
    "message": "Accès refusé : vous n'avez pas les droits nécessaires",
    "timestamp": "2026-01-18T15:30:00"
}
```

### 10.3 Exceptions personnalisées

| Exception | Code HTTP | Description |
|-----------|-----------|-------------|
| `ResourceNotFoundException` | 404 | Ressource non trouvée (client, compte) |
| `InsufficientBalanceException` | 400 | Solde insuffisant pour l'opération |
| `AccessDeniedException` | 403 | Accès refusé |
| `MethodArgumentNotValidException` | 400 | Erreur de validation |

---

## 11. Exemples d'Intégration Frontend

### 11.1 Service Angular - AuthService

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    username: string;
    role: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    birthDate?: string;
    gender?: string;
    address?: string;
    phoneNumber?: string;
    nationality?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private baseUrl = 'http://localhost:3000/api/auth';

    constructor(private http: HttpClient) {}

    login(request: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.baseUrl}/login`, request)
            .pipe(
                tap(response => {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('username', response.username);
                    localStorage.setItem('role', response.role);
                })
            );
    }

    register(request: RegisterRequest): Observable<string> {
        return this.http.post(`${this.baseUrl}/register`, request, { responseType: 'text' });
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    getRole(): string | null {
        return localStorage.getItem('role');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    isAdmin(): boolean {
        return this.getRole() === 'ROLE_ADMIN';
    }

    isClient(): boolean {
        return this.getRole() === 'ROLE_CLIENT';
    }
}
```

### 11.2 Intercepteur HTTP pour JWT

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    
    constructor(private authService: AuthService, private router: Router) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Ne pas ajouter le token pour les endpoints publics
        const publicEndpoints = ['/api/auth/login', '/api/auth/register'];
        const isPublic = publicEndpoints.some(url => request.url.includes(url));

        if (!isPublic) {
            const token = this.authService.getToken();
            if (token) {
                request = request.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                // Exclure les endpoints d'auth de la gestion automatique
                if (!isPublic && (error.status === 401 || error.status === 403)) {
                    this.authService.logout();
                    this.router.navigate(['/login']);
                }
                return throwError(() => error);
            })
        );
    }
}
```

### 11.3 Service Angular - ClientService

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClientRequestDTO {
    firstName: string;
    lastName: string;
    email: string;
    birthDate?: string;
    gender?: string;
    address?: string;
    phoneNumber?: string;
    nationality?: string;
}

export interface AccountResponseDTO {
    id: number;
    accountNumber: string;
    accountType: 'COURANT' | 'EPARGNE';
    balance: number;
    createdAt: string;
    ownerName: string;
    clientId: number;
}

export interface ClientResponseDTO {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    status: 'ACTIVE' | 'SUSPENDED';
    accounts: AccountResponseDTO[];
}

@Injectable({
    providedIn: 'root'
})
export class ClientService {
    private baseUrl = 'http://localhost:3000/api/clients';

    constructor(private http: HttpClient) {}

    // ADMIN: Créer un client
    createClient(client: ClientRequestDTO): Observable<ClientResponseDTO> {
        return this.http.post<ClientResponseDTO>(this.baseUrl, client);
    }

    // ADMIN: Lister tous les clients
    getAllClients(): Observable<ClientResponseDTO[]> {
        return this.http.get<ClientResponseDTO[]>(this.baseUrl);
    }

    // ADMIN ou CLIENT propriétaire: Obtenir un client par ID
    getClientById(id: number): Observable<ClientResponseDTO> {
        return this.http.get<ClientResponseDTO>(`${this.baseUrl}/${id}`);
    }

    // Tout utilisateur: Obtenir son propre profil
    getMyProfile(): Observable<ClientResponseDTO> {
        return this.http.get<ClientResponseDTO>(`${this.baseUrl}/me`);
    }

    // ADMIN: Modifier un client
    updateClient(id: number, client: ClientRequestDTO): Observable<ClientResponseDTO> {
        return this.http.put<ClientResponseDTO>(`${this.baseUrl}/${id}`, client);
    }

    // ADMIN: Suspendre un client
    suspendClient(id: number): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.baseUrl}/${id}/suspend`, {});
    }

    // ADMIN: Activer un client
    activateClient(id: number): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.baseUrl}/${id}/activate`, {});
    }

    // ADMIN: Supprimer un client
    deleteClient(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
```

### 11.4 Service Angular - AccountService

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AccountRequestDTO {
    accountType: 'COURANT' | 'EPARGNE';
    clientId: number;
}

export interface AccountResponseDTO {
    id: number;
    accountNumber: string;
    accountType: 'COURANT' | 'EPARGNE';
    balance: number;
    createdAt: string;
    ownerName: string;
    clientId: number;
}

@Injectable({
    providedIn: 'root'
})
export class AccountService {
    private baseUrl = 'http://localhost:3000/api/accounts';

    constructor(private http: HttpClient) {}

    // ADMIN: Créer un compte
    createAccount(account: AccountRequestDTO): Observable<AccountResponseDTO> {
        return this.http.post<AccountResponseDTO>(this.baseUrl, account);
    }

    // ADMIN: Lister tous les comptes
    getAllAccounts(): Observable<AccountResponseDTO[]> {
        return this.http.get<AccountResponseDTO[]>(this.baseUrl);
    }

    // ADMIN ou CLIENT propriétaire: Obtenir un compte par numéro
    getAccountByNumber(accountNumber: string): Observable<AccountResponseDTO> {
        return this.http.get<AccountResponseDTO>(`${this.baseUrl}/${accountNumber}`);
    }

    // Tout utilisateur: Obtenir ses propres comptes
    getMyAccounts(): Observable<AccountResponseDTO[]> {
        return this.http.get<AccountResponseDTO[]>(`${this.baseUrl}/my-accounts`);
    }
}
```

### 11.5 Service Angular - TransactionService

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TransactionRequestDTO {
    accountNumber: string;
    amount: number;
    description?: string;
    targetAccountNumber?: string;  // Requis pour virement
}

export interface Transaction {
    id: number;
    type: 'DEPOT' | 'RETRAIT' | 'VIREMENT';
    amount: number;
    timestamp: string;
    description: string;
    targetAccountNumber?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TransactionService {
    private baseUrl = 'http://localhost:3000/api/transactions';

    constructor(private http: HttpClient) {}

    // ADMIN: Effectuer un dépôt
    deposit(transaction: TransactionRequestDTO): Observable<string> {
        return this.http.post(`${this.baseUrl}/deposit`, transaction, { responseType: 'text' });
    }

    // ADMIN: Effectuer un retrait
    withdraw(transaction: TransactionRequestDTO): Observable<string> {
        return this.http.post(`${this.baseUrl}/withdraw`, transaction, { responseType: 'text' });
    }

    // ADMIN ou CLIENT propriétaire du compte source: Effectuer un virement
    transfer(transaction: TransactionRequestDTO): Observable<string> {
        return this.http.post(`${this.baseUrl}/transfer`, transaction, { responseType: 'text' });
    }

    // ADMIN ou CLIENT propriétaire: Historique des transactions
    getHistory(accountNumber: string, start: string, end: string): Observable<Transaction[]> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end);
        return this.http.get<Transaction[]>(`${this.baseUrl}/history/${accountNumber}`, { params });
    }

    // ADMIN ou CLIENT propriétaire: Relevé bancaire
    getStatement(accountNumber: string, start: string, end: string): Observable<string> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end);
        return this.http.get(`${this.baseUrl}/statement/${accountNumber}`, { params, responseType: 'text' });
    }
}
```

### 11.6 Exemple de composant - Dashboard Client

```typescript
import { Component, OnInit } from '@angular/core';
import { ClientService, ClientResponseDTO } from '../services/client.service';
import { AccountService, AccountResponseDTO } from '../services/account.service';
import { TransactionService, Transaction } from '../services/transaction.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-client-dashboard',
    templateUrl: './client-dashboard.component.html'
})
export class ClientDashboardComponent implements OnInit {
    profile: ClientResponseDTO | null = null;
    accounts: AccountResponseDTO[] = [];
    transactions: Transaction[] = [];
    loading = false;
    error: string | null = null;

    constructor(
        private clientService: ClientService,
        private accountService: AccountService,
        private transactionService: TransactionService
    ) {}

    ngOnInit(): void {
        this.loadProfile();
        this.loadAccounts();
    }

    loadProfile(): void {
        this.loading = true;
        this.clientService.getMyProfile()
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (profile) => {
                    this.profile = profile;
                    this.accounts = profile.accounts;
                },
                error: (err) => {
                    this.error = err.error?.message || 'Erreur lors du chargement du profil';
                }
            });
    }

    loadAccounts(): void {
        this.accountService.getMyAccounts().subscribe({
            next: (accounts) => this.accounts = accounts,
            error: (err) => console.error('Erreur chargement comptes:', err)
        });
    }

    loadTransactions(accountNumber: string): void {
        const now = new Date();
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        
        const start = yearAgo.toISOString().slice(0, 19);  // Format: 2025-01-18T15:30:00
        const end = now.toISOString().slice(0, 19);

        this.transactionService.getHistory(accountNumber, start, end).subscribe({
            next: (transactions) => this.transactions = transactions,
            error: (err) => console.error('Erreur chargement historique:', err)
        });
    }

    doTransfer(sourceAccount: string, targetAccount: string, amount: number, description: string): void {
        this.loading = true;
        this.transactionService.transfer({
            accountNumber: sourceAccount,
            targetAccountNumber: targetAccount,
            amount: amount,
            description: description
        })
        .pipe(finalize(() => this.loading = false))
        .subscribe({
            next: (message) => {
                alert(message);  // "Virement effectué avec succès"
                this.loadAccounts();  // Recharger les soldes
            },
            error: (err) => {
                this.error = err.error?.message || 'Erreur lors du virement';
            }
        });
    }
}
```

### 11.7 Gestion des erreurs dans les composants

```typescript
import { HttpErrorResponse } from '@angular/common/http';

// Utilitaire pour extraire les messages d'erreur
export function extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error) {
        // Erreur de validation (objet avec plusieurs champs)
        if (typeof error.error === 'object' && !error.error.message) {
            const messages = Object.entries(error.error)
                .map(([field, msg]) => `${field}: ${msg}`)
                .join(', ');
            return messages;
        }
        // Erreur standard avec message
        if (error.error.message) {
            return error.error.message;
        }
        // Erreur texte simple
        if (typeof error.error === 'string') {
            return error.error;
        }
    }
    // Fallback
    return `Erreur ${error.status}: ${error.statusText}`;
}

// Utilisation dans un composant
this.clientService.createClient(clientData).subscribe({
    next: (client) => {
        console.log('Client créé:', client);
    },
    error: (err: HttpErrorResponse) => {
        this.errorMessage = extractErrorMessage(err);
    }
});
```

---

## 12. Notes Importantes

### 12.1 Format des dates

- **Format attendu par l'API:** ISO 8601 sans timezone
  - Date seule: `YYYY-MM-DD` (ex: `2026-01-18`)
  - DateTime: `YYYY-MM-DDTHH:mm:ss` (ex: `2026-01-18T15:30:00`)

- **Conversion JavaScript:**
```typescript
const date = new Date();
const isoDate = date.toISOString().split('T')[0];  // "2026-01-18"
const isoDateTime = date.toISOString().slice(0, 19);  // "2026-01-18T15:30:00"
```

### 12.2 Montants et BigDecimal

- **Envoi:** Nombre standard (ex: `50000.00` ou `50000`)
- **Réception:** Nombre standard
- **Précision:** 2 décimales

### 12.3 Numéros de compte (IBAN)

- **Format:** IBAN français généré automatiquement
- **Exemple:** `FR7630001007941234567890185`
- **Génération:** Automatique via `iban4j`

### 12.4 Stockage du token

**Recommandation:** Utiliser `localStorage` pour la persistance.

```typescript
// Stockage
localStorage.setItem('token', response.token);

// Récupération
const token = localStorage.getItem('token');

// Suppression (logout)
localStorage.removeItem('token');
```

### 12.5 Endpoints publics vs protégés

- **Publics (sans token):**
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /h2-console/**`

- **Protégés (token requis):**
  - Tous les autres endpoints

### 12.6 Clients suspendus

Un client avec statut `SUSPENDED` ne peut pas :
- Créer de nouveaux comptes
- Effectuer des dépôts
- Effectuer des retraits
- Effectuer des virements

Seul un ADMIN peut suspendre/réactiver un client.

---

## 📝 Récapitulatif des Endpoints

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/api/auth/register` | Inscription | ❌ |
| `POST` | `/api/auth/login` | Connexion | ❌ |
| `POST` | `/api/clients` | Créer un client | ADMIN |
| `GET` | `/api/clients` | Liste des clients | ADMIN |
| `GET` | `/api/clients/{id}` | Détails client | ADMIN/Proprio |
| `GET` | `/api/clients/me` | Mon profil | Token |
| `PUT` | `/api/clients/{id}` | Modifier client | ADMIN |
| `PUT` | `/api/clients/{id}/suspend` | Suspendre client | ADMIN |
| `PUT` | `/api/clients/{id}/activate` | Activer client | ADMIN |
| `DELETE` | `/api/clients/{id}` | Supprimer client | ADMIN |
| `POST` | `/api/accounts` | Créer un compte | ADMIN |
| `GET` | `/api/accounts` | Liste des comptes | ADMIN |
| `GET` | `/api/accounts/{accountNumber}` | Détails compte | ADMIN/Proprio |
| `GET` | `/api/accounts/my-accounts` | Mes comptes | Token |
| `POST` | `/api/transactions/deposit` | Dépôt | ADMIN |
| `POST` | `/api/transactions/withdraw` | Retrait | ADMIN |
| `POST` | `/api/transactions/transfer` | Virement | ADMIN/Proprio Source |
| `GET` | `/api/transactions/history/{accountNumber}` | Historique | ADMIN/Proprio |
| `GET` | `/api/transactions/statement/{accountNumber}` | Relevé | ADMIN/Proprio |

---

**📧 Contact:** Pour toute question concernant cette API, veuillez contacter l'équipe de développement.

**🔄 Dernière mise à jour:** 18 Janvier 2026
