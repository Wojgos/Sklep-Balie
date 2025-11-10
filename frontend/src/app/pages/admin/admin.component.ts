import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Product, Category, Order } from '../../models';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'bg-admin',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <bg-header></bg-header>

      <main class="flex-1 py-12 bg-background">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between mb-8">
            <h1 class="font-heading font-bold text-3xl sm:text-4xl" data-testid="text-admin-title">
              Panel Administratora
            </h1>
          </div>

          <div class="space-y-8">
            <!-- Products Section -->
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <h2 class="text-2xl font-semibold">Produkty</h2>
                <button 
                  class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
                  data-testid="button-add-product"
                >
                  Dodaj Produkt
                </button>
              </div>

              <div class="bg-card border border-card-border rounded-lg overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-muted">
                      <tr>
                        <th class="px-4 py-3 text-left text-sm font-semibold">Zdjęcie</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold">Nazwa</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold">Cena</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold">Stan</th>
                        <th class="px-4 py-3 text-right text-sm font-semibold">Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let product of products$ | async" class="border-t border-card-border">
                        <td class="px-4 py-3">
                          <img
                            [src]="product.image"
                            [alt]="product.name"
                            class="w-12 h-12 object-cover rounded"
                          />
                        </td>
                        <td class="px-4 py-3 font-medium">{{ product.name }}</td>
                        <td class="px-4 py-3">{{ parseFloat(product.price) | number:'1.2-2' }} PLN</td>
                        <td class="px-4 py-3">
                          <span [class]="product.stock > 0 ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs' : 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs'">
                            {{ product.stock }} szt.
                          </span>
                        </td>
                        <td class="px-4 py-3 text-right">
                          <div class="flex justify-end gap-2">
                            <button
                              class="p-2 hover:bg-muted rounded-md transition-colors"
                              data-testid="button-edit-product"
                            >
                              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                            </button>
                            <button
                              class="p-2 hover:bg-muted rounded-md transition-colors"
                              data-testid="button-delete-product"
                            >
                              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Orders Section -->
            <div class="space-y-4">
              <h2 class="text-2xl font-semibold">Zamówienia</h2>
              <div class="bg-card border border-card-border rounded-lg overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-muted">
                      <tr>
                        <th class="px-4 py-3 text-left text-sm font-semibold">Nr zamówienia</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold">Klient</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold">Email</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold">Wartość</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold">Data</th>
                        <th class="px-4 py-3 text-right text-sm font-semibold">Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let order of orders$ | async" class="border-t border-card-border">
                        <td class="px-4 py-3 font-mono text-sm">
                          {{ order.id.slice(0, 8) }}...
                        </td>
                        <td class="px-4 py-3">{{ order.customerName }}</td>
                        <td class="px-4 py-3">{{ order.email }}</td>
                        <td class="px-4 py-3">{{ parseFloat(order.totalPrice) | number:'1.2-2' }} PLN</td>
                        <td class="px-4 py-3">
                          <span [class]="getStatusClass(order.status)">
                            {{ getStatusText(order.status) }}
                          </span>
                        </td>
                        <td class="px-4 py-3">
                          {{ order.createdAt | date:'dd.MM.yyyy' }}
                        </td>
                        <td class="px-4 py-3 text-right">
                          <select 
                            [value]="order.status"
                            (change)="updateOrderStatus(order.id, $event)"
                            class="px-2 py-1 border border-border rounded text-sm bg-background"
                            data-testid="select-order-status bg-background"
                          >
                            <option value="pending">Oczekujące</option>
                            <option value="processing">Przetwarzane</option>
                            <option value="completed">Zrealizowane</option>
                            <option value="cancelled">Anulowane</option>
                          </select>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <bg-footer></bg-footer>
    </div>
  `,
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  products$: Observable<Product[]>;
  categories$: Observable<Category[]>;
  orders$: Observable<Order[]>;

  constructor(private apiService: ApiService) {
    this.products$ = this.apiService.getProducts();
    this.categories$ = this.apiService.getCategories();
    this.orders$ = this.apiService.getOrders();
  }

  ngOnInit(): void {}

  parseFloat(value: string): number {
    return parseFloat(value);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs';
      case 'processing':
        return 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs';
      case 'cancelled':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs';
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Oczekujące';
      case 'processing':
        return 'Przetwarzane';
      case 'completed':
        return 'Zrealizowane';
      case 'cancelled':
        return 'Anulowane';
      default:
        return status;
    }
  }

  updateOrderStatus(orderId: string, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const status = target.value;
    this.apiService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        console.log('Status zamówienia zaktualizowany');
        // Refresh orders
        this.orders$ = this.apiService.getOrders();
      },
      error: (error) => {
        console.error('Błąd aktualizacji statusu:', error);
      }
    });
  }
}
