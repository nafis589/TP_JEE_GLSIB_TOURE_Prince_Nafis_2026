import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Releve, mapTransactionFromBackend } from '../models/bank.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReleveService {
    private apiUrl = `${environment.apiUrl}/transactions/statement`;

    constructor(private http: HttpClient) { }

    // Helper: Formater une date en ISO pour le backend
    private formatDateForBackend(date: string | Date): string {
        if (typeof date === 'string') {
            // Si c'est déjà au format YYYY-MM-DD, ajouter l'heure
            if (date.length === 10) {
                return `${date}T00:00:00`;
            }
            return date;
        }
        // Si c'est une Date, convertir en ISO et enlever le Z
        return date.toISOString().replace('Z', '');
    }

    // Récupère le relevé
    // Endpoint: GET /transactions/statement/{IBAN}?start=...&end=...
    generateReleve(numeroCompte: string, dateDebut: string | Date, dateFin: string | Date): Observable<Releve> {
        const startFormatted = this.formatDateForBackend(dateDebut);
        const endFormatted = this.formatDateForBackend(dateFin);

        const url = `${this.apiUrl}/${encodeURIComponent(numeroCompte)}?start=${encodeURIComponent(startFormatted)}&end=${encodeURIComponent(endFormatted)}`;

        return this.http.get<any>(url, { responseType: 'text' as 'json' }).pipe(
            map(res => {
                // Le backend peut renvoyer du texte ou du JSON
                let data: any;
                if (typeof res === 'string') {
                    try {
                        data = JSON.parse(res);
                    } catch {
                        // C'est du texte brut (relevé format texte)
                        return this.parseTextStatement(res, numeroCompte, dateDebut, dateFin);
                    }
                } else {
                    data = res;
                }

                return {
                    id: data.id || 'REL' + Date.now(),
                    compteId: data.accountId || data.compteId || numeroCompte,
                    numeroCompte: data.accountNumber || numeroCompte,
                    dateDebut: typeof dateDebut === 'string' ? new Date(dateDebut) : dateDebut,
                    dateFin: typeof dateFin === 'string' ? new Date(dateFin) : dateFin,
                    soldeInitial: Number(data.initialBalance ?? data.soldeInitial ?? 0),
                    soldeFinal: Number(data.finalBalance ?? data.balance ?? data.soldeFinal ?? 0),
                    transactions: (data.transactions || []).map(mapTransactionFromBackend)
                };
            }),
            catchError(err => {
                console.error('ReleveService: Erreur génération relevé', err);
                // Retourner un relevé vide en cas d'erreur
                return of({
                    id: 'REL-ERROR',
                    compteId: numeroCompte,
                    numeroCompte: numeroCompte,
                    dateDebut: typeof dateDebut === 'string' ? new Date(dateDebut) : dateDebut,
                    dateFin: typeof dateFin === 'string' ? new Date(dateFin) : dateFin,
                    soldeInitial: 0,
                    soldeFinal: 0,
                    transactions: []
                });
            })
        );
    }

    // Parse un relevé au format texte
    private parseTextStatement(text: string, numeroCompte: string, dateDebut: string | Date, dateFin: string | Date): Releve {
        // Essayer d'extraire les informations du texte
        const lines = text.split('\n');
        let soldeInitial = 0;
        let soldeFinal = 0;

        // Chercher le solde dans le texte
        const soldeMatch = text.match(/Solde[:\s]+([0-9.,]+)/i);
        if (soldeMatch) {
            soldeFinal = parseFloat(soldeMatch[1].replace(',', '.'));
        }

        return {
            id: 'REL' + Date.now(),
            compteId: numeroCompte,
            numeroCompte: numeroCompte,
            dateDebut: typeof dateDebut === 'string' ? new Date(dateDebut) : dateDebut,
            dateFin: typeof dateFin === 'string' ? new Date(dateFin) : dateFin,
            soldeInitial,
            soldeFinal,
            transactions: []
        };
    }
}

