import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService } from '../../../shared/services/client.service';
import { CompteService } from '../../../shared/services/compte.service';
import { Client, Compte } from '../../../shared/models/bank.models';
import { forkJoin, catchError, of, finalize, map } from 'rxjs';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold">Détails du Client</h2>
      <div>
        <button class="btn btn-light me-2" [routerLink]="['/admin/clients']">Retour</button>
        <button class="btn btn-primary" [routerLink]="['/admin/clients/modifier', clientId]">Modifier</button>
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <p class="mt-3 text-muted">Chargement des données du client...</p>
    </div>

    <!-- Error State -->
    <div *ngIf="errorMessage && !isLoading" class="alert alert-danger">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ errorMessage }}
      <button class="btn btn-sm btn-outline-danger ms-3" (click)="loadData()">Réessayer</button>
    </div>

    <div class="row" *ngIf="client && !isLoading && !errorMessage">
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body text-center p-4">
            <div class="avatar-lg bg-primary text-white rounded-circle mx-auto mb-3">
              {{ client.prenom ? client.prenom[0] : '?' }}{{ client.nom ? client.nom[0] : '?' }}
            </div>
            <h4 class="fw-bold mb-1">{{ client.prenom }} {{ client.nom }}</h4>
            <span class="badge" [ngClass]="client.statut === 'Actif' ? 'bg-success' : 'bg-danger'">
              {{ client.statut }}
            </span>
            <hr>
            <div class="text-start">
              <p><i class="bi bi-envelope me-2"></i> {{ client.email || 'Non renseigné' }}</p>
              <p><i class="bi bi-telephone me-2"></i> {{ client.telephone || 'Non renseigné' }}</p>
              <p><i class="bi bi-geo-alt me-2"></i> {{ client.adresse || 'Non renseigné' }}</p>
              <p><i class="bi bi-calendar me-2"></i> Né le {{ client.dateNaissance | date:'dd/MM/yyyy' }}</p>
              <p><i class="bi bi-flag me-2"></i> {{ client.nationalite || 'Non renseigné' }}</p>
            </div>
            <div class="d-grid gap-2">
              <button class="btn" 
                      [ngClass]="client.statut === 'Actif' ? 'btn-outline-danger' : 'btn-outline-success'" 
                      (click)="toggleStatut()"
                      [disabled]="isTogglingStatus">
                <span *ngIf="isTogglingStatus" class="spinner-border spinner-border-sm me-2"></span>
                {{ client.statut === 'Actif' ? 'Suspendre' : 'Réactiver' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
            <h5 class="fw-bold mb-0">Comptes Bancaires</h5>
            <button class="btn btn-sm btn-success" (click)="openCreateCompteModal()">Créer un compte</button>
          </div>
          <div class="table-responsive">
            <table class="table align-middle">
              <thead>
                <tr>
                  <th>Numéro de compte</th>
                  <th>Type</th>
                  <th>Solde</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let compte of comptes">
                  <td>{{ compte.numeroCompte }}</td>
                  <td>
                    <span class="badge bg-info-subtle text-info">{{ compte.type }}</span>
                  </td>
                  <td class="fw-bold">{{ compte.solde | number:'1.0-0' }} FCFA</td>
                  <td>
                    <button class="btn btn-sm btn-light" [routerLink]="['/admin/comptes', compte.id]">
                      Voir
                    </button>
                  </td>
                </tr>
                <tr *ngIf="comptes.length === 0">
                  <td colspan="4" class="text-center text-muted py-4">Aucun compte pour ce client</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Création de Compte -->
    <div class="modal fade" [class.show]="showModal" [style.display]="showModal ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">Créer un nouveau compte</h5>
            <button type="button" class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body pt-2">
            <p class="text-muted mb-4">Sélectionnez le type de compte à créer pour <strong>{{ client?.prenom }} {{ client?.nom }}</strong></p>
            
            <div class="d-grid gap-3">
              <button class="btn btn-outline-primary btn-lg d-flex align-items-center justify-content-between p-3" 
                      (click)="createCompteWithType('COURANT')"
                      [disabled]="isCreating">
                <div class="d-flex align-items-center">
                  <div class="rounded-circle bg-primary-subtle p-3 me-3">
                    <i class="bi bi-wallet2 text-primary fs-4"></i>
                  </div>
                  <div class="text-start">
                    <div class="fw-bold">Compte Courant</div>
                    <small class="text-muted">Pour les opérations quotidiennes</small>
                  </div>
                </div>
                <i class="bi bi-chevron-right"></i>
              </button>
              
              <button class="btn btn-outline-success btn-lg d-flex align-items-center justify-content-between p-3" 
                      (click)="createCompteWithType('EPARGNE')"
                      [disabled]="isCreating">
                <div class="d-flex align-items-center">
                  <div class="rounded-circle bg-success-subtle p-3 me-3">
                    <i class="bi bi-piggy-bank text-success fs-4"></i>
                  </div>
                  <div class="text-start">
                    <div class="fw-bold">Compte Épargne</div>
                    <small class="text-muted">Pour faire fructifier votre argent</small>
                  </div>
                </div>
                <i class="bi bi-chevron-right"></i>
              </button>
            </div>

            <div *ngIf="isCreating" class="text-center mt-3">
              <div class="spinner-border spinner-border-sm text-primary me-2"></div>
              <span>Création en cours...</span>
            </div>

            <div *ngIf="createError" class="alert alert-danger mt-3 mb-0">
              {{ createError }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="showModal" (click)="closeModal()"></div>
  `,
  styles: [`
    .avatar-lg { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; }
    .bg-info-subtle { background-color: #e0f7fa; }
    .bg-primary-subtle { background-color: #e3f2fd; }
    .bg-success-subtle { background-color: #e8f5e9; }
    .modal { background-color: rgba(0,0,0,0.5); }
  `]
})
export class ClientDetailComponent implements OnInit {
  clientId: string | null = null;
  client: Client | null = null;
  comptes: Compte[] = [];

  isLoading = false;
  isTogglingStatus = false;  // Loading state pour le bouton suspend/activate
  errorMessage: string | null = null;

  showModal = false;
  isCreating = false;
  createError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private clientService: ClientService,
    private compteService: CompteService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id');
    console.log('[ClientDetail] Client ID from route:', this.clientId);
    if (this.clientId) {
      this.loadData();
    } else {
      this.errorMessage = "ID du client non spécifié";
    }
  }

  loadData() {
    if (!this.clientId) return;

    this.isLoading = true;
    this.errorMessage = null;
    console.log('[ClientDetail] Loading data for client:', this.clientId);

    forkJoin({
      client: this.clientService.getClientById(this.clientId),
      comptes: this.compteService.getComptesByClientId(this.clientId)
    }).pipe(
      catchError(err => {
        console.error('[ClientDetail] Error loading data:', err);
        this.errorMessage = err.error?.message || err.message || 'Erreur lors du chargement des données';
        return of({ client: null as Client | null, comptes: [] as Compte[] });
      }),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        this.client = data.client;
        this.comptes = data.comptes || [];
      },
      error: (err) => {
        console.error('[ClientDetail] Subscribe error:', err);
        this.errorMessage = err.error?.message || err.message || 'Erreur inconnue';
      }
    });
  }

  toggleStatut() {
    if (!this.client || !this.clientId) return;

    const currentStatut = this.client.statut;
    const isCurrentlyActive = currentStatut === 'Actif';

    console.log('[ClientDetail] Toggle statut for client:', this.clientId);
    console.log('[ClientDetail] Current statut:', currentStatut);
    console.log('[ClientDetail] Will call:', isCurrentlyActive ? 'suspend' : 'activate');

    this.isTogglingStatus = true;
    this.cdr.detectChanges();

    const action$ = isCurrentlyActive
      ? this.clientService.suspendClient(this.clientId)
      : this.clientService.activateClient(this.clientId);

    action$.pipe(
      finalize(() => {
        this.isTogglingStatus = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        console.log('[ClientDetail] Toggle statut response:', response);

        // Mettre à jour le statut localement sans recharger la page
        if (this.client) {
          this.client.statut = isCurrentlyActive ? 'Suspendu' : 'Actif';
        }

        // Afficher le message de succès
        const message = response?.message || (isCurrentlyActive ? 'Client suspendu avec succès' : 'Client réactivé avec succès');
        alert(message);

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ClientDetail] Toggle statut error:', err);
        const errorMsg = err.error?.message || err.message || 'Erreur lors du changement de statut';
        alert('Erreur: ' + errorMsg);
      }
    });
  }

  openCreateCompteModal() {
    this.showModal = true;
    this.createError = null;
  }

  closeModal() {
    this.showModal = false;
    this.isCreating = false;
    this.createError = null;
  }

  createCompteWithType(type: 'COURANT' | 'EPARGNE') {
    if (!this.client) return;

    this.isCreating = true;
    this.createError = null;
    console.log('[ClientDetail] Creating account type:', type, 'for client:', this.client.id);

    this.compteService.createCompte(
      this.client.id,
      `${this.client.prenom} ${this.client.nom}`,
      type
    ).subscribe({
      next: (compte) => {
        console.log('[ClientDetail] Account created:', compte);
        this.isCreating = false;
        this.closeModal();
        this.loadData();
        alert(`Compte ${type} créé avec succès !`);
      },
      error: (err) => {
        console.error('[ClientDetail] Error creating account:', err);
        this.isCreating = false;
        this.createError = err.error?.message || err.message || 'Erreur lors de la création du compte';
      }
    });
  }
}
