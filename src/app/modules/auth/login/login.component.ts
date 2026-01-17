import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper d-flex align-items-center justify-content-center min-vh-100">
      <div class="card border-0 p-4 p-md-5 shadow-sm" style="max-width: 450px; width: 100%;">
        <div class="text-center mb-5">
          <h1 class="fw-bold text-success mb-2">EgaBank</h1>
          <p class="text-muted">Accédez à votre espace sécurisé</p>
        </div>

        <!-- Alertes de Message -->
        <div *ngIf="errorMessage" class="alert alert-danger alert-dismissible fade show border-0 small mb-4" role="alert">
          <i class="bi bi-exclamation-circle me-2"></i> {{ errorMessage }}
          <button type="button" class="btn-close small" (click)="errorMessage = ''" aria-label="Close"></button>
        </div>

        <div *ngIf="successMessage" class="alert alert-success alert-dismissible fade show border-0 small mb-4" role="alert">
          <i class="bi bi-check-circle me-2"></i> {{ successMessage }}
          <button type="button" class="btn-close small" (click)="successMessage = ''" aria-label="Close"></button>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
          <div class="mb-4">
            <label class="form-label fw-bold small text-dark">Identifiant</label>
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0"><i class="bi bi-person text-muted"></i></span>
              <input type="text" 
                     formControlName="username" 
                     class="form-control border-start-0" 
                     placeholder="Votre identifiant"
                     [class.is-invalid]="submitted && f['username'].errors">
            </div>
            <div *ngIf="submitted && f['username'].errors" class="invalid-feedback d-block">
              L'identifiant est requis.
            </div>
          </div>

          <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="form-label fw-bold small text-dark mb-0">Mot de passe</label>
              <a href="#" class="text-success small text-decoration-none">Oublié ?</a>
            </div>
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0"><i class="bi bi-lock text-muted"></i></span>
              <input type="password" 
                     formControlName="password" 
                     class="form-control border-start-0" 
                     placeholder="Votre mot de passe"
                     [class.is-invalid]="submitted && f['password'].errors">
            </div>
            <div *ngIf="submitted && f['password'].errors" class="invalid-feedback d-block">
              Le mot de passe est requis.
            </div>
          </div>

          <div class="mb-4 form-check">
            <input type="checkbox" class="form-check-input" id="remember">
            <label class="form-check-label small text-muted" for="remember">Se souvenir de moi</label>
          </div>

          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-success btn-lg fw-bold shadow-sm p-3" [disabled]="loading || loginForm.invalid">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ loading ? 'Connexion...' : 'Se connecter' }}
            </button>
          </div>
        </form>

        <div class="text-center mt-5">
          <p class="text-muted small">Vous n'avez pas de compte ? 
            <a routerLink="/auth/register" class="text-success fw-bold text-decoration-none">Ouvrir un compte</a>
          </p>
        </div>

        <!-- Infos de test -->
        <div class="mt-4 p-3 bg-light rounded-3 border">
          <p class="small fw-bold mb-1 text-dark">Identifiants de test :</p>
          <ul class="small text-muted mb-0 ps-3">
            <li>Admin : admin / admin123</li>
            <li>Client : client / client123</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }
    .input-group-text {
      color: #00a86b;
      font-size: 1.1rem;
    }
    .form-control:focus {
      border-color: #00a86b;
      box-shadow: none;
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  private isBrowser: boolean;
  private loginSubscription: Subscription | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Ne pas exécuter côté serveur
    if (!this.isBrowser) {
      return;
    }

    // Vérifier si on vient d'une inscription réussie
    if (this.route.snapshot.queryParams['registered']) {
      this.successMessage = "Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.";
      if (this.route.snapshot.queryParams['username']) {
        this.loginForm.patchValue({ username: this.route.snapshot.queryParams['username'] });
      }
    }

    // Si déjà connecté, rediriger
    if (this.authService.isAuthenticated()) {
      this.redirectByRole();
    }
  }

  ngOnDestroy() {
    // Nettoyer la souscription pour éviter les fuites de mémoire
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }

  get f() { return this.loginForm.controls; }

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

    if (this.loginForm.invalid) {
      return;
    }

    // Annuler toute souscription précédente
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }

    this.loading = true;
    this.cdr.detectChanges(); // Forcer la mise à jour immédiate

    this.loginSubscription = this.authService.login(this.f['username'].value, this.f['password'].value)
      .pipe(
        finalize(() => {
          // Utiliser NgZone.run() pour garantir l'exécution dans la zone Angular
          this.ngZone.run(() => {
            console.log('FINALIZE EXECUTED - Browser:', this.isBrowser);
            this.loading = false;
            this.cdr.detectChanges(); // Forcer la mise à jour du template
          });
        })
      )
      .subscribe({
        next: (user) => {
          this.ngZone.run(() => {
            this.successMessage = "Connexion réussie !";
            this.cdr.detectChanges();
            this.redirectByRole();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Login error:', err);
            if (err.status === 0) {
              this.errorMessage = "Impossible de contacter le serveur. Veuillez vérifier votre connexion.";
            } else {
              this.errorMessage = err.error?.message || err.message || "Identifiants incorrects ou erreur serveur.";
            }
            this.cdr.detectChanges(); // Forcer la mise à jour du template
          });
        }
      });
  }

  private redirectByRole() {
    const role = this.authService.getUserRole();
    const path = role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard';
    this.router.navigate([path]);
  }
}

