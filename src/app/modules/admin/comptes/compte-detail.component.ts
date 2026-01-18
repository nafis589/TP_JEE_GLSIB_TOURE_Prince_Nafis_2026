import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CompteService } from '../../../shared/services/compte.service';
import { TransactionService } from '../../../shared/services/transaction.service';
import { Compte, Transaction } from '../../../shared/models/bank.models';
import { Observable, forkJoin, of, catchError, map, switchMap, finalize } from 'rxjs';
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

    <!-- Loading State -->
    <div *ngIf="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="mt-3 text-muted">Chargement des données du compte...</p>
    </div>

    <!-- Error State -->
    <div *ngIf="errorMessage && !isLoading" class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
      <button class="btn btn-sm btn-outline-danger ms-3" (click)="loadData()">Réessayer</button>
    </div>

    <div class="row" *ngIf="compte && !isLoading && !errorMessage">
      <!-- Info Compte -->
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body p-4">
            <h5 class="fw-bold mb-3 text-dark">Informations du Compte</h5>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Numéro</span>
              <span class="fw-bold">{{ compte.numeroCompte }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Titulaire</span>
              <span class="fw-bold text-primary">{{ compte.clientNom || 'Non renseigné' }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Type</span>
              <span class="badge bg-secondary">{{ compte.type }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Créé le</span>
              <span>{{ compte.dateCreation | date:'dd/MM/yyyy' }}</span>
            </div>
            <hr>
            <div class="text-center py-3">
              <div class="text-muted small">Solde Actuel</div>
              <h2 class="fw-bold text-success display-6">{{ compte.solde | number:'1.0-0' }} FCFA</h2>
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
              <label class="form-label">Montant (FCFA)</label>
              <input type="number" class="form-control form-control-lg" [(ngModel)]="opMontant" placeholder="0">
            </div>
            <div class="mb-3 text-dark">
              <label class="form-label">Description</label>
              <input type="text" class="form-control" [(ngModel)]="opDescription" placeholder="Motif de l'opération...">
            </div>
            <div class="d-grid">
              <button class="btn btn-dark btn-lg" (click)="confirmOperation()" [disabled]="isProcessing">
                <span *ngIf="isProcessing" class="spinner-border spinner-border-sm me-2"></span>
                Confirmer
              </button>
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
                <tr *ngFor="let t of transactions">
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="rounded-circle p-2 me-3" [ngClass]="t.type === 'DEPOT' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                        <i class="bi" [ngClass]="t.type === 'DEPOT' ? 'bi-arrow-down-left' : 'bi-arrow-up-right'"></i>
                      </div>
                      <div>
                        <div class="fw-bold">{{ t.description || 'Transaction' }}</div>
                        <small class="text-muted">{{ t.date | date:'dd MMM yyyy HH:mm' }}</small>
                      </div>
                    </div>
                  </td>
                  <td class="text-end fw-bold" [class.text-success]="t.type === 'DEPOT'" [class.text-danger]="t.type !== 'DEPOT'">
                    {{ t.type === 'DEPOT' ? '+' : '-' }}{{ t.montant | number:'1.0-0' }} FCFA
                  </td>
                </tr>
                <tr *ngIf="transactions.length === 0">
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
  compte: Compte | null = null;
  transactions: Transaction[] = [];

  isLoading = false;
  isProcessing = false;
  errorMessage: string | null = null;

  currentOperation: 'DEPOT' | 'RETRAIT' | null = null;
  opMontant: number = 0;
  opDescription: string = '';

  constructor(
    private route: ActivatedRoute,
    private compteService: CompteService,
    private transactionService: TransactionService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.compteId = this.route.snapshot.paramMap.get('id');
    if (this.compteId) {
      this.loadData();
    } else {
      this.errorMessage = "ID de compte non spécifié";
    }
  }

  loadData() {
    if (!this.compteId) return;

    this.isLoading = true;
    this.errorMessage = null;
    console.log('[CompteDetail] Loading data for compte:', this.compteId);

    this.compteService.getCompteById(this.compteId).pipe(
      switchMap(compte => {
        if (!compte) {
          throw new Error('Compte non trouvé');
        }
        this.compte = compte;
        return this.transactionService.getTransactions({ compteId: compte.numeroCompte }).pipe(
          catchError(err => {
            console.warn('[CompteDetail] Error loading transactions:', err);
            return of([]);
          })
        );
      }),
      catchError(err => {
        console.error('[CompteDetail] Error loading data:', err);
        this.errorMessage = err.error?.message || err.message || 'Erreur lors du chargement du compte';
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (transactions) => {
        this.transactions = transactions || [];
      },
      error: (err) => {
        console.error('[CompteDetail] Subscribe error:', err);
        this.errorMessage = err.error?.message || err.message || 'Erreur inconnue';
      }
    });
  }

  setOperation(type: 'DEPOT' | 'RETRAIT') {
    this.currentOperation = type;
    this.opMontant = 0;
    this.opDescription = type === 'DEPOT' ? 'Dépôt espèce' : 'Retrait espèce';
  }

  confirmOperation() {
    if (!this.compte) return;
    if (this.opMontant <= 0) {
      alert("Veuillez saisir un montant valide");
      return;
    }

    this.isProcessing = true;
    const obs = this.currentOperation === 'DEPOT' ?
      this.transactionService.deposit(this.compte.numeroCompte, this.opMontant, this.opDescription) :
      this.transactionService.withdraw(this.compte.numeroCompte, this.opMontant, this.opDescription);

    obs.pipe(
      finalize(() => {
        this.isProcessing = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        alert("Opération réussie !");
        this.currentOperation = null;
        // Recharger la page pour afficher le nouveau solde
        window.location.reload();
      },
      error: (err) => {
        alert("Erreur: " + (err.error?.message || err.message));
      }
    });
  }
}

