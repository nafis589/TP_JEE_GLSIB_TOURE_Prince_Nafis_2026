import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompteService } from '../../../shared/services/compte.service';
import { TransactionService } from '../../../shared/services/transaction.service';
import { Compte } from '../../../shared/models/bank.models';
import { Observable } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-transaction-virement',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold">Nouveau Virement</h2>
      <button class="btn btn-light" [routerLink]="['/admin/transactions']">Retour</button>
    </div>

    <div class="card border-0 shadow-sm col-lg-8 mx-auto">
      <div class="card-body p-4 text-dark">
        <form [formGroup]="virementForm" (ngSubmit)="onSubmit()">
          <div class="mb-4">
            <label class="form-label fw-bold">Compte Source</label>
            <select class="form-select form-select-lg" formControlName="compteSource">
              <option value="">Sélectionner le compte à débiter</option>
              <option *ngFor="let c of comptes$ | async" [value]="c.numeroCompte">
                {{ c.numeroCompte }} - {{ c.clientNom }} ({{ c.solde | number:'1.0-0' }} FCFA)
              </option>
            </select>
          </div>

          <div class="text-center mb-4">
            <i class="bi bi-arrow-down fs-1 text-primary"></i>
          </div>

          <div class="mb-4">
            <label class="form-label fw-bold">Compte Destination</label>
            <select class="form-select form-select-lg" formControlName="compteDestination">
              <option value="">Sélectionner le compte à créditer</option>
              <option *ngFor="let c of comptes$ | async" [value]="c.numeroCompte">
                {{ c.numeroCompte }} - {{ c.clientNom }}
              </option>
            </select>
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-bold">Montant (FCFA)</label>
              <input type="number" class="form-control form-control-lg" formControlName="montant">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Motif</label>
              <input type="text" class="form-control form-control-lg" formControlName="description">
            </div>
          </div>

          <div class="d-grid mt-5">
            <button type="submit" class="btn btn-primary btn-lg fw-bold" [disabled]="virementForm.invalid || isLoading">
              <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
              Confirmer le Virement
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class TransactionVirementComponent implements OnInit {
  virementForm: FormGroup;
  comptes$: Observable<Compte[]>;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private compteService: CompteService,
    private transactionService: TransactionService,
    private router: Router
  ) {
    this.comptes$ = this.compteService.getComptes();
    this.virementForm = this.fb.group({
      compteSource: ['', Validators.required],
      compteDestination: ['', Validators.required],
      montant: [null, [Validators.required, Validators.min(1)]],
      description: ['Virement de compte à compte', Validators.required]
    }, { validators: this.differentAccountsValidator });
  }

  ngOnInit(): void { }

  differentAccountsValidator(group: FormGroup) {
    const src = group.get('compteSource')?.value;
    const dst = group.get('compteDestination')?.value;
    return src && dst && src === dst ? { sameAccounts: true } : null;
  }

  onSubmit() {
    if (this.virementForm.valid) {
      const { compteSource, compteDestination, montant, description } = this.virementForm.value;
      this.isLoading = true;

      this.transactionService.transfer(compteSource, compteDestination, montant, description).subscribe({
        next: () => {
          this.isLoading = false;
          alert("Virement effectué avec succès !");
          this.router.navigate(['/admin/transactions']);
        },
        error: (err) => {
          this.isLoading = false;
          alert("Erreur: " + (err.error?.message || err.message));
        }
      });
    }
  }
}
