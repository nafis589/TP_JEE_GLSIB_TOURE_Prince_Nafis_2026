import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper d-flex align-items-center justify-content-center bg-light py-5 min-vh-100">
      <div class="card border-0 p-4 p-md-5 my-5 shadow-sm" style="max-width: 700px; width: 100%;">
        <div class="text-center mb-5">
          <h1 class="fw-bold text-success mb-2">Devenir Client EgaBank</h1>
          <p class="text-muted">Ouvrez votre compte en quelques minutes</p>
        </div>

        <!-- Alertes de Message -->
        <div *ngIf="errorMessage" class="alert alert-danger alert-dismissible fade show border-0 small mb-4" role="alert">
          <i class="bi bi-exclamation-circle me-2"></i> {{ errorMessage }}
          <button type="button" class="btn-close" (click)="errorMessage = ''" aria-label="Close"></button>
        </div>

        <div *ngIf="successMessage" class="alert alert-success alert-dismissible fade show border-0 small mb-4" role="alert">
          <i class="bi bi-check-circle me-2"></i> {{ successMessage }}
          <button type="button" class="btn-close" (click)="successMessage = ''" aria-label="Close"></button>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="row g-3">
            <!-- Identité -->
            <div class="col-md-6 mb-2">
              <label class="form-label fw-bold small text-dark">Prénom</label>
              <input type="text" formControlName="prenom" class="form-control" placeholder="Prénom"
                     [class.is-invalid]="submitted && f['prenom'].errors">
            </div>
            <div class="col-md-6 mb-2">
              <label class="form-label fw-bold small text-dark">Nom</label>
              <input type="text" formControlName="nom" class="form-control" placeholder="Nom"
                     [class.is-invalid]="submitted && f['nom'].errors">
            </div>

            <!-- Email & Identifiant -->
            <div class="col-md-6 mb-2">
              <label class="form-label fw-bold small text-dark">Adresse E-mail</label>
              <input type="email" formControlName="email" class="form-control" placeholder="exemple@mail.com"
                     [class.is-invalid]="submitted && f['email'].errors">
            </div>
            <div class="col-md-6 mb-2">
              <label class="form-label fw-bold small text-dark">Identifiant (Username)</label>
              <input type="text" formControlName="username" class="form-control" placeholder="Identifiant"
                     [class.is-invalid]="submitted && f['username'].errors">
            </div>

            <!-- Password -->
            <div class="col-md-6 mb-2">
              <label class="form-label fw-bold small text-dark">Mot de passe</label>
              <input type="password" formControlName="password" class="form-control" placeholder="Min 6 caractères"
                     [class.is-invalid]="submitted && f['password'].errors">
            </div>
            <div class="col-md-6 mb-2">
              <label class="form-label fw-bold small text-dark">Confirmer le mot de passe</label>
              <input type="password" formControlName="confirmPassword" class="form-control" placeholder="Confirmez"
                     [class.is-invalid]="submitted && f['confirmPassword'].errors">
            </div>

            <!-- Détails supplémentaires -->
            <div class="col-md-4 mb-2">
              <label class="form-label fw-bold small text-dark">Date de naissance</label>
              <input type="date" formControlName="birthDate" class="form-control" [class.is-invalid]="submitted && f['birthDate'].errors">
            </div>
            <div class="col-md-4 mb-2">
              <label class="form-label fw-bold small text-dark">Genre</label>
              <select formControlName="gender" class="form-select">
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div class="col-md-4 mb-2">
              <label class="form-label fw-bold small text-dark">Nationalité</label>
              <input type="text" formControlName="nationality" class="form-control" placeholder="Ex: Béninaise" [class.is-invalid]="submitted && f['nationality'].errors">
            </div>

            <div class="col-md-8 mb-2">
              <label class="form-label fw-bold small text-dark">Adresse</label>
              <input type="text" formControlName="address" class="form-control" placeholder="Votre adresse physique" [class.is-invalid]="submitted && f['address'].errors">
            </div>
            <div class="col-md-4 mb-2">
              <label class="form-label fw-bold small text-dark">Téléphone</label>
              <input type="text" formControlName="phoneNumber" class="form-control" placeholder="+229..." [class.is-invalid]="submitted && f['phoneNumber'].errors">
            </div>
          </div>

          <div class="mb-3 form-check mt-3">
            <input type="checkbox" class="form-check-input" id="terms" formControlName="terms">
            <label class="form-check-label small text-muted" for="terms">
              J'accepte les <a href="#" class="text-success fw-bold text-decoration-none">Conditions Générales d'Utilisation</a>
            </label>
          </div>

          <div class="d-grid mt-4">
            <button type="submit" class="btn btn-success btn-lg fw-bold shadow-sm p-3" [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ loading ? 'Traitement en cours...' : 'Créer mon compte' }}
            </button>
          </div>
        </form>

        <div class="text-center mt-5 pt-3 border-top">
          <p class="text-muted small mb-0">Déjà client ? 
            <a routerLink="/auth/login" class="text-success fw-bold text-decoration-none">Connectez-vous ici</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }
  `]
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  private isBrowser: boolean;
  private registerSubscription: Subscription | null = null;
  private loginSubscription: Subscription | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.registerForm = this.formBuilder.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      birthDate: ['1995-10-10', Validators.required],
      gender: ['M', Validators.required],
      address: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      nationality: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Ne pas exécuter de logique côté serveur
    if (!this.isBrowser) {
      return;
    }
  }

  ngOnDestroy() {
    // Nettoyer les souscriptions pour éviter les fuites mémoire
    if (this.registerSubscription) {
      this.registerSubscription.unsubscribe();
    }
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }

  passwordMatchValidator(g: FormGroup) {
    const pass = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  get f() { return this.registerForm.controls; }

  onSubmit() {
    // Protection contre la soumission côté serveur
    if (!this.isBrowser) {
      return;
    }

    // Protection contre les doubles soumissions
    if (this.loading) {
      console.log('Soumission bloquée - déjà en cours');
      return;
    }

    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      return;
    }

    // Annuler toute souscription précédente
    if (this.registerSubscription) {
      this.registerSubscription.unsubscribe();
    }

    this.loading = true;
    this.cdr.detectChanges(); // Forcer la mise à jour immédiate

    const val = this.registerForm.value;

    const payload = {
      username: val.username,
      password: val.password,
      firstName: val.prenom,
      lastName: val.nom,
      email: val.email,
      birthDate: val.birthDate,
      gender: val.gender,
      address: val.address,
      phoneNumber: val.phoneNumber,
      nationality: val.nationality
    };

    this.registerSubscription = this.authService.register(payload)
      .pipe(
        finalize(() => {
          // Ce finalize est pour le register uniquement
          // loading sera géré dans performAutoLogin ou error
          this.ngZone.run(() => {
            console.log('REGISTER FINALIZE EXECUTED - Browser:', this.isBrowser);
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.successMessage = "Inscription réussie ! Connexion en cours...";
            this.cdr.detectChanges();
            // Enchaîner sur la connexion automatique
            this.performAutoLogin(val.username, val.password);
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.loading = false;
            console.error('Register error:', err);
            this.errorMessage = err.error?.message || err.message || "Une erreur est survenue lors de l'inscription.";
            this.cdr.detectChanges(); // Forcer la mise à jour du template
          });
        }
      });
  }

  private performAutoLogin(username: string, password: string) {
    // Annuler toute souscription précédente
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }

    this.loginSubscription = this.authService.login(username, password)
      .pipe(
        finalize(() => {
          this.ngZone.run(() => {
            console.log('AUTO-LOGIN FINALIZE EXECUTED - Browser:', this.isBrowser);
            this.loading = false;
            this.cdr.detectChanges(); // Forcer la mise à jour du template
          });
        })
      )
      .subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.cdr.detectChanges();
            this.router.navigate(['/client/dashboard']);
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Auto-login failed:', err);
            this.successMessage = "Compte créé ! Veuillez vous connecter manuellement.";
            this.cdr.detectChanges();
            setTimeout(() => {
              this.ngZone.run(() => {
                this.router.navigate(['/auth/login'], {
                  queryParams: { registered: true, username: username }
                });
              });
            }, 2000);
          });
        }
      });
  }
}

