import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, tap, throwError } from 'rxjs';
import { Compte, mapCompteFromBackend } from '../models/bank.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompteService {
    private apiUrl = `${environment.apiUrl}/accounts`;

    constructor(private http: HttpClient) { }

    // Admin: Liste tous les comptes
    getComptes(): Observable<Compte[]> {
        console.log('[CompteService] Fetching all accounts from:', this.apiUrl);
        return this.http.get<any>(this.apiUrl).pipe(
            tap(response => console.log('[CompteService] Raw response:', response)),
            map(response => {
                // Handle different response formats
                let comptes = response;
                if (response && response.data) {
                    comptes = response.data;
                }
                if (response && response.accounts) {
                    comptes = response.accounts;
                }
                if (!comptes || !Array.isArray(comptes)) {
                    console.warn('[CompteService] Invalid response, expected array:', response);
                    return [];
                }
                return comptes.map(mapCompteFromBackend);
            }),
            catchError(err => {
                console.error('[CompteService] Error fetching accounts:', err);
                console.error('[CompteService] Error status:', err.status);
                console.error('[CompteService] Error message:', err.error?.message || err.message);
                return of([]);
            })
        );
    }

    // Client: Mes comptes
    getMyAccounts(): Observable<Compte[]> {
        console.log('[CompteService] Fetching my accounts');
        return this.http.get<any[]>(`${this.apiUrl}/my-accounts`).pipe(
            map(comptes => {
                if (!comptes || !Array.isArray(comptes)) {
                    return [];
                }
                return comptes.map(mapCompteFromBackend);
            }),
            catchError(err => {
                console.error('[CompteService] Error fetching my accounts:', err);
                return of([]);
            })
        );
    }

    // Note: L'API peut ne pas supporter ?clientId=, donc on filtre localement
    getComptesByClientId(clientId: string): Observable<Compte[]> {
        return this.getComptes().pipe(
            map(comptes => comptes.filter(c => c.clientId === clientId))
        );
    }

    // Note: L'API n'a pas d'endpoint /accounts/{id}, donc on cherche dans la liste
    getCompteById(id: string): Observable<Compte> {
        console.log('[CompteService] Getting account by id:', id);
        return this.getComptes().pipe(
            map(comptes => {
                console.log('[CompteService] All accounts:', comptes);
                // Chercher par ID ou par numéro de compte (IBAN)
                const compte = comptes.find(c => c.id === id || c.numeroCompte === id);
                if (!compte) {
                    throw new Error(`Compte avec l'ID ${id} non trouvé`);
                }
                console.log('[CompteService] Found account:', compte);
                return compte;
            })
        );
    }

    // Recherche par numéro de compte (IBAN) - utilise l'API directe
    // Endpoint: GET /accounts/{accountNumber}
    getCompteByNumero(numeroCompte: string): Observable<Compte | undefined> {
        console.log('[CompteService] Getting account by IBAN:', numeroCompte);
        return this.http.get<any>(`${this.apiUrl}/${encodeURIComponent(numeroCompte)}`).pipe(
            map(mapCompteFromBackend),
            catchError(err => {
                console.warn('[CompteService] Direct endpoint failed, using list fallback:', err);
                // Fallback: chercher dans mes comptes
                return this.getMyAccounts().pipe(
                    map(comptes => comptes.find(c => c.numeroCompte === numeroCompte))
                );
            })
        );
    }

    // Admin: Créer un compte
    createCompte(clientId: string | number, clientNom: string, type: 'COURANT' | 'EPARGNE'): Observable<Compte> {
        const body = {
            clientId: typeof clientId === 'string' ? parseInt(clientId) : clientId,
            accountType: type
        };
        console.log('[CompteService] Creating account with:', body);
        console.log('[CompteService] POST URL:', this.apiUrl);
        return this.http.post<any>(this.apiUrl, body).pipe(
            tap(response => console.log('[CompteService] Create account response:', response)),
            map(mapCompteFromBackend),
            catchError(err => {
                console.error('[CompteService] Error creating account:', err);
                console.error('[CompteService] Error status:', err.status);
                console.error('[CompteService] Error body:', err.error);
                return throwError(() => err);
            })
        );
    }

    // Admin: Supprimer un compte
    deleteCompte(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
