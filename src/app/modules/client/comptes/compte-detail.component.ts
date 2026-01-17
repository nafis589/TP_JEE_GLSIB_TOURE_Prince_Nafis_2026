import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientBankService } from '../../../shared/services/client-bank.service';
import { Compte, Transaction } from '../../../shared/models/bank.models';
import { Observable, forkJoin, map, of } from 'rxjs';

@Component({
  selector: 'app-client-compte-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container py-4" *ngIf="data$ | async as data">
      <div class="d-flex justify-content-between align-items-center mb-4 text-dark">
        <div>
          <h2 class="fw-bold mb-1">Détail du Compte</h2>
          <p class="text-muted mb-0">{{ data.compte.numeroCompte }}</p>
        </div>
        <button class="btn btn-light" routerLink="/client/comptes">Retour</button>
      </div>

      <div class="row g-4 text-dark">
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm p-4 h-100">
            <div class="text-center mb-4">
              <div class="small text-muted mb-1">Solde Actuel</div>
              <h1 class="fw-bold text-primary display-5">{{ data.compte.solde | currency: data.compte.devise }}</h1>
              <span class="badge bg-success-subtle text-success">Compte Actif</span>
            </div>
            <hr>
            <div class="mb-3">
              <label class="small text-muted d-block">Type de compte</label>
              <div class="fw-bold">{{ data.compte.type }}</div>
            </div>
            <div class="mb-3">
              <label class="small text-muted d-block">Date d'ouverture</label>
              <div class="fw-bold">{{ data.compte.dateCreation | date:'longDate' }}</div>
            </div>
            <div class="mb-3">
              <label class="small text-muted d-block">Titulaire</label>
              <div class="fw-bold">{{ data.compte.clientNom }}</div>
            </div>
            <div class="d-grid mt-auto">
              <button class="btn btn-primary" [routerLink]="['/client/virement']" [queryParams]="{from: data.compte.numeroCompte}">
                Faire un virement depuis ce compte
              </button>
            </div>
          </div>
        </div>

        <div class="col-lg-8 text-dark">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header bg-white border-0 py-3 ps-4 d-flex justify-content-between align-items-center">
              <h5 class="fw-bold mb-0">Historique des opérations</h5>
              <button class="btn btn-sm btn-outline-secondary" routerLink="/client/releves">Générer relevé</button>
            </div>
            <div class="table-responsive">
              <table class="table align-middle text-dark">
                <tbody>
                  <tr *ngFor="let t of data.transactions">
                    <td class="ps-4" style="width: 48px;">
                      <div class="rounded-circle p-2 d-flex align-items-center justify-content-center" 
                           [ngClass]="t.type === 'DEPOT' ? 'bg-success-subtle text-success' : 'bg-light'">
                        <i class="bi" [ngClass]="t.type === 'DEPOT' ? 'bi-plus-lg' : 'bi-arrow-left-right'"></i>
                      </div>
                    </td>
                    <td>
                      <div class="fw-bold">{{ t.description }}</div>
                      <small class="text-muted">{{ t.date | date:'dd MMM yyyy' }}</small>
                    </td>
                    <td class="text-end fw-bold pe-4" [ngClass]="t.type === 'DEPOT' ? 'text-success' : 'text-danger'">
                      {{ t.type === 'DEPOT' ? '+' : '-' }}{{ t.montant | currency: data.compte.devise }}
                    </td>
                  </tr>
                  <tr *ngIf="data.transactions.length === 0">
                    <td colspan="3" class="text-center py-5 text-muted fst-italic">Aucune transaction pour ce compte</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-success-subtle { background-color: #e8f5e9 !important; }
  `]
})
export class ClientCompteDetailComponent implements OnInit {
  data$: Observable<{ compte: Compte, transactions: Transaction[] }> | undefined;

  constructor(
    private route: ActivatedRoute,
    private clientBankService: ClientBankService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.clientBankService.getAccountById(id).subscribe(compte => {
        if (compte) {
          this.data$ = forkJoin({
            compte: of(compte),
            transactions: this.clientBankService.getTransactions({ compteId: compte.numeroCompte })
          });
        }
      });
    }
  }
}
