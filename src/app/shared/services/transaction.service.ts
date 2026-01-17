import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { Transaction, mapTransactionFromBackend } from '../models/bank.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TransactionService {
    private apiUrl = `${environment.apiUrl}/transactions`;

    constructor(private http: HttpClient) { }

    // Helper: Formater une date en ISO pour le backend
    private formatDateForBackend(date: string | Date | undefined): string {
        if (!date) {
            return '';
        }
        if (typeof date === 'string') {
            // Si c'est déjà au format YYYY-MM-DD, ajouter l'heure
            if (date.length === 10) {
                return `${date}T00:00:00`;
            }
            return date;
        }
        return date.toISOString();
    }

    // Admin/Client: Historique par IBAN avec dates optionnelles
    getTransactions(filters?: { compteId?: string; type?: string; dateDebut?: string; dateFin?: string; start?: string; end?: string }): Observable<Transaction[]> {
        if (filters?.compteId) {
            // Utilise l'historique par IBAN si fourni
            const start = filters.start || filters.dateDebut;
            const end = filters.end || filters.dateFin;
            return this.getHistory(filters.compteId, start, end);
        }
        // Liste générale (admin)
        return this.http.get<any[]>(this.apiUrl).pipe(
            map(items => (items || []).map(mapTransactionFromBackend))
        );
    }

    // Client: Historique par IBAN
    // Endpoint: GET /transactions/history/{IBAN}?start=...&end=...
    getHistory(iban: string, start?: string, end?: string): Observable<Transaction[]> {
        let url = `${this.apiUrl}/history/${encodeURIComponent(iban)}`;

        // Dates par défaut si non fournies
        let effectiveStart = start;
        let effectiveEnd = end;

        if (!effectiveStart) {
            // Par défaut : depuis 5 ans
            const d = new Date();
            d.setFullYear(d.getFullYear() - 5);

            // Format YYYY-MM-DD
            effectiveStart = d.toISOString().split('T')[0];
        }

        if (!effectiveEnd) {
            // Par défaut : aujourd'hui
            const d = new Date();
            effectiveEnd = d.toISOString().split('T')[0];
        }

        const params: string[] = [];
        params.push(`start=${encodeURIComponent(this.formatDateForBackend(effectiveStart))}`);
        params.push(`end=${encodeURIComponent(this.formatDateForBackend(effectiveEnd))}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        return this.http.get<any[]>(url).pipe(
            map(items => (items || []).map(mapTransactionFromBackend))
        );
    }

    // Admin: Dépôt
    // Endpoint: POST /transactions/deposit
    deposit(accountNumber: string, amount: number, description: string): Observable<Transaction> {
        return this.http.post<any>(`${this.apiUrl}/deposit`, {
            accountNumber,
            amount,
            description
        }).pipe(map(mapTransactionFromBackend));
    }

    // Admin: Retrait
    // Endpoint: POST /transactions/withdraw
    withdraw(accountNumber: string, amount: number, description: string): Observable<Transaction> {
        return this.http.post<any>(`${this.apiUrl}/withdraw`, {
            accountNumber,
            amount,
            description
        }).pipe(map(mapTransactionFromBackend));
    }

    // Client: Virement
    // Endpoint: POST /transactions/transfer
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
        if (t.type === 'DEPOT' || t.type === 'DEPOSIT') {
            return this.deposit(t.accountNumber || t.compteSource, t.amount || t.montant, t.description);
        }
        if (t.type === 'RETRAIT' || t.type === 'WITHDRAWAL') {
            return this.withdraw(t.accountNumber || t.compteSource, t.amount || t.montant, t.description);
        }
        return this.transfer(
            t.accountNumber || t.compteSource,
            t.targetAccountNumber || t.compteDestination,
            t.amount || t.montant,
            t.description
        );
    }
}

