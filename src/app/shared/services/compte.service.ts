import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Compte } from '../models/bank.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompteService {
    private apiUrl = `${environment.apiUrl}/accounts`;

    constructor(private http: HttpClient) { }

    // Admin: Liste tous les comptes (ou filter par client si le backend le supporte)
    getComptes(): Observable<Compte[]> {
        return this.http.get<Compte[]>(this.apiUrl);
    }

    // Client: Mes comptes
    getMyAccounts(): Observable<Compte[]> {
        return this.http.get<Compte[]>(`${this.apiUrl}/my-accounts`);
    }

    getComptesByClientId(clientId: string): Observable<Compte[]> {
        // Souvent GET /accounts?clientId=...
        return this.http.get<Compte[]>(`${this.apiUrl}?clientId=${clientId}`);
    }

    getCompteById(id: string): Observable<Compte> {
        return this.http.get<Compte>(`${this.apiUrl}/${id}`);
    }

    // Admin: Créer un compte
    createCompte(clientId: string | number, clientNom: string, type: 'COURANT' | 'EPARGNE'): Observable<Compte> {
        const body = {
            clientId: typeof clientId === 'string' ? parseInt(clientId) : clientId,
            accountType: type
        };
        return this.http.post<Compte>(this.apiUrl, body);
    }

    // Note: updateSolde est géré via le backend lors des transactions
}
