import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BankService } from '../../../shared/services/bank.service';
import { Observable } from 'rxjs';
import { Transaction } from '../../../shared/models/bank.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold">Welcome back, Admin</h2>
      <button class="btn btn-dark"><i class="bi bi-download me-2"></i>Export Report</button>
    </div>

    <!-- Stats Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-3" *ngFor="let stat of stats$ | async">
        <div class="card p-3 border-0 shadow-sm">
          <div class="text-muted small">{{ stat.label }}</div>
          <div class="h4 fw-bold mb-0">{{ stat.value }}</div>
          <div class="text-success small"><i class="bi bi-arrow-up"></i> +3.2%</div>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- Recent Transactions Table -->
      <div class="col-lg-8">
        <div class="card p-4 border-0 shadow-sm">
          <h5 class="fw-bold mb-4">Recent Transactions</h5>
          <div class="table-responsive">
            <table class="table align-middle">
              <thead class="table-light">
                <tr>
                  <th>Activity</th>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of transactions$ | async">
                  <td>
                    <div class="fw-bold">{{ t.description }}</div>
                    <small class="text-muted">{{ t.type }}</small>
                  </td>
                  <td>{{ t.date | date:'mediumDate' }}</td>
                  <td [class.text-danger]="t.montant < 0" [class.text-success]="t.montant > 0" class="fw-bold">
                    {{ t.montant | number:'1.0-0' }} FCFA
                  </td>
                  <td>
                    <span class="badge bg-success-subtle text-success border border-success">Success</span>
                  </td>
                  <td><button class="btn btn-sm btn-light">...</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Savings Plan / Quick Actions -->
      <div class="col-lg-4">
        <div class="card p-4 mb-3 bg-primary text-white border-0 shadow-sm">
          <h6>Upgrade to Pro!</h6>
          <p class="small">Get detailed analytics and unlimited accounts.</p>
          <button class="btn btn-light btn-sm fw-bold border-0 shadow-sm">Upgrade Now</button>
        </div>
        <div class="card p-4 border-0 shadow-sm">
            <h5 class="fw-bold mb-3">Quick Actions</h5>
            <button class="btn btn-outline-primary w-100 mb-2 border-0 shadow-sm py-2">New Client</button>
            <button class="btn btn-outline-secondary w-100 border-0 shadow-sm py-2">Make Transfer</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-primary { background-color: #00a86b !important; }
    .btn-outline-primary { color: #00a86b; border-color: #00a86b; }
    .btn-outline-primary:hover { background-color: #00a86b; color: white; }
    .card { border-radius: 12px; transition: transform 0.2s; }
    .card:hover { transform: translateY(-3px); }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats$: Observable<any[]> | undefined;
  transactions$: Observable<Transaction[]> | undefined;

  constructor(private bankService: BankService) { }

  ngOnInit(): void {
    this.stats$ = this.bankService.getDashboardStats();
    this.transactions$ = this.bankService.getRecentTransactions();
  }
}
