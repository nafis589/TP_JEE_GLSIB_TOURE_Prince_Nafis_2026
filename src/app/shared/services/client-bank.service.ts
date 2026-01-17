import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Client, Compte, Transaction, Releve } from '../models/bank.models';
import { ClientService } from './client.service';
import { CompteService } from './compte.service';
import { TransactionService } from './transaction.service';
import { ReleveService } from './releve.service';

@Injectable({ providedIn: 'root' })
export class ClientBankService {

    constructor(
        private clientService: ClientService,
        private compteService: CompteService,
        private transactionService: TransactionService,
        private releveService: ReleveService
    ) { }

    getProfile(): Observable<Client> {
        return this.clientService.getClientMe();
    }

    getAccounts(): Observable<Compte[]> {
        return this.compteService.getMyAccounts();
    }

    getAccountById(id: string): Observable<Compte> {
        return this.compteService.getCompteById(id);
    }

    getTransactions(filters?: { type?: string; dateDebut?: string; dateFin?: string; compteId?: string }): Observable<Transaction[]> {
        // Pour un client, on récupère souvent l'historique global ou par compte
        // Si aucun compte n'est spécifié, on pourrait avoir besoin d'un endpoint global client
        // Pour l'instant, on mappe sur TransactionService
        return this.transactionService.getTransactions(filters);
    }

    performTransfer(transferData: any): Observable<Transaction> {
        return this.transactionService.transfer(
            transferData.compteSource,
            transferData.compteDestination,
            transferData.montant,
            transferData.description
        );
    }

    generateReleve(compteId: string, start: Date, end: Date): Observable<Releve> {
        // En supposant que compteId est ici l'IBAN ou qu'on peut l'obtenir
        // Le backend attend l'IBAN
        return this.releveService.generateReleve(
            compteId,
            start.toISOString(),
            end.toISOString()
        );
    }
}
