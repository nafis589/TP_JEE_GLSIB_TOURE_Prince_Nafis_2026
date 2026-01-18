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
    // Réponse API: string "Dépôt effectué avec succès"
    deposit(accountNumber: string, amount: number, description: string): Observable<string> {
        return this.http.post(`${this.apiUrl}/deposit`, {
            accountNumber,
            amount,
            description
        }, { responseType: 'text' });
    }

    // Admin: Retrait
    // Endpoint: POST /transactions/withdraw
    // Réponse API: string "Retrait effectué avec succès"
    withdraw(accountNumber: string, amount: number, description: string): Observable<string> {
        return this.http.post(`${this.apiUrl}/withdraw`, {
            accountNumber,
            amount,
            description
        }, { responseType: 'text' });
    }

    // Client/Admin: Virement
    // Endpoint: POST /transactions/transfer
    // Réponse API: string "Virement effectué avec succès"
    transfer(accountNumber: string, targetAccountNumber: string, amount: number, description: string): Observable<string> {
        return this.http.post(`${this.apiUrl}/transfer`, {
            accountNumber,
            targetAccountNumber,
            amount,
            description
        }, { responseType: 'text' });
    }

    // Pour compatibilité avec l'ancien code
    // Retourne Observable<string> car les endpoints retournent des messages texte
    createTransaction(t: any): Observable<string> {
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

