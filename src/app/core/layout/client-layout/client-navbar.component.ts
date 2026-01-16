import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-client-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm py-3 px-4">
      <div class="container">
        <a class="navbar-brand fw-bold text-success" routerLink="/client/dashboard">Egabank</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/client/dashboard" routerLinkActive="active">Tableau de bord</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/client/comptes" routerLinkActive="active">Mes Comptes</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/client/virement" routerLinkActive="active">Virement</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/client/transactions" routerLinkActive="active">Historique</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/client/releves" routerLinkActive="active">Relevés</a>
            </li>
          </ul>
          <div class="d-flex align-items-center text-white">
            <span class="me-3 d-none d-md-block">Bonjour, Sajibur</span>
            <div class="dropdown">
              <img src="https://i.pravatar.cc/40?u=sajibur" 
                   class="rounded-circle border border-2 border-success dropdown-toggle" 
                   style="cursor:pointer" 
                   id="clientProfileDropdown"
                   data-bs-toggle="dropdown" 
                   aria-expanded="false">
              <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-3" aria-labelledby="clientProfileDropdown">
                <li><a class="dropdown-item py-2" routerLink="/client/profil"><i class="bi bi-person me-2"></i> Mon Profil</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item py-2 text-danger" href="#"><i class="bi bi-box-arrow-right me-2"></i> Déconnexion</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar-brand { font-size: 1.5rem; }
    .nav-link.active { color: #00a86b !important; font-weight: 600; }
  `]
})
export class ClientNavbarComponent { }
