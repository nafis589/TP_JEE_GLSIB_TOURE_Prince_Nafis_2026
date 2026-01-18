import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../../shared/services/transaction.service';
import { Transaction } from '../../../shared/models/bank.models';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold">Historique des Transactions</h2>
      <div class="btn-group">
        <button class="btn btn-success" [routerLink]="['/admin/transactions/depot']">
          <i class="bi bi-plus-circle me-2"></i>Dépôt
        </button>
        <button class="btn btn-danger" [routerLink]="['/admin/transactions/retrait']">
          <i class="bi bi-dash-circle me-2"></i>Retrait
        </button>
        <button class="btn btn-primary" [routerLink]="['/admin/transactions/virement']">
          <i class="bi bi-arrow-left-right me-2"></i>Virement
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label small fw-bold">Type</label>
            <select class="form-select" [(ngModel)]="filterType" (change)="loadTransactions()">
              <option value="">Tous les types</option>
              <option value="DEPOT">Dépôt</option>
              <option value="RETRAIT">Retrait</option>
              <option value="VIREMENT">Virement</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label small fw-bold">Date</label>
            <input type="date" class="form-control" (change)="loadTransactions()">
          </div>
          <div class="col-md-4">
            <label class="form-label small fw-bold">Recherche Compte</label>
            <input type="text" class="form-control" placeholder="ID Compte..." [(ngModel)]="filterCompteId" (input)="loadTransactions()">
          </div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light">
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Comptes</th>
              <th class="text-end">Montant</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of transactions$ | async">
              <td>{{ t.date | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <span class="badge" [ngClass]="{
                  'bg-success-subtle text-success': t.type === 'DEPOT',
                  'bg-danger-subtle text-danger': t.type === 'RETRAIT',
                  'bg-primary-subtle text-primary': t.type === 'VIREMENT'
                }">{{ t.type }}</span>
              </td>
              <td>{{ t.description }}</td>
              <td>
                <div *ngIf="t.compteSource" class="small">
                  <span class="text-muted">De:</span> <span class="fw-bold">{{ t.compteSource }}</span>
                </div>
                <div *ngIf="t.compteDestination" class="small">
                  <span class="text-muted">Vers:</span> <span class="fw-bold">{{ t.compteDestination }}</span>
                </div>
              </td>
              <td class="text-end fw-bold" [ngClass]="t.type === 'DEPOT' ? 'text-success' : 'text-danger'">
                {{ t.type === 'DEPOT' ? '+' : '-' }}{{ t.montant | number:'1.0-0' }} FCFA
              </td>
              <td>
                <span class="badge bg-success">Réussie</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .bg-primary-subtle { background-color: #e3f2fd; }
    .bg-success-subtle { background-color: #e8f5e9; }
    .bg-danger-subtle { background-color: #ffebee; }
  `]
})
export class TransactionHistoryComponent implements OnInit {
  transactions$: Observable<Transaction[]> | undefined;
  filterType: string = '';
  filterCompteId: string = '';

  constructor(private transactionService: TransactionService) { }

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions() {
    this.transactions$ = this.transactionService.getTransactions({
      type: this.filterType,
      compteId: this.filterCompteId
    });
  }
}
