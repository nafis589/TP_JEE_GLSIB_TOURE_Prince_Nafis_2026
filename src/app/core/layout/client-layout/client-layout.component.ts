import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClientNavbarComponent } from './client-navbar.component';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ClientNavbarComponent],
  template: `
    <app-client-navbar></app-client-navbar>

    <main class="container py-4">
      <router-outlet></router-outlet>
    </main>

    <footer class="text-center py-4 text-muted small border-top mt-5">
      &copy; 2026 EgaBank Digital Banking - Sécurisé par SSL
    </footer>
  `
})
export class ClientLayoutComponent { }
