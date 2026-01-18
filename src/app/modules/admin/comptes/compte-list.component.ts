import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompteService } from '../../../shared/services/compte.service';
import { Compte } from '../../../shared/models/bank.models';
import { Observable, BehaviorSubject, combineLatest, map } from 'rxjs';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-compte-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold">Liste des Comptes</h2>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <label class="form-label small fw-bold">Type de compte</label>
        <select class="form-select" [(ngModel)]="filterType" (change)="applyFilters()">
          <option value="">Tous les types</option>
          <option value="COURANT">Courant</option>
          <option value="EPARGNE">Épargne</option>
        </select>
      </div>
      <div class="col-md-8">
        <label class="form-label small fw-bold">Recherche (Numéro ou Client)</label>
        <div class="input-group">
          <input type="text" class="form-control" placeholder="Rechercher..." [(ngModel)]="searchTerm" (input)="applyFilters()">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light">
            <tr>
              <th>Numéro de compte</th>
              <th>Client</th>
              <th>Type</th>
              <th>Solde</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let compte of filteredComptes$ | async">
              <td class="fw-mono">{{ compte.numeroCompte }}</td>
              <td>
                <div class="fw-bold">{{ compte.clientNom }}</div>
                <small class="text-muted">ID: {{ compte.clientId }}</small>
              </td>
              <td>
                <span class="badge" [ngClass]="compte.type === 'COURANT' ? 'bg-primary-subtle text-primary' : 'bg-success-subtle text-success'">
                  {{ compte.type }}
                </span>
              </td>
              <td class="fw-bold">{{ compte.solde | number:'1.0-0' }} FCFA</td>
              <td>
                <button class="btn btn-sm btn-light" [routerLink]="['/admin/comptes', compte.id]">
                  <i class="bi bi-gear me-1"></i> Gérer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .fw-mono { font-family: 'Courier New', Courier, monospace; }
    .bg-primary-subtle { background-color: #e3f2fd; }
    .bg-success-subtle { background-color: #e8f5e9; }
  `]
})
export class CompteListComponent implements OnInit {
  comptes$: Observable<Compte[]>;
  filteredComptes$: Observable<Compte[]> | undefined;

  searchTerm: string = '';
  filterType: string = '';

  constructor(private compteService: CompteService) {
    this.comptes$ = this.compteService.getComptes();
  }

  ngOnInit(): void {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredComptes$ = this.comptes$.pipe(
      map(comptes => comptes.filter(c => {
        const matchesType = this.filterType ? c.type === this.filterType : true;
        const matchesSearch = this.searchTerm ?
          (c.numeroCompte.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            c.clientNom?.toLowerCase().includes(this.searchTerm.toLowerCase())) : true;
        return matchesType && matchesSearch;
      }))
    );
  }
}
