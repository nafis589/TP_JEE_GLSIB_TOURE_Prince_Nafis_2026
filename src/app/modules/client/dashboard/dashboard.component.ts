import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientBankService } from '../../../shared/services/client-bank.service';
import { Observable, map, forkJoin, switchMap, of } from 'rxjs';
import { Client, Compte, Transaction } from '../../../shared/models/bank.models';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container-fluid py-4" *ngIf="data$ | async as data">
      <div class="row mb-4">
        <div class="col-12">
          <h2 class="fw-bold text-dark">Bonjour, {{ data.profile.prenom }} 👋</h2>
          <p class="text-muted">Voici un aperçu de vos finances au {{ today | date:'dd MMMM yyyy' }}</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row g-4 mb-5">
        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-primary text-white p-4 h-100 position-relative overflow-hidden">
            <div class="position-relative z-1">
              <div class="small opacity-75 mb-1">Solde Total</div>
              <h1 class="fw-bold display-6 mb-0">{{ totalBalance | number:'1.0-0' }} FCFA</h1>
            </div>
            <i class="bi bi-wallet2 position-absolute end-0 bottom-0 opacity-25 m-n3" style="font-size: 8rem;"></i>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-white p-4 h-100">
            <div class="d-flex align-items-center mb-3">
              <div class="rounded-circle bg-light p-3 me-3">
                <i class="bi bi-bank text-primary fs-4"></i>
              </div>
              <div>
                <div class="small text-muted">Nombre de comptes</div>
                <h3 class="fw-bold mb-0">{{ data.accounts.length }}</h3>
              </div>
            </div>
            <a routerLink="/client/comptes" class="btn btn-link text-primary p-0 text-decoration-none small">Gérer mes comptes →</a>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 shadow-sm bg-white p-4 h-100">
            <div class="d-flex align-items-center mb-3">
              <div class="rounded-circle bg-success-subtle p-3 me-3">
                <i class="bi bi-calendar-check text-success fs-4"></i>
              </div>
              <div>
                <div class="small text-muted">Dernière activité</div>
                <h3 class="fw-bold mb-0">{{ data.transactions[0]?.date | date:'shortTime' }}</h3>
              </div>
            </div>
            <div class="small text-muted">Aujourd'hui</div>
          </div>
        </div>
      </div>

      <div class="row g-4 text-dark">
        <!-- Comptes List -->
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-4 text-dark">
                <h5 class="fw-bold mb-0">Mes Comptes</h5>
                <button class="btn btn-sm btn-outline-primary" routerLink="/client/comptes">Voir tous</button>
              </div>
              <div class="row g-3 text-dark">
                <div class="col-md-6" *ngFor="let acc of data.accounts">
                  <div class="p-3 border rounded-4 hover-shadow" [routerLink]="['/client/comptes', acc.id]" style="cursor: pointer;">
                    <div class="d-flex justify-content-between mb-3">
                      <span class="badge" [ngClass]="acc.type === 'COURANT' ? 'bg-info-subtle text-info' : 'bg-success-subtle text-success'">
                        {{ acc.type }}
                      </span>
                      <i class="bi bi-three-dots-vertical text-muted"></i>
                    </div>
                    <div class="fw-bold mb-1">{{ acc.numeroCompte }}</div>
                    <h4 class="fw-bold mb-0">{{ acc.solde | number:'1.0-0' }} FCFA</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4 text-dark">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="fw-bold mb-0">Transactions Récentes</h5>
                <button class="btn btn-sm btn-link text-decoration-none" routerLink="/client/transactions">Historique complet</button>
              </div>
              <div class="table-responsive">
                <table class="table align-middle text-dark">
                  <tbody>
                    <tr *ngFor="let t of data.transactions.slice(0, 5)">
                      <td style="width: 48px;">
                        <div class="rounded-circle p-2 d-flex align-items-center justify-content-center" 
                             [ngClass]="t.type === 'DEPOT' ? 'bg-success-subtle text-success' : 'bg-light text-dark'">
                          <i class="bi" [ngClass]="t.type === 'DEPOT' ? 'bi-plus-lg' : 'bi-arrow-left-right'"></i>
                        </div>
                      </td>
                      <td>
                        <div class="fw-bold">{{ t.description }}</div>
                        <small class="text-muted">{{ t.date | date:'dd MMM yyyy' }}</small>
                      </td>
                      <td class="text-end fw-bold" [ngClass]="t.type === 'DEPOT' ? 'text-success' : 'text-danger'">
                        {{ t.type === 'DEPOT' ? '+' : '-' }}{{ t.montant | number:'1.0-0' }} FCFA
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar / Actions -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm mb-4 bg-dark text-white p-4">
            <h5 class="fw-bold mb-4">Actions Rapides</h5>
            <div class="d-grid gap-3">
              <button class="btn btn-primary btn-lg" routerLink="/client/virement">
                <i class="bi bi-send me-2"></i> Faire un virement
              </button>
              <button class="btn btn-outline-light btn-lg" routerLink="/client/releves">
                <i class="bi bi-file-earmark-pdf me-2"></i> Télécharger un relevé
              </button>
            </div>
          </div>

          <div class="card border-0 shadow-sm p-4">
            <h5 class="fw-bold mb-3 text-dark">Conseil du jour</h5>
            <p class="text-muted small">Épargnez au moins 10% de vos revenus mensuels pour vos projets futurs.</p>
            <div class="d-flex align-items-center">
              <div class="flex-grow-1 bg-light rounded-pill" style="height: 8px;">
                <div class="bg-success rounded-pill" style="height: 8px; width: 65%;"></div>
              </div>
              <span class="ms-2 small fw-bold text-success">65%</span>
            </div>
            <small class="text-muted mt-2 d-block">Objectif "Épargne Projet" en vue !</small>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container-fluid { max-width: 1400px; }
    .card { border-radius: 20px; }
    .bg-info-subtle { background-color: #e0f7fa !important; }
    .bg-success-subtle { background-color: #e8f5e9 !important; }
    .hover-shadow { transition: all 0.2s; }
    .hover-shadow:hover { box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.1); transform: translateY(-2px); }
  `]
})
export class ClientDashboardComponent implements OnInit {
  data$: Observable<{ profile: Client, accounts: Compte[], transactions: Transaction[] }> | undefined;
  today = new Date();
  totalBalance = 0;

  constructor(private clientBankService: ClientBankService) { }

  ngOnInit(): void {
    // On récupère le profil et les comptes en parallèle
    this.data$ = forkJoin({
      profile: this.clientBankService.getProfile(),
      accounts: this.clientBankService.getAccounts()
    }).pipe(
      switchMap((res: { profile: Client, accounts: Compte[] }) => {
        this.totalBalance = res.accounts.reduce((sum: number, acc: Compte) => sum + acc.solde, 0);

        // Si le client a des comptes, on récupère les transactions du premier compte
        // Sinon on retourne une liste vide
        const transObs = res.accounts.length > 0
          ? this.clientBankService.getTransactions({ compteId: res.accounts[0].numeroCompte })
          : of([]);

        return transObs.pipe(
          map(transactions => ({
            ...res,
            transactions
          }))
        );
      })
    );
  }
}
