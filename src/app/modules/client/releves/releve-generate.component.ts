import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientBankService } from '../../../shared/services/client-bank.service';
import { Compte, Releve, Client, Transaction } from '../../../shared/models/bank.models';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-client-releves',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4 d-print-none text-dark">
        <h2 class="fw-bold">Mes Relevés Bancaires</h2>
      </div>

      <!-- Sélection -->
      <div class="card border-0 shadow-sm mb-4 p-4 d-print-none text-dark">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label small fw-bold">Compte</label>
            <select class="form-select" [(ngModel)]="selectedCompteNumero">
              <option value="">Sélectionner un compte</option>
              <option *ngFor="let acc of accounts$ | async" [value]="acc.numeroCompte">
                {{ acc.numeroCompte }} ({{ acc.solde | number:'1.0-0' }} FCFA)
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-bold">Du</label>
            <input type="date" class="form-control" [(ngModel)]="dateDebut">
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-bold">Au</label>
            <input type="date" class="form-control" [(ngModel)]="dateFin">
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button class="btn btn-primary w-100" (click)="generate()" [disabled]="!selectedCompteNumero || !dateDebut || !dateFin || isLoading">
              <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              Générer
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Releve -->
      <div id="releve-print-area" *ngIf="releve" class="card border-0 shadow-sm p-5 text-dark">
        <div class="d-flex justify-content-between mb-5">
          <div>
            <h1 class="fw-bold text-primary mb-0">Egabank</h1>
            <p class="text-muted">Votre banque en ligne</p>
            <div class="mt-4">
              <h5 class="fw-bold mb-1">{{ (profile$ | async)?.prenom }} {{ (profile$ | async)?.nom }}</h5>
              <p class="mb-0">{{ (profile$ | async)?.adresse }}</p>
            </div>
          </div>
          <div class="text-end">
            <h4 class="fw-bold">RELEVÉ DE COMPTE</h4>
            <p class="mb-0 text-muted">Édité le {{ today | date:'dd/MM/yyyy' }}</p>
            <div class="mt-4">
              <p class="mb-1"><strong>N° de Relevé :</strong> {{ releve.id }}</p>
              <p class="mb-0"><strong>Période :</strong> {{ dateDebut | date:'dd/MM/yyyy' }} au {{ dateFin | date:'dd/MM/yyyy' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-light p-4 rounded-4 mb-5 d-flex justify-content-between align-items-center">
          <div>
            <span class="small text-muted d-block">IBAN du compte</span>
            <span class="fw-bold fs-5">{{ selectedCompteNumero }}</span>
          </div>
          <div class="text-end">
            <span class="small text-muted d-block">Solde au {{ dateFin | date:'dd/MM/yyyy' }}</span>
            <span class="fw-bold fs-2 text-primary">{{ releve.soldeFinal | number:'1.0-0' }} FCFA</span>
          </div>
        </div>

        <h5 class="fw-bold mb-3">Détail des opérations</h5>
        <div class="table-responsive">
          <table class="table table-sm align-middle text-dark">
            <thead class="bg-light">
              <tr>
                <th>Date</th>
                <th>Libellé</th>
                <th class="text-end" style="width: 150px;">Débit</th>
                <th class="text-end" style="width: 150px;">Crédit</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of releve.transactions">
                <td>{{ t.date | date:'dd/MM/yyyy' }}</td>
                <td>{{ t.description }}</td>
                <td class="text-end text-danger">{{ t.type !== 'DEPOT' ? (t.montant | number:'1.0-0') + ' FCFA' : '' }}</td>
                <td class="text-end text-success">{{ t.type === 'DEPOT' ? (t.montant | number:'1.0-0') + ' FCFA' : '' }}</td>
              </tr>
              <tr *ngIf="releve.transactions.length === 0">
                <td colspan="4" class="text-center py-4 text-muted fst-italic">Aucune opération</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-5 pt-5 d-flex justify-content-between align-items-center d-print-none">
          <p class="text-muted small mb-0">Ce document est un relevé officiel généré par Egabank.</p>
          <button class="btn btn-dark" (click)="print()">
            <i class="bi bi-printer me-2"></i>Imprimer le relevé
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @media print {
      body * { visibility: hidden; }
      #releve-print-area, #releve-print-area * { visibility: visible; }
      #releve-print-area { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
    }
  `]
})
export class ClientRelevésComponent implements OnInit {
  accounts$: Observable<Compte[]>;
  profile$: Observable<Client>;

  selectedCompteNumero = '';
  dateDebut = '';
  dateFin = '';

  releve: Releve | null = null;

  isLoading = false;
  today = new Date();

  constructor(private clientBankService: ClientBankService) {
    this.accounts$ = this.clientBankService.getAccounts();
    this.profile$ = this.clientBankService.getProfile();
  }

  ngOnInit(): void { }

  generate() {
    if (!this.selectedCompteNumero || !this.dateDebut || !this.dateFin) {
      return;
    }

    this.isLoading = true;
    this.clientBankService.generateReleve(
      this.selectedCompteNumero,
      this.dateDebut,
      this.dateFin
    ).subscribe({
      next: (res) => {
        this.releve = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur génération relevé:', err);
        this.isLoading = false;
        alert("Erreur lors de la génération du relevé");
      }
    });
  }

  print() {
    window.print();
  }
}
