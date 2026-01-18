import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Transaction, mapTransactionFromBackend } from '../models/bank.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BankService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    // Dashboard Admin : On essaie d'agréger les données si /admin/stats n'existe pas
    getDashboardStats(): Observable<any[]> {
        return forkJoin({
            clients: this.http.get<any[]>(`${this.apiUrl}/clients`).pipe(catchError(() => of([]))),
            accounts: this.http.get<any[]>(`${this.apiUrl}/accounts`).pipe(catchError(() => of([]))),
            transactions: this.http.get<any[]>(`${this.apiUrl}/transactions`).pipe(catchError(() => of([])))
        }).pipe(
            map(res => {
                const totalBalance = res.accounts.reduce((sum, acc) => sum + (acc.solde || 0), 0);
                return [
                    { label: 'Total Clients', value: res.clients.length },
                    { label: 'Total Comptes', value: res.accounts.length },
                    { label: 'Total Transactions', value: res.transactions.length },
                    { label: 'Capital Total', value: totalBalance.toLocaleString() + ' fcfa' }
                ];
            })
        );
    }

    getRecentTransactions(): Observable<Transaction[]> {
        // Liste globale des transactions (Admin)
        return this.http.get<any[]>(`${this.apiUrl}/transactions`).pipe(
            map(items => (items || []).slice(0, 10).map(mapTransactionFromBackend)),
            catchError(() => of([]))
        );
    }
}
