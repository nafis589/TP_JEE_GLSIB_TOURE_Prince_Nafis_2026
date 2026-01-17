import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CompteService } from '../../../shared/services/compte.service';
import { TransactionService } from '../../../shared/services/transaction.service';
import { Compte, Transaction } from '../../../shared/models/bank.models';
import { Observable, forkJoin, of } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-compte-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4 text-dark">
      <h2 class="fw-bold">Gestion du Compte</h2>
      <button class="btn btn-light" [routerLink]="['/admin/comptes']">Retour</button>
    </div>

    <div class="row" *ngIf="data$ | async as data">
      <!-- Info Compte -->
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body p-4">
            <h5 class="fw-bold mb-3 text-dark">Informations du Compte</h5>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Numéro</span>
              <span class="fw-bold">{{ data.compte.numeroCompte }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Titulaire</span>
              <span class="fw-bold text-primary">{{ data.compte.clientNom }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Type</span>
              <span class="badge bg-secondary">{{ data.compte.type }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Créé le</span>
              <span>{{ data.compte.dateCreation | date:'dd/MM/yyyy' }}</span>
            </div>
            <hr>
            <div class="text-center py-3">
              <div class="text-muted small">Solde Actuel</div>
              <h2 class="fw-bold text-success display-6">{{ data.compte.solde | currency:'EUR' }}</h2>
            </div>
          </div>
        </div>

        <!-- Opérations Rapides -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body p-4 text-dark">
            <h5 class="fw-bold mb-3">Opérations</h5>
            <div class="row g-2">
              <div class="col-6">
                <button class="btn btn-success w-100 py-3" (click)="setOperation('DEPOT')">
                  <i class="bi bi-plus-circle mb-2 d-block fs-3"></i> Dépôt
                </button>
              </div>
              <div class="col-6">
                <button class="btn btn-danger w-100 py-3" (click)="setOperation('RETRAIT')">
                  <i class="bi bi-dash-circle mb-2 d-block fs-3"></i> Retrait
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulaire Opération & Transactions -->
      <div class="col-lg-7">
        <!-- Formulaire dynamique -->
        <div class="card border-0 shadow-sm mb-4" *ngIf="currentOperation">
          <div class="card-body p-4 text-dark">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold mb-0">Effectuer un {{ currentOperation }}</h5>
              <button class="btn-close" (click)="currentOperation = null"></button>
            </div>
            <div class="mb-3 text-dark">
              <label class="form-label">Montant (EUR)</label>
              <input type="number" class="form-control form-control-lg" [(ngModel)]="opMontant" placeholder="0.00">
            </div>
            <div class="mb-3 text-dark">
              <label class="form-label">Description</label>
              <input type="text" class="form-control" [(ngModel)]="opDescription" placeholder="Motif de l'opération...">
            </div>
            <div class="d-grid">
              <button class="btn btn-dark btn-lg" (click)="confirmOperation(data.compte)">Confirmer</button>
            </div>
          </div>
        </div>

        <!-- Dernières Transactions -->
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white py-3 border-0">
            <h5 class="fw-bold mb-0 text-dark">Historique récent</h5>
          </div>
          <div class="table-responsive">
            <table class="table align-middle">
              <tbody>
                <tr *ngFor="let t of data.transactions">
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="rounded-circle p-2 me-3" [ngClass]="t.type === 'DEPOT' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                        <i class="bi" [ngClass]="t.type === 'DEPOT' ? 'bi-arrow-down-left' : 'bi-arrow-up-right'"></i>
                      </div>
                      <div>
                        <div class="fw-bold">{{ t.description }}</div>
                        <small class="text-muted">{{ t.date | date:'dd MMM yyyy HH:mm' }}</small>
                      </div>
                    </div>
                  </td>
                  <td class="text-end fw-bold" [class.text-success]="t.type === 'DEPOT'" [class.text-danger]="t.type !== 'DEPOT'">
                    {{ t.type === 'DEPOT' ? '+' : '-' }}{{ t.montant | currency:'EUR' }}
                  </td>
                </tr>
                <tr *ngIf="data.transactions.length === 0">
                  <td class="text-center text-muted py-4">Aucune transaction</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-success-subtle { background-color: #e8f5e9; }
    .bg-danger-subtle { background-color: #ffebee; }
  `]
})
export class CompteDetailComponent implements OnInit {
  compteId: string | null = null;
  data$: Observable<{ compte: Compte, transactions: Transaction[] }> | undefined;

  currentOperation: 'DEPOT' | 'RETRAIT' | null = null;
  opMontant: number = 0;
  opDescription: string = '';

  constructor(
    private route: ActivatedRoute,
    private compteService: CompteService,
    private transactionService: TransactionService
  ) { }

  ngOnInit(): void {
    this.compteId = this.route.snapshot.paramMap.get('id');
    if (this.compteId) {
      this.loadData();
    }
  }

  loadData() {
    if (this.compteId) {
      this.compteService.getCompteById(this.compteId).subscribe(compte => {
        if (compte) {
          this.data$ = forkJoin({
            compte: of(compte),
            transactions: this.transactionService.getTransactions({ compteId: compte.numeroCompte })
          }) as Observable<{ compte: Compte, transactions: Transaction[] }>;
        }
      });
    }
  }

  setOperation(type: 'DEPOT' | 'RETRAIT') {
    this.currentOperation = type;
    this.opMontant = 0;
    this.opDescription = type === 'DEPOT' ? 'Dépôt espèce' : 'Retrait espèce';
  }

  confirmOperation(compte: Compte) {
    if (this.opMontant <= 0) return alert("Veuillez saisir un montant valide");

    const obs = this.currentOperation === 'DEPOT' ?
      this.transactionService.deposit(compte.numeroCompte, this.opMontant, this.opDescription) :
      this.transactionService.withdraw(compte.numeroCompte, this.opMontant, this.opDescription);

    obs.subscribe({
      next: () => {
        alert("Opération réussie !");
        this.currentOperation = null;
        this.loadData();
      },
      error: (err) => {
        alert("Erreur: " + (err.error?.message || err.message));
      }
    });
  }
}
