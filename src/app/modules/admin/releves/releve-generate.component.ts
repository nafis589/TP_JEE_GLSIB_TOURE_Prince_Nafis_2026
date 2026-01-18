import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompteService } from '../../../shared/services/compte.service';
import { TransactionService } from '../../../shared/services/transaction.service';
import { ReleveService } from '../../../shared/services/releve.service';
import { Compte, Releve } from '../../../shared/models/bank.models';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-releve-generate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4 d-print-none">
      <h2 class="fw-bold text-dark">Génération de Relevé</h2>
    </div>

    <!-- Filtres de génération -->
    <div class="card border-0 shadow-sm mb-4 d-print-none">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label small fw-bold text-dark">Compte</label>
            <select class="form-select" [(ngModel)]="selectedCompteId">
              <option value="">Sélectionner un compte</option>
              <option *ngFor="let c of comptes$ | async" [value]="c.id">
                {{ c.numeroCompte }} ({{ c.clientNom }})
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-bold text-dark">Date début</label>
            <input type="date" class="form-control" [(ngModel)]="dateDebut">
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-bold text-dark">Date fin</label>
            <input type="date" class="form-control" [(ngModel)]="dateFin">
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button class="btn btn-primary w-100" (click)="generate()" [disabled]="!selectedCompteId || !dateDebut || !dateFin">
              Générer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Aperçu du relevé -->
    <div id="releve-preview" *ngIf="releve" class="card border-0 shadow-sm p-5">
      <div class="d-flex justify-content-between align-items-start mb-5">
        <div>
          <h1 class="fw-bold text-success">EgaBank</h1>
          <p class="text-muted mb-0">Relevé de Compte Officiel</p>
        </div>
        <div class="text-end text-dark">
          <h5 class="fw-bold mb-1">Relevé N° {{ releve.id }}</h5>
          <p class="mb-0">Période du {{ releve.dateDebut | date:'dd/MM/yyyy' }} au {{ releve.dateFin | date:'dd/MM/yyyy' }}</p>
        </div>
      </div>

      <div class="row mb-5 text-dark">
        <div class="col-6">
          <p class="mb-1 text-muted small fw-bold">TITULAIRE DU COMPTE</p>
          <p class="fw-bold mb-0">Client ID: {{ currentCompte?.clientId }}</p>
          <p class="mb-0">{{ currentCompte?.clientNom }}</p>
        </div>
        <div class="col-6 text-end">
          <p class="mb-1 text-muted small fw-bold">COORDONNÉES BANCAIRES</p>
          <p class="fw-bold mb-0">IBAN: {{ currentCompte?.numeroCompte }}</p>
          <p class="mb-0">Devise: {{ currentCompte?.devise }}</p>
        </div>
      </div>

      <div class="bg-light p-4 rounded mb-5 d-flex justify-content-around text-center text-dark">
        <div>
          <div class="small text-muted mb-1">Solde Initial</div>
          <div class="h4 fw-bold mb-0">{{ releve.soldeInitial | number:'1.0-0' }} FCFA</div>
        </div>
        <div class="vr"></div>
        <div>
          <div class="small text-muted mb-1">Mouvement Net</div>
          <div class="h4 fw-bold mb-0" [class.text-success]="netMovement >= 0" [class.text-danger]="netMovement < 0">
            {{ netMovement >= 0 ? '+' : '' }}{{ netMovement | number:'1.0-0' }} FCFA
          </div>
        </div>
        <div class="vr"></div>
        <div>
          <div class="small text-muted mb-1">Solde Final</div>
          <div class="h4 fw-bold mb-0 text-success">{{ releve.soldeFinal | number:'1.0-0' }} FCFA</div>
        </div>
      </div>

      <table class="table table-sm align-middle mb-5 text-dark">
        <thead class="bg-light">
          <tr>
            <th>Date</th>
            <th>Libellé</th>
            <th class="text-end">Débit</th>
            <th class="text-end">Crédit</th>
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
            <td colspan="4" class="text-center py-5 text-muted fst-italic">Aucune opération sur cette période</td>
          </tr>
        </tbody>
      </table>

      <div class="mt-auto d-flex justify-content-between align-items-center d-print-none text-dark">
        <p class="text-muted small mb-0">Généré le {{ today | date:'dd/MM/yyyy HH:mm' }}</p>
        <button class="btn btn-dark" (click)="print()">
          <i class="bi bi-printer me-2"></i>Imprimer le relevé
        </button>
      </div>
    </div>
  `,
  styles: [`
    @media print {
      body * { visibility: hidden; }
      #releve-preview, #releve-preview * { visibility: visible; }
      #releve-preview { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
    }
  `]
})
export class ReleveGenerateComponent implements OnInit {
  comptes$: Observable<Compte[]>;
  selectedCompteId: string = '';
  dateDebut: string = '';
  dateFin: string = '';

  releve: Releve | null = null;
  currentCompte: Compte | null = null;
  today = new Date();

  constructor(
    private compteService: CompteService,
    private transactionService: TransactionService,
    private releveService: ReleveService
  ) {
    this.comptes$ = this.compteService.getComptes();
  }

  ngOnInit(): void { }

  get netMovement(): number {
    if (!this.releve) return 0;
    return this.releve.transactions.reduce((acc, t) => acc + (t.type === 'DEPOT' ? t.montant : -t.montant), 0);
  }

  generate() {
    this.compteService.getCompteById(this.selectedCompteId).subscribe(compte => {
      if (compte) {
        this.currentCompte = compte;
        this.releveService.generateReleve(
          compte.numeroCompte,
          this.dateDebut,
          this.dateFin
        ).subscribe(res => {
          this.releve = res;
        });
      }
    });
  }

  print() {
    window.print();
  }
}
