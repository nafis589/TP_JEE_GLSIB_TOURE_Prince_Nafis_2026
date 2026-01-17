import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Releve, mapTransactionFromBackend } from '../models/bank.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReleveService {
    private apiUrl = `${environment.apiUrl}/transactions/statement`;

    constructor(private http: HttpClient) { }

    // Récupère le relevé au format JSON pour l'affichage
    // Note: Le backend Postman montre un endpoint /transactions/statement/IBAN
    generateReleve(numeroCompte: string, dateDebut: string, dateFin: string): Observable<Releve> {
        const url = `${this.apiUrl}/${numeroCompte}?start=${dateDebut}&end=${dateFin}`;

        return this.http.get<any>(url).pipe(
            map(res => {
                // Mapping si le format diffère légèrement
                return {
                    id: res.id || 'REL' + Math.floor(Math.random() * 1000),
                    compteId: res.accountId || numeroCompte,
                    numeroCompte: numeroCompte,
                    dateDebut: new Date(dateDebut),
                    dateFin: new Date(dateFin),
                    soldeInitial: res.initialBalance || 0,
                    soldeFinal: res.finalBalance || 0,
                    transactions: (res.transactions || []).map(mapTransactionFromBackend)
                };
            })
        );
    }
}
