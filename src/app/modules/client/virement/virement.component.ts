import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientBankService } from '../../../shared/services/client-bank.service';
import { Compte } from '../../../shared/models/bank.models';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-virement',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="d-flex justify-content-between align-items-center mb-4 text-dark">
            <h2 class="fw-bold">Effectuer un Virement</h2>
            <button class="btn btn-light" routerLink="/client/dashboard">Annuler</button>
          </div>

          <div class="card border-0 shadow-sm p-4 text-dark">
            <form [formGroup]="virementForm" (ngSubmit)="onSubmit()">
              <!-- Compte Source -->
              <div class="mb-4">
                <label class="form-label fw-bold">Débiter le compte</label>
                <select class="form-select form-select-lg" formControlName="compteSource">
                  <option value="">Sélectionner le compte à débiter</option>
                  <option *ngFor="let acc of accounts$ | async" [value]="acc.numeroCompte">
                    {{ acc.numeroCompte }} ({{ acc.solde | number:'1.0-0' }} FCFA)
                  </option>
                </select>
                <div class="invalid-feedback d-block" *ngIf="isInvalid('compteSource')">
                  Veuillez choisir un compte source.
                </div>
              </div>

              <!-- Compte Destination -->
              <div class="mb-4">
                <label class="form-label fw-bold">Vers le compte</label>
                <div class="mb-2">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="destType" id="destInterne" [checked]="!isExternalTransfer" (change)="isExternalTransfer = false">
                    <label class="form-check-label" for="destInterne">Mes comptes</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input class="form-check-input" type="radio" name="destType" id="destExterne" [checked]="isExternalTransfer" (change)="isExternalTransfer = true">
                    <label class="form-check-label" for="destExterne">Autre compte (IBAN)</label>
                  </div>
                </div>
                <div class="input-group input-group-lg" *ngIf="!isExternalTransfer">
                  <span class="input-group-text bg-white"><i class="bi bi-wallet2"></i></span>
                  <select class="form-select" formControlName="compteDestination">
                    <option value="">Choisir un de mes comptes</option>
                    <option *ngFor="let acc of accounts$ | async" [value]="acc.numeroCompte" [disabled]="acc.numeroCompte === virementForm.get('compteSource')?.value">
                      {{ acc.numeroCompte }} ({{ acc.type }} - {{ acc.solde | number:'1.0-0' }} FCFA)
                    </option>
                  </select>
                </div>
                <div class="input-group input-group-lg" *ngIf="isExternalTransfer">
                  <span class="input-group-text bg-white"><i class="bi bi-bank"></i></span>
                  <input type="text" class="form-control" formControlName="compteDestination" 
                         placeholder="Ex: FR7630001007941234567890185"
                         pattern="[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}">
                </div>
                <div class="invalid-feedback d-block" *ngIf="isInvalid('compteDestination')">
                  Veuillez saisir un IBAN valide.
                </div>
              </div>


              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Montant (FCFA)</label>
                  <div class="input-group input-group-lg">
                    <span class="input-group-text">FCFA</span>
                    <input type="number" class="form-control" formControlName="montant" placeholder="0">
                  </div>
                  <div class="invalid-feedback d-block" *ngIf="isInvalid('montant')">
                    Le montant doit être supérieur à 0.
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Motif</label>
                  <input type="text" class="form-control form-control-lg" formControlName="description" placeholder="Ex: Cadeau anniversaire">
                  <div class="invalid-feedback d-block" *ngIf="isInvalid('description')">
                    Veuillez saisir un motif.
                  </div>
                </div>
              </div>

              <div class="alert alert-info border-0 rounded-4 p-3 d-flex align-items-center">
                <i class="bi bi-info-circle-fill fs-4 me-3"></i>
                <div>
                  Les virements internes sont instantanés. Les virements vers des banques tierces peuvent prendre 24h à 48h.
                </div>
              </div>

              <div class="d-grid mt-4">
                <button type="submit" class="btn btn-primary btn-lg p-3 fw-bold shadow-sm" [disabled]="virementForm.invalid || isLoading">
                  <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  Confirmer le virement
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ClientVirementComponent implements OnInit {
  virementForm: FormGroup;
  accounts$: Observable<Compte[]>;
  isLoading = false;
  isExternalTransfer = false;  // Toggle entre virement interne et externe

  constructor(
    private fb: FormBuilder,
    private clientBankService: ClientBankService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.accounts$ = this.clientBankService.getAccounts();
    this.virementForm = this.fb.group({
      compteSource: ['', Validators.required],
      compteDestination: ['', Validators.required],
      montant: [null, [Validators.required, Validators.min(1)]],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const fromId = this.route.snapshot.queryParamMap.get('from');
    if (fromId) {
      this.virementForm.patchValue({ compteSource: fromId });
    }
  }

  isInvalid(name: string) {
    const control = this.virementForm.get(name);
    return control?.invalid && (control?.dirty || control?.touched);
  }

  onSubmit() {
    if (this.virementForm.valid) {
      this.isLoading = true;
      this.clientBankService.performTransfer(this.virementForm.value).subscribe({
        next: () => {
          alert("Virement effectué avec succès !");
          this.router.navigate(['/client/dashboard']);
        },
        error: (err) => {
          alert("Erreur: " + (err.error?.message || err.message));
          this.isLoading = false;
        }
      });
    }
  }
}
