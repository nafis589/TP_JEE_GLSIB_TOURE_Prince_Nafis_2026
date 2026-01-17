import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientBankService } from '../../../shared/services/client-bank.service';
import { Transaction, Compte } from '../../../shared/models/bank.models';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-4">
      <h2 class="fw-bold mb-4 text-dark">Mon Historique de Transactions</h2>

      <!-- Filtres -->
      <div class="card border-0 shadow-sm mb-4 p-4 text-dark">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label small fw-bold">Compte</label>
            <select class="form-select" [(ngModel)]="selectedCompteId" (change)="loadTransactions()">
              <option value="">-- Choisir un compte --</option>
              <option *ngFor="let acc of accounts$ | async" [value]="acc.numeroCompte">
                {{ acc.numeroCompte }} ({{ acc.type }})
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-bold">Type d'opération</label>
            <select class="form-select" [(ngModel)]="filterType" (change)="loadTransactions()">
              <option value="">Toutes les opérations</option>
              <option value="DEPOT">Dépôts</option>
              <option value="RETRAIT">Retraits</option>
              <option value="VIREMENT">Virements</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-bold">Du</label>
            <input type="date" class="form-control" [(ngModel)]="dateDebut" (change)="loadTransactions()">
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-bold">Au</label>
            <input type="date" class="form-control" [(ngModel)]="dateFin" (change)="loadTransactions()">
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button class="btn btn-outline-secondary w-100" (click)="resetFilters()">Réinitialiser</button>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm text-dark">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4">Date</th>
                <th>Description</th>
                <th>Type</th>
                <th class="text-end pe-4">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of transactions$ | async">
                <td class="ps-4">
                  <div class="fw-bold">{{ t.date | date:'dd/MM/yyyy' }}</div>
                  <small class="text-muted">{{ t.date | date:'HH:mm' }}</small>
                </td>
                <td>
                  <div class="fw-bold">{{ t.description }}</div>
                  <div class="small text-muted" *ngIf="t.compteSource">Source: {{ t.compteSource }}</div>
                  <div class="small text-muted" *ngIf="t.compteDestination">Dest: {{ t.compteDestination }}</div>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'bg-success-subtle text-success': t.type === 'DEPOT',
                    'bg-danger-subtle text-danger': t.type === 'RETRAIT' || t.type === 'TRANSFER' || t.type === 'VIREMENT' && t.compteSource === selectedCompteId,
                    'bg-primary-subtle text-primary': t.type === 'VIREMENT' && t.compteDestination === selectedCompteId
                  }">{{ t.type }}</span>
                </td>
                <td class="text-end fw-bold pe-4 fs-5" [ngClass]="isCredit(t) ? 'text-success' : 'text-danger'">
                  {{ isCredit(t) ? '+' : '-' }}{{ t.montant | currency:'EUR' }}
                </td>
              </tr>
              <tr *ngIf="!(transactions$ | async)?.length">
                <td colspan="4" class="text-center py-5 text-muted fst-italic">
                  {{ selectedCompteId ? 'Aucune transaction trouvée pour ces critères' : 'Veuillez sélectionner un compte' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    `,
  styles: [`
    .bg-success-subtle { background-color: #e8f5e9 !important; }
    .bg-danger-subtle { background-color: #ffebee !important; }
    .bg-primary-subtle { background-color: #e3f2fd !important; }
    `]
})
export class ClientTransactionHistoryComponent implements OnInit {
  transactions$: Observable<Transaction[]> | undefined;
  accounts$: Observable<Compte[]>;
  selectedCompteId = '';
  filterType = '';
  dateDebut = '';
  dateFin = '';

  constructor(private clientBankService: ClientBankService) {
    this.accounts$ = this.clientBankService.getAccounts();
  }

  ngOnInit(): void {
    this.accounts$.subscribe(accs => {
      if (accs && accs.length > 0) {
        this.selectedCompteId = accs[0].numeroCompte;
        this.loadTransactions();
      }
    });
  }

  loadTransactions() {
    if (!this.selectedCompteId) return;

    this.transactions$ = this.clientBankService.getTransactions({
      compteId: this.selectedCompteId,
      type: this.filterType,
      dateDebut: this.dateDebut,
      dateFin: this.dateFin
    });
  }

  isCredit(t: Transaction): boolean {
    if (t.type === 'DEPOT') return true;
    if (t.type === 'VIREMENT' || t.type === 'TRANSFER') {
      return t.compteDestination === this.selectedCompteId;
    }
    return false;
  }

  resetFilters() {
    this.filterType = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.loadTransactions();
  }
}
