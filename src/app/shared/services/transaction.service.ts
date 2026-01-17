import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Transaction, mapTransactionFromBackend } from '../models/bank.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TransactionService {
    private apiUrl = `${environment.apiUrl}/transactions`;

    constructor(private http: HttpClient) { }

    // Admin: Historique général ou filtré
    getTransactions(filters?: any): Observable<Transaction[]> {
        let url = this.apiUrl;
        if (filters?.compteId) {
            // Utilise l'historique par IBAN si fourni
            return this.getHistory(filters.compteId, filters.start, filters.end);
        }
        return this.http.get<any[]>(url).pipe(
            map(items => items.map(mapTransactionFromBackend))
        );
    }

    // Client: Historique par IBAN
    getHistory(iban: string, start?: string, end?: string): Observable<Transaction[]> {
        let url = `${this.apiUrl}/history/${iban}`;
        if (start && end) {
            url += `?start=${start}&end=${end}`;
        }
        return this.http.get<any[]>(url).pipe(
            map(items => items.map(mapTransactionFromBackend))
        );
    }

    // Admin: Dépôt
    deposit(accountNumber: string, amount: number, description: string): Observable<Transaction> {
        return this.http.post<any>(`${this.apiUrl}/deposit`, {
            accountNumber,
            amount,
            description
        }).pipe(map(mapTransactionFromBackend));
    }

    // Admin: Retrait
    withdraw(accountNumber: string, amount: number, description: string): Observable<Transaction> {
        return this.http.post<any>(`${this.apiUrl}/withdraw`, {
            accountNumber,
            amount,
            description
        }).pipe(map(mapTransactionFromBackend));
    }

    // Client: Virement
    transfer(accountNumber: string, targetAccountNumber: string, amount: number, description: string): Observable<Transaction> {
        return this.http.post<any>(`${this.apiUrl}/transfer`, {
            accountNumber,
            targetAccountNumber,
            amount,
            description
        }).pipe(map(mapTransactionFromBackend));
    }

    // Pour compatibilité avec l'ancien code
    createTransaction(t: any): Observable<Transaction> {
        if (t.type === 'DEPOT') return this.deposit(t.accountNumber, t.montant, t.description);
        if (t.type === 'RETRAIT') return this.withdraw(t.accountNumber, t.montant, t.description);
        return this.transfer(t.accountNumber, t.compteDestination, t.montant, t.description);
    }
}
