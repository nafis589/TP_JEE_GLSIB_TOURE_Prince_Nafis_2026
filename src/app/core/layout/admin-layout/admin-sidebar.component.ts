import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav id="sidebar" class="bg-dark text-white">
        <div class="sidebar-header p-4">
          <h4 class="fw-bold text-success mb-0"> Admin</h4>
        </div>
        <ul class="list-unstyled components px-3">
          <li class="mb-2">
            <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link text-light p-2 rounded">
              <i class="bi bi-grid-1x2-fill me-2"></i> Dashboard
            </a>
          </li>
          <li class="mb-2">
            <a routerLink="/admin/clients" routerLinkActive="active" class="nav-link text-light p-2 rounded">
              <i class="bi bi-people-fill me-2"></i> Clients
            </a>
          </li>
          <li class="mb-2">
            <a routerLink="/admin/comptes" routerLinkActive="active" class="nav-link text-light p-2 rounded">
              <i class="bi bi-bank2 me-2"></i> Comptes
            </a>
          </li>
          <li class="mb-2">
            <a routerLink="/admin/transactions" routerLinkActive="active" class="nav-link text-light p-2 rounded">
              <i class="bi bi-arrow-left-right me-2"></i> Transactions
            </a>
          </li>
          <li class="mb-2">
            <a routerLink="/admin/releves" routerLinkActive="active" class="nav-link text-light p-2 rounded">
              <i class="bi bi-file-earmark-text-fill me-2"></i> Relevés
            </a>
          </li>
          <hr class="bg-secondary">
          <li class="mb-2">
            <a routerLink="/admin/profil" routerLinkActive="active" class="nav-link text-light p-2 rounded">
              <i class="bi bi-person-fill me-2"></i> Profil
            </a>
          </li>
        </ul>
      </nav>
  `,
  styles: [`
    #sidebar {
      min-width: 250px;
      max-width: 250px;
      min-height: 100vh;
      transition: all 0.3s;
    }
    .nav-link:hover {
      background: rgba(255, 255, 255, 0.1) !important;
    }
    .active {
      background: var(--bs-success) !important;
      color: white !important;
    }
  `]
})
export class AdminSidebarComponent { }
