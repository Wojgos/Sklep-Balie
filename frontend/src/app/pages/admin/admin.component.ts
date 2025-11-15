import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Product, Category, Order, InsertProduct, InsertCategory, SalesStatistics, LowStockAlert, OrderItem, ProductAttribute, ProductVariant, Ticket, TicketReply, TicketStatusUpdate, LoyaltyProgram, LoyaltyReward, InsertLoyaltyProgram, InsertLoyaltyReward } from '../../models';

type TabType = 'products' | 'categories' | 'orders' | 'lowStock' | 'statistics' | 'support' | 'loyalty';

@Component({
  selector: 'bg-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex-1 bg-background py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Header -->
          <div class="mb-8">
            <h1 class="font-heading font-bold text-3xl sm:text-4xl mb-2" data-testid="text-admin-title">
              Panel Administratora
            </h1>
            <p class="text-muted-foreground">Zarządzaj produktami, kategoriami i zamówieniami</p>
          </div>

          <!-- Tabs -->
          <div class="border-b border-border mb-6">
            <nav class="flex space-x-8" aria-label="Tabs">
              <button
                *ngFor="let tab of tabs"
                (click)="activeTab = tab.id"
                [class]="activeTab === tab.id 
                  ? 'border-primary text-primary border-b-2 py-4 px-1 text-sm font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted border-b-2 py-4 px-1 text-sm font-medium'"
              >
                {{ tab.label }}
              </button>
            </nav>
          </div>

          <!-- Products Tab -->
          <div *ngIf="activeTab === 'products'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-semibold">Zarządzanie Produktami</h2>
              <button 
                (click)="openProductModal()"
                class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
                data-testid="button-add-product"
              >
                + Dodaj Produkt
              </button>
            </div>

            <div class="bg-card border border-card-border rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-muted">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Zdjęcie</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Nazwa</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Kategoria</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Cena</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Stan</th>
                      <th class="px-4 py-3 text-right text-sm font-semibold">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let product of products$ | async" class="border-t border-card-border hover:bg-muted/50">
                      <td class="px-4 py-3">
                        <img
                          [src]="product.image"
                          [alt]="product.name"
                          class="w-12 h-12 object-cover rounded"
                        />
                      </td>
                      <td class="px-4 py-3 font-medium">{{ product.name }}</td>
                      <td class="px-4 py-3">{{ getCategoryName(product.categoryId) }}</td>
                      <td class="px-4 py-3">{{ parseFloat(product.price) | number:'1.2-2' }} PLN</td>
                      <td class="px-4 py-3">
                        <span [class]="product.stock > 10 
                          ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium' 
                          : product.stock > 0 
                            ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium'
                            : 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium'">
                          {{ product.stock }} szt.
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="flex justify-end gap-2">
                          <button
                            (click)="openProductModal(product)"
                            class="p-2 hover:bg-muted rounded-md transition-colors"
                            data-testid="button-edit-product"
                            title="Edytuj"
                          >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </button>
                          <button
                            (click)="deleteProduct(product.id)"
                            class="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                            data-testid="button-delete-product"
                            title="Usuń"
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

          <!-- Categories Tab -->
          <div *ngIf="activeTab === 'categories'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-semibold">Zarządzanie Kategoriami</h2>
              <button 
                (click)="openCategoryModal()"
                class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                + Dodaj Kategorię
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div *ngFor="let category of categories$ | async" 
                   class="bg-card border border-card-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <img [src]="category.image" [alt]="category.name" class="w-full h-48 object-cover" />
                <div class="p-4">
                  <h3 class="font-semibold text-lg mb-2">{{ category.name }}</h3>
                  <p class="text-sm text-muted-foreground mb-4">{{ category.description }}</p>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-muted-foreground">{{ category.productCount }} produktów</span>
                    <div class="flex gap-2">
                      <button
                        (click)="openCategoryModal(category)"
                        class="p-2 hover:bg-muted rounded-md transition-colors"
                        title="Edytuj"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        (click)="deleteCategory(category.id)"
                        class="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                        title="Usuń"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Orders Tab -->
          <div *ngIf="activeTab === 'orders'" class="space-y-6">
            <h2 class="text-2xl font-semibold">Przegląd Zamówień</h2>

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
                    <tr *ngFor="let order of orders$ | async" class="border-t border-card-border hover:bg-muted/50">
                      <td class="px-4 py-3 font-mono text-sm">
                        #{{ order.id.slice(0, 8) }}
                      </td>
                      <td class="px-4 py-3">{{ order.customerName }}</td>
                      <td class="px-4 py-3 text-sm">{{ order.email }}</td>
                      <td class="px-4 py-3 font-medium">{{ parseFloat(order.totalPrice) | number:'1.2-2' }} PLN</td>
                      <td class="px-4 py-3">
                        <select 
                          [value]="order.status"
                          (change)="updateOrderStatus(order.id, $event)"
                          class="px-2 py-1 border border-border rounded text-sm bg-background"
                          data-testid="select-order-status"
                        >
                          <option value="pending">Oczekujące</option>
                          <option value="processing">Przetwarzane</option>
                          <option value="shipped">Wysłane</option>
                          <option value="delivered">Dostarczone</option>
                          <option value="cancelled">Anulowane</option>
                        </select>
                      </td>
                      <td class="px-4 py-3 text-sm">
                        {{ order.createdAt | date:'dd.MM.yyyy HH:mm' }}
                      </td>
                      <td class="px-4 py-3 text-right">
                        <button
                          (click)="viewOrderDetails(order.id)"
                          class="px-3 py-1 text-sm border border-border rounded hover:bg-muted transition-colors"
                        >
                          Szczegóły
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Low Stock Tab -->
          <div *ngIf="activeTab === 'lowStock'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-semibold">Niskie Stany Magazynowe</h2>
              <div class="flex items-center gap-2">
                <label class="text-sm text-muted-foreground">Próg alertu:</label>
                <input 
                  type="number" 
                  [(ngModel)]="lowStockThreshold"
                  (change)="loadLowStockAlerts()"
                  class="w-20 px-2 py-1 border border-border rounded text-sm bg-background"
                  min="1"
                />
              </div>
            </div>

            <div *ngIf="(lowStockAlerts$ | async) as alerts">
              <div *ngIf="alerts.length === 0" class="text-center py-12 bg-card border border-card-border rounded-lg">
                <svg class="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 class="mt-2 text-lg font-medium">Brak alertów</h3>
                <p class="mt-1 text-sm text-muted-foreground">Wszystkie produkty mają wystarczający stan magazynowy</p>
              </div>

              <div *ngIf="alerts.length > 0" class="space-y-4">
                <div *ngFor="let alert of alerts" 
                     class="bg-card border-l-4 border-l-destructive border border-card-border rounded-lg p-4 flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <img [src]="alert.product.image" [alt]="alert.product.name" 
                         class="w-16 h-16 object-cover rounded" />
                    <div>
                      <h3 class="font-semibold">{{ alert.product.name }}</h3>
                      <p class="text-sm text-muted-foreground">
                        Obecny stan: <span class="font-medium text-destructive">{{ alert.currentStock }} szt.</span>
                      </p>
                      <p class="text-sm text-muted-foreground">
                        Sugerowane zamówienie: <span class="font-medium">{{ alert.suggestedOrder }} szt.</span>
                      </p>
                    </div>
                  </div>
                  <button
                    (click)="autoOrderProduct(alert)"
                    class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Zamów automatycznie
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistics Tab -->
          <div *ngIf="activeTab === 'statistics'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-semibold">Statystyki Sprzedażowe</h2>
              <div class="flex items-center gap-2">
                <input 
                  type="date" 
                  [(ngModel)]="statsStartDate"
                  class="px-3 py-2 border border-border rounded text-sm bg-background"
                />
                <span class="text-muted-foreground">-</span>
                <input 
                  type="date" 
                  [(ngModel)]="statsEndDate"
                  class="px-3 py-2 border border-border rounded text-sm bg-background"
                />
                <button
                  (click)="loadStatistics()"
                  class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Generuj
                </button>
              </div>
            </div>

            <div *ngIf="statistics$ | async as stats">
              <!-- Summary Cards -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-card border border-card-border rounded-lg p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-muted-foreground">Całkowity przychód</p>
                      <p class="text-2xl font-bold mt-1">{{ stats.totalRevenue | number:'1.2-2' }} PLN</p>
                    </div>
                    <div class="p-3 bg-green-100 rounded-full">
                      <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="bg-card border border-card-border rounded-lg p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-muted-foreground">Liczba zamówień</p>
                      <p class="text-2xl font-bold mt-1">{{ stats.totalOrders }}</p>
                    </div>
                    <div class="p-3 bg-blue-100 rounded-full">
                      <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="bg-card border border-card-border rounded-lg p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-muted-foreground">Średnia wartość zamówienia</p>
                      <p class="text-2xl font-bold mt-1">{{ stats.averageOrderValue | number:'1.2-2' }} PLN</p>
                    </div>
                    <div class="p-3 bg-purple-100 rounded-full">
                      <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="bg-card border border-card-border rounded-lg p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-muted-foreground">Liczba produktów</p>
                      <p class="text-2xl font-bold mt-1">{{ stats.totalProducts }}</p>
                    </div>
                    <div class="p-3 bg-orange-100 rounded-full">
                      <svg class="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Top Products -->
              <div class="bg-card border border-card-border rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-4">Najlepiej sprzedające się produkty</h3>
                <div class="space-y-3">
                  <div *ngFor="let item of stats.topProducts; let i = index" 
                       class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div class="flex items-center gap-3">
                      <span class="font-bold text-lg text-muted-foreground">{{ i + 1 }}.</span>
                      <img [src]="item.product.image" [alt]="item.product.name" 
                           class="w-12 h-12 object-cover rounded" />
                      <div>
                        <p class="font-medium">{{ item.product.name }}</p>
                        <p class="text-sm text-muted-foreground">Sprzedano: {{ item.quantity }} szt.</p>
                      </div>
                    </div>
                    <span class="font-semibold text-lg">{{ item.revenue | number:'1.2-2' }} PLN</span>
                  </div>
                </div>
              </div>

              <!-- Revenue by Category -->
              <div class="bg-card border border-card-border rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-4">Przychód według kategorii</h3>
                <div class="space-y-3">
                  <div *ngFor="let item of stats.revenueByCategory" 
                       class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div class="flex items-center gap-3">
                      <img [src]="item.category.image" [alt]="item.category.name" 
                           class="w-12 h-12 object-cover rounded" />
                      <span class="font-medium">{{ item.category.name }}</span>
                    </div>
                    <span class="font-semibold text-lg">{{ item.revenue | number:'1.2-2' }} PLN</span>
                  </div>
                </div>
              </div>

              <!-- Orders by Status -->
              <div class="bg-card border border-card-border rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-4">Zamówienia według statusu</h3>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div *ngFor="let item of stats.ordersByStatus" 
                       class="text-center p-4 bg-muted/50 rounded-lg">
                    <p class="text-2xl font-bold">{{ item.count }}</p>
                    <p class="text-sm text-muted-foreground mt-1">{{ getStatusText(item.status) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Support Tab -->
          <div *ngIf="activeTab === 'support'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-semibold">Zarządzanie Zgłoszeniami</h2>
              <div class="flex gap-2">
                <button
                  *ngFor="let status of supportStatusFilters"
                  (click)="selectedSupportStatus = status.value"
                  [class]="selectedSupportStatus === status.value 
                    ? 'bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold transition-colors'
                    : 'bg-muted text-foreground px-4 py-2 rounded-lg font-semibold hover:bg-muted/80 transition-colors'"
                >
                  {{ status.label }}
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="loadingTickets" class="flex justify-center py-16">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>

            <!-- Tickets List -->
            <div *ngIf="!loadingTickets" class="bg-card border border-card-border rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-muted">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold">ID</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Temat</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Użytkownik</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Wiadomości</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Ostatnia aktualizacja</th>
                      <th class="px-4 py-3 text-right text-sm font-semibold">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let ticket of getFilteredTickets()" 
                        class="border-t border-card-border hover:bg-muted/50">
                      <td class="px-4 py-3">#{{ ticket.id }}</td>
                      <td class="px-4 py-3 font-medium">{{ ticket.subject }}</td>
                      <td class="px-4 py-3">{{ ticket.user.firstName }} {{ ticket.user.lastName }}</td>
                      <td class="px-4 py-3">
                        <span 
                          class="px-3 py-1 rounded-full text-xs font-medium"
                          [ngClass]="{
                            'bg-blue-100 text-blue-800': ticket.status === 'new',
                            'bg-yellow-100 text-yellow-800': ticket.status === 'in_progress',
                            'bg-green-100 text-green-800': ticket.status === 'closed'
                          }"
                        >
                          {{ getSupportStatusLabel(ticket.status) }}
                        </span>
                      </td>
                      <td class="px-4 py-3">{{ ticket.messages?.length || 0 }}</td>
                      <td class="px-4 py-3 text-sm">{{ ticket.updated_at | date:'dd.MM.yyyy HH:mm' }}</td>
                      <td class="px-4 py-3 text-right">
                        <button
                          (click)="viewSupportTicket(ticket)"
                          class="text-primary hover:underline text-sm font-medium"
                        >
                          Szczegóły
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Loyalty Program Tab -->
          <div *ngIf="activeTab === 'loyalty'" class="space-y-6">
            <!-- Program Configuration -->
            <div class="bg-card border border-card-border rounded-lg p-6">
              <h2 class="text-2xl font-semibold mb-6">Konfiguracja Programu Lojalnościowego</h2>
              
              <form *ngIf="loyaltyProgram" (submit)="saveLoyaltyProgram($event)" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Nazwa programu</label>
                  <input 
                    type="text" 
                    [(ngModel)]="loyaltyProgramForm.name" 
                    name="name"
                    required
                    class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">Opis</label>
                  <textarea 
                    [(ngModel)]="loyaltyProgramForm.description" 
                    name="description"
                    rows="2"
                    class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  ></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">Punkty za 1 PLN</label>
                    <input 
                      type="number" 
                      [(ngModel)]="loyaltyProgramForm.pointsPerZloty" 
                      name="pointsPerZloty"
                      step="0.1"
                      min="0"
                      required
                      class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>

                  <div class="flex items-end">
                    <label class="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        [(ngModel)]="loyaltyProgramForm.isActive" 
                        name="isActive"
                        class="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      />
                      <span class="ml-2 text-sm font-medium">Program aktywny</span>
                    </label>
                  </div>
                </div>

                <div class="flex justify-end gap-2 pt-4">
                  <button 
                    type="submit"
                    class="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Zapisz konfigurację
                  </button>
                </div>
              </form>
            </div>

            <!-- Rewards Management -->
            <div>
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold">Nagrody</h2>
                <button 
                  (click)="openRewardModal()"
                  class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  + Dodaj Nagrodę
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div *ngFor="let reward of loyaltyRewards$ | async" 
                     class="bg-card border border-card-border rounded-lg p-4">
                  <div class="flex justify-between items-start mb-3">
                    <h3 class="font-semibold text-lg">{{ reward.name }}</h3>
                    <span 
                      class="px-2 py-1 rounded text-xs font-medium"
                      [ngClass]="reward.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                    >
                      {{ reward.isActive ? 'Aktywna' : 'Nieaktywna' }}
                    </span>
                  </div>
                  
                  <p class="text-sm text-muted-foreground mb-4">{{ reward.description }}</p>
                  
                  <div class="space-y-2 mb-4">
                    <div class="flex justify-between text-sm">
                      <span class="text-muted-foreground">Koszt:</span>
                      <span class="font-semibold">{{ reward.pointsCost }} punktów</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted-foreground">Typ:</span>
                      <span class="font-medium">{{ getRewardTypeLabel(reward.rewardType) }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted-foreground">Wartość:</span>
                      <span class="font-medium">{{ formatRewardValue(reward) }}</span>
                    </div>
                    <div *ngIf="reward.usageLimit" class="flex justify-between text-sm">
                      <span class="text-muted-foreground">Limit użyć:</span>
                      <span class="font-medium">{{ reward.usageLimit }}</span>
                    </div>
                    <div *ngIf="reward.validUntil" class="flex justify-between text-sm">
                      <span class="text-muted-foreground">Ważna do:</span>
                      <span class="font-medium">{{ reward.validUntil | date:'dd.MM.yyyy' }}</span>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <button
                      (click)="openRewardModal(reward)"
                      class="flex-1 px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    >
                      Edytuj
                    </button>
                    <button
                      (click)="deleteReward(reward.id)"
                      class="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>

    <!-- Product Modal -->
    <div *ngIf="showProductModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeProductModal()">
      <div class="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">{{ editingProduct ? 'Edytuj Produkt' : 'Dodaj Produkt' }}</h2>
            <button (click)="closeProductModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form (submit)="saveProduct($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Nazwa produktu</label>
              <input 
                type="text" 
                [(ngModel)]="productForm.name" 
                name="name"
                required
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Opis</label>
              <textarea 
                [(ngModel)]="productForm.description" 
                name="description"
                rows="3"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Kategoria</label>
                <select 
                  [(ngModel)]="productForm.categoryId" 
                  name="categoryId"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">Wybierz kategorię</option>
                  <option *ngFor="let cat of categories$ | async" [value]="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Materiał</label>
                <input 
                  type="text" 
                  [(ngModel)]="productForm.material" 
                  name="material"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Wymiary</label>
              <input 
                type="text" 
                [(ngModel)]="productForm.dimensions" 
                name="dimensions"
                placeholder="np. 60x60x80 cm"
                required
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Cena (PLN)</label>
                <input 
                  type="number" 
                  [(ngModel)]="productForm.price" 
                  name="price"
                  step="0.01"
                  min="0"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Stara cena (PLN)</label>
                <input 
                  type="number" 
                  [(ngModel)]="productForm.oldPrice" 
                  name="oldPrice"
                  step="0.01"
                  min="0"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Stan magazynowy</label>
                <input 
                  type="number" 
                  [(ngModel)]="productForm.stock" 
                  name="stock"
                  min="0"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">URL zdjęcia</label>
              <input 
                type="text" 
                [(ngModel)]="productForm.image" 
                name="image"
                placeholder="assets/..."
                required
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <!-- Attributes Section -->
            <div class="border-t border-border pt-4 mt-4">
              <div class="flex justify-between items-center mb-3">
                <h3 class="text-lg font-semibold">Atrybuty i warianty produktu</h3>
                <button 
                  type="button"
                  (click)="showAttributeSection = !showAttributeSection"
                  class="text-sm text-primary hover:underline"
                >
                  {{ showAttributeSection ? 'Ukryj' : '+ Dodaj atrybut' }}
                </button>
              </div>

              <!-- Add Attribute Form -->
              <div *ngIf="showAttributeSection" class="bg-muted/50 p-4 rounded-lg mb-4">
                <div class="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="block text-sm font-medium mb-1">Nazwa atrybutu</label>
                    <input 
                      type="text" 
                      [(ngModel)]="currentAttribute.name" 
                      [ngModelOptions]="{standalone: true}"
                      placeholder="np. Rozmiar, Kolor"
                      class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1">Typ</label>
                    <select 
                      [(ngModel)]="currentAttribute.type"
                      [ngModelOptions]="{standalone: true}"
                      class="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                    >
                      <option value="">Wybierz typ</option>
                      <option value="size">Rozmiar</option>
                      <option value="color">Kolor</option>
                      <option value="text">Tekst</option>
                    </select>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button 
                    type="button"
                    (click)="addAttribute()"
                    class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                  >
                    {{ editingAttributeIndex >= 0 ? 'Aktualizuj' : 'Dodaj' }} atrybut
                  </button>
                  <button 
                    type="button"
                    (click)="cancelAttributeEdit()"
                    class="px-3 py-1 border border-border rounded text-sm hover:bg-muted"
                  >
                    Anuluj
                  </button>
                </div>
              </div>

              <!-- Attributes List -->
              <div *ngIf="productForm.attributes && productForm.attributes.length > 0" class="space-y-3">
                <div *ngFor="let attr of productForm.attributes; let attrIdx = index" 
                     class="bg-muted/30 p-3 rounded-lg">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <span class="font-medium">{{ attr.name }}</span>
                      <span class="text-xs text-muted-foreground ml-2">({{ attr.type }})</span>
                    </div>
                    <div class="flex gap-1">
                      <button 
                        type="button"
                        (click)="editAttribute(attrIdx)"
                        class="p-1 hover:bg-muted rounded text-xs"
                        title="Edytuj"
                      >
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        (click)="deleteAttribute(attrIdx)"
                        class="p-1 hover:bg-destructive/10 text-destructive rounded text-xs"
                        title="Usuń"
                      >
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Variants -->
                  <div class="ml-3 space-y-2">
                    <div *ngFor="let variant of attr.variants; let varIdx = index" 
                         class="flex justify-between items-center bg-background p-2 rounded text-sm">
                      <div>
                        <span class="font-medium">{{ variant.name }}</span>
                        <span class="text-muted-foreground ml-2">{{ variant.value }}</span>
                        <span *ngIf="variant.priceModifier && variant.priceModifier !== 0" class="text-xs ml-2">
                          ({{ variant.priceModifier > 0 ? '+' : '' }}{{ variant.priceModifier }} PLN)
                        </span>
                      </div>
                      <div class="flex gap-1">
                        <button 
                          type="button"
                          (click)="editVariant(attrIdx, varIdx)"
                          class="p-1 hover:bg-muted rounded"
                          title="Edytuj"
                        >
                          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button 
                          type="button"
                          (click)="deleteVariant(attrIdx, varIdx)"
                          class="p-1 hover:bg-destructive/10 text-destructive rounded"
                          title="Usuń"
                        >
                          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Add Variant Form -->
                    <div class="bg-background p-2 rounded text-sm">
                      <div class="grid grid-cols-2 gap-2 mb-2">
                        <input 
                          type="text" 
                          [(ngModel)]="currentVariant.name"
                          [ngModelOptions]="{standalone: true}"
                          placeholder="Nazwa wariantu"
                          class="px-2 py-1 border border-border rounded text-sm bg-background"
                        />
                        <input 
                          type="text" 
                          [(ngModel)]="currentVariant.value"
                          [ngModelOptions]="{standalone: true}"
                          placeholder="Wartość"
                          class="px-2 py-1 border border-border rounded text-sm bg-background"
                        />
                      </div>
                      <div class="grid grid-cols-2 gap-2 mb-2">
                        <input 
                          type="number" 
                          [(ngModel)]="currentVariant.priceModifier"
                          [ngModelOptions]="{standalone: true}"
                          placeholder="Modyfikator ceny (PLN)"
                          step="0.01"
                          class="px-2 py-1 border border-border rounded text-sm bg-background"
                        />
                        <input 
                          type="number" 
                          [(ngModel)]="currentVariant.stockModifier"
                          [ngModelOptions]="{standalone: true}"
                          placeholder="Modyfikator stanu"
                          class="px-2 py-1 border border-border rounded text-sm bg-background"
                        />
                      </div>
                      <div class="flex gap-2">
                        <button 
                          type="button"
                          (click)="addVariant(attrIdx)"
                          class="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
                        >
                          {{ editingVariantIndex >= 0 ? 'Aktualizuj' : '+ Dodaj' }} wariant
                        </button>
                        <button 
                          *ngIf="editingVariantIndex >= 0"
                          type="button"
                          (click)="cancelVariantEdit()"
                          class="px-2 py-1 border border-border rounded text-xs hover:bg-muted"
                        >
                          Anuluj
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button 
                type="button"
                (click)="closeProductModal()"
                class="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Anuluj
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {{ editingProduct ? 'Zapisz' : 'Dodaj' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Category Modal -->
    <div *ngIf="showCategoryModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeCategoryModal()">
      <div class="bg-background rounded-lg max-w-lg w-full" (click)="$event.stopPropagation()">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">{{ editingCategory ? 'Edytuj Kategorię' : 'Dodaj Kategorię' }}</h2>
            <button (click)="closeCategoryModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form (submit)="saveCategory($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Nazwa kategorii</label>
              <input 
                type="text" 
                [(ngModel)]="categoryForm.name" 
                name="name"
                required
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Opis</label>
              <textarea 
                [(ngModel)]="categoryForm.description" 
                name="description"
                rows="3"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">URL zdjęcia</label>
              <input 
                type="text" 
                [(ngModel)]="categoryForm.image" 
                name="image"
                placeholder="assets/..."
                required
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button 
                type="button"
                (click)="closeCategoryModal()"
                class="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Anuluj
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {{ editingCategory ? 'Zapisz' : 'Dodaj' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Order Details Modal -->
    <div *ngIf="showOrderModal && selectedOrder" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeOrderModal()">
      <div class="bg-background rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">Szczegóły zamówienia #{{ selectedOrder.id }}</h2>
            <div class="flex items-center gap-2">
              <button 
                (click)="downloadInvoice(selectedOrder.id)"
                class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-2"
                title="Pobierz fakturę PDF"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                Faktura PDF
              </button>
              <button 
                (click)="openOrderEditModal()"
                class="px-3 py-1 text-sm border border-border rounded hover:bg-muted transition-colors"
              >
                Edytuj
              </button>
              <button (click)="closeOrderModal()" class="text-muted-foreground hover:text-foreground">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="space-y-6">
            <!-- Customer Info -->
            <div class="bg-muted/50 rounded-lg p-4">
              <h3 class="font-semibold mb-3">Informacje o kliencie</h3>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="text-muted-foreground">Imię i nazwisko:</span>
                  <p class="font-medium">{{ selectedOrder.customerName }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">Email:</span>
                  <p class="font-medium">{{ selectedOrder.email }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">Telefon:</span>
                  <p class="font-medium">{{ selectedOrder.phone }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">Adres:</span>
                  <p class="font-medium">{{ selectedOrder.address }}, {{ selectedOrder.city }}, {{ selectedOrder.postalCode }}</p>
                </div>
              </div>
            </div>

            <!-- Order Items -->
            <div>
              <h3 class="font-semibold mb-3">Produkty</h3>
              <div class="space-y-2">
                <div *ngFor="let item of orderItems" 
                     class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div class="flex items-center gap-3">
                    <span class="font-medium">{{ item.productName }}</span>
                    <span class="text-sm text-muted-foreground">x{{ item.quantity }}</span>
                  </div>
                  <span class="font-medium">{{ parseFloat(item.price) * item.quantity | number:'1.2-2' }} PLN</span>
                </div>
              </div>
            </div>

            <!-- Order Summary -->
            <div class="border-t border-border pt-4">
              <div class="flex justify-between items-center text-lg font-bold">
                <span>Wartość całkowita:</span>
                <span>{{ parseFloat(selectedOrder.totalPrice) | number:'1.2-2' }} PLN</span>
              </div>
            </div>

            <!-- Notes -->
            <div *ngIf="selectedOrder.notes" class="bg-muted/50 rounded-lg p-4">
              <h3 class="font-semibold mb-2">Uwagi</h3>
              <p class="text-sm">{{ selectedOrder.notes }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Edit Modal -->
    <div *ngIf="showOrderEditModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeOrderEditModal()">
      <div class="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">Edytuj zamówienie</h2>
            <button (click)="closeOrderEditModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form (submit)="saveOrderEdit($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Imię i nazwisko</label>
              <input 
                type="text" 
                [(ngModel)]="orderEditForm.customerName" 
                name="customerName"
                required
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  [(ngModel)]="orderEditForm.email" 
                  name="email"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Telefon</label>
                <input 
                  type="tel" 
                  [(ngModel)]="orderEditForm.phone" 
                  name="phone"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Adres</label>
              <input 
                type="text" 
                [(ngModel)]="orderEditForm.address" 
                name="address"
                required
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Miasto</label>
                <input 
                  type="text" 
                  [(ngModel)]="orderEditForm.city" 
                  name="city"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Kod pocztowy</label>
                <input 
                  type="text" 
                  [(ngModel)]="orderEditForm.postalCode" 
                  name="postalCode"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Uwagi</label>
              <textarea 
                [(ngModel)]="orderEditForm.notes" 
                name="notes"
                rows="3"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              ></textarea>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button 
                type="button"
                (click)="closeOrderEditModal()"
                class="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Anuluj
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Zapisz
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Support Ticket Details Modal -->
    <div *ngIf="showTicketModal && selectedTicket" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeTicketModal()">
      <div class="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="p-6">
          <div class="flex justify-between items-start mb-6">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h2 class="text-2xl font-semibold">{{ selectedTicket.subject }}</h2>
                <span 
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  [ngClass]="{
                    'bg-blue-100 text-blue-800': selectedTicket.status === 'new',
                    'bg-yellow-100 text-yellow-800': selectedTicket.status === 'in_progress',
                    'bg-green-100 text-green-800': selectedTicket.status === 'closed'
                  }"
                >
                  {{ getSupportStatusLabel(selectedTicket.status) }}
                </span>
              </div>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Zgłoszenie #{{ selectedTicket.id }}</span>
                <span>{{ selectedTicket.user.firstName }} {{ selectedTicket.user.lastName }}</span>
                <span>{{ selectedTicket.created_at | date:'dd.MM.yyyy HH:mm' }}</span>
              </div>
            </div>
            <button (click)="closeTicketModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Status Change -->
          <div class="mb-6 p-4 bg-muted/50 rounded-lg">
            <label class="block text-sm font-medium mb-2">Zmień status zgłoszenia</label>
            <div class="flex gap-2">
              <select
                [(ngModel)]="ticketStatusForm"
                class="flex-1 px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="new">Nowe</option>
                <option value="in_progress">W trakcie</option>
                <option value="closed">Zamknięte</option>
              </select>
              <button
                (click)="updateTicketStatus()"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Zapisz status
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div class="space-y-4 mb-6 max-h-96 overflow-y-auto">
            <h3 class="font-semibold">Historia konwersacji</h3>
            <div
              *ngFor="let message of selectedTicket.messages"
              class="flex"
              [ngClass]="{'justify-end': !isAdminMessage(message.author_id)}"
            >
              <div 
                class="max-w-[80%] rounded-lg p-4"
                [ngClass]="{
                  'bg-muted': isAdminMessage(message.author_id),
                  'bg-primary/10 border border-primary/20': !isAdminMessage(message.author_id)
                }"
              >
                <p class="text-sm font-medium mb-1">
                  {{ getTicketAuthorName(message.author_id) }}
                </p>
                <p class="whitespace-pre-line">{{ message.body }}</p>
                <p class="text-xs text-muted-foreground mt-2">
                  {{ message.created_at | date:'dd.MM.yyyy HH:mm' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Reply Form -->
          <div class="border-t border-border pt-4">
            <form (ngSubmit)="replyToSupportTicket()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">Odpowiedź administratora</label>
                <textarea
                  [(ngModel)]="ticketReplyText"
                  name="reply"
                  required
                  rows="4"
                  class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Napisz odpowiedź dla klienta..."
                ></textarea>
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  [disabled]="!ticketReplyText.trim()"
                  class="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Wyślij odpowiedź
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Loyalty Reward Modal -->
    <div *ngIf="showRewardModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeRewardModal()">
      <div class="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">{{ editingReward ? 'Edytuj Nagrodę' : 'Dodaj Nagrodę' }}</h2>
            <button (click)="closeRewardModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form (submit)="saveReward($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Nazwa nagrody</label>
              <input 
                type="text" 
                [(ngModel)]="rewardForm.name" 
                name="name"
                required
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Opis</label>
              <textarea 
                [(ngModel)]="rewardForm.description" 
                name="description"
                rows="2"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Koszt w punktach</label>
                <input 
                  type="number" 
                  [(ngModel)]="rewardForm.pointsCost" 
                  name="pointsCost"
                  min="1"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Typ nagrody</label>
                <select 
                  [(ngModel)]="rewardForm.rewardType" 
                  name="rewardType"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="discount_percentage">Zniżka procentowa</option>
                  <option value="discount_fixed">Zniżka stała (PLN)</option>
                  <option value="free_shipping">Darmowa dostawa</option>
                  <option value="free_product">Darmowy produkt</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">
                  {{ rewardForm.rewardType === 'discount_percentage' ? 'Wartość (%)' : 
                     rewardForm.rewardType === 'discount_fixed' ? 'Wartość (PLN)' : 
                     rewardForm.rewardType === 'free_product' ? 'ID produktu' : 'Wartość' }}
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="rewardForm.rewardValue" 
                  name="rewardValue"
                  [min]="0"
                  [max]="rewardForm.rewardType === 'discount_percentage' ? 100 : null"
                  [step]="rewardForm.rewardType === 'discount_percentage' || rewardForm.rewardType === 'discount_fixed' ? '0.01' : '1'"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Limit użyć (opcjonalne)</label>
                <input 
                  type="number" 
                  [(ngModel)]="rewardForm.usageLimit" 
                  name="usageLimit"
                  min="1"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="Brak limitu"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Ważne do (opcjonalne)</label>
                <input 
                  type="date" 
                  [(ngModel)]="rewardForm.validUntilString" 
                  name="validUntil"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>

              <div class="flex items-end">
                <label class="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="rewardForm.isActive" 
                    name="isActive"
                    class="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <span class="ml-2 text-sm font-medium">Nagroda aktywna</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">URL obrazka (opcjonalne)</label>
              <input 
                type="text" 
                [(ngModel)]="rewardForm.image" 
                name="image"
                placeholder="assets/..."
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button 
                type="button"
                (click)="closeRewardModal()"
                class="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Anuluj
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {{ editingReward ? 'Zapisz zmiany' : 'Dodaj nagrodę' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  activeTab: TabType = 'products';
  
  tabs = [
    { id: 'products' as TabType, label: 'Produkty' },
    { id: 'categories' as TabType, label: 'Kategorie' },
    { id: 'orders' as TabType, label: 'Zamówienia' },
    { id: 'lowStock' as TabType, label: 'Niski stan' },
    { id: 'statistics' as TabType, label: 'Statystyki' },
    { id: 'support' as TabType, label: 'Zgłoszenia' },
    { id: 'loyalty' as TabType, label: 'System Lojalnościowy' }
  ];

  products$: Observable<Product[]>;
  categories$: Observable<Category[]>;
  orders$: Observable<Order[]>;
  lowStockAlerts$: Observable<LowStockAlert[]>;
  statistics$: Observable<SalesStatistics>;

  // Modals
  showProductModal = false;
  showCategoryModal = false;
  showOrderModal = false;
  showOrderEditModal = false;
  
  editingProduct: Product | null = null;
  editingCategory: Category | null = null;
  selectedOrder: Order | null = null;
  orderItems: OrderItem[] = [];
  orderEditForm: Partial<Order> = {};

  // Forms
  productForm: Partial<InsertProduct & { attributes?: ProductAttribute[] }> = {};
  categoryForm: Partial<InsertCategory> = {};

  // Attribute management
  currentAttribute: Partial<ProductAttribute> = {};
  currentVariant: Partial<ProductVariant> = {};
  editingAttributeIndex: number = -1;
  editingVariantIndex: number = -1;
  showAttributeSection: boolean = false;

  // Statistics filters
  statsStartDate: string = '';
  statsEndDate: string = '';

  // Low stock threshold
  lowStockThreshold: number = 10;

  // Support tickets
  allTickets: Ticket[] = [];
  selectedTicket: Ticket | null = null;
  showTicketModal: boolean = false;
  loadingTickets: boolean = false;
  selectedSupportStatus: string = 'all';
  ticketStatusForm: string = 'new';
  ticketReplyText: string = '';
  supportStatusFilters = [
    { label: 'Wszystkie', value: 'all' },
    { label: 'Nowe', value: 'new' },
    { label: 'W trakcie', value: 'in_progress' },
    { label: 'Zamknięte', value: 'closed' }
  ];

  // Loyalty Program variables
  loyaltyProgram: LoyaltyProgram | null = null;
  loyaltyRewards$: Observable<LoyaltyReward[]>;
  showRewardModal: boolean = false;
  editingReward: LoyaltyReward | null = null;
  
  loyaltyProgramForm: {
    name: string;
    description: string;
    pointsPerZloty: number;
    isActive: boolean;
  } = {
    name: '',
    description: '',
    pointsPerZloty: 1,
    isActive: true
  };

  rewardForm: {
    name: string;
    description: string;
    pointsCost: number;
    rewardType: 'discount_percentage' | 'discount_fixed' | 'free_product' | 'free_shipping';
    rewardValue: number;
    isActive: boolean;
    image?: string;
    validUntilString?: string;
    usageLimit?: number;
  } = {
    name: '',
    description: '',
    pointsCost: 100,
    rewardType: 'discount_percentage',
    rewardValue: 5,
    isActive: true
  };

  private allCategories: Category[] = [];

  constructor(private apiService: ApiService) {
    this.products$ = this.apiService.getProducts();
    this.categories$ = this.apiService.getCategories();
    this.orders$ = this.apiService.getOrders();
    this.lowStockAlerts$ = this.apiService.getLowStockAlerts(this.lowStockThreshold);
    this.statistics$ = this.apiService.getSalesStatistics();
    this.loyaltyRewards$ = this.apiService.getLoyaltyRewards();
  }

  ngOnInit(): void {
    this.categories$.subscribe(cats => this.allCategories = cats);
    this.loadSupportTickets();
    this.loadLoyaltyProgram();
  }

  // Utility methods
  parseFloat(value: string): number {
    return parseFloat(value);
  }

  getCategoryName(categoryId: string): string {
    const category = this.allCategories.find(c => c.id === categoryId);
    return category?.name || 'Nieznana';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Oczekujące',
      'processing': 'Przetwarzane',
      'shipped': 'Wysłane',
      'delivered': 'Dostarczone',
      'cancelled': 'Anulowane'
    };
    return statusMap[status] || status;
  }

  // Product methods
  openProductModal(product?: Product): void {
    this.editingProduct = product || null;
    if (product) {
      this.productForm = {
        name: product.name,
        description: product.description || '',
        dimensions: product.dimensions,
        price: product.price,
        oldPrice: product.oldPrice || '',
        categoryId: product.categoryId,
        image: product.image,
        stock: product.stock,
        material: product.material || '',
        attributes: product.attributes ? JSON.parse(JSON.stringify(product.attributes)) : []
      };
    } else {
      this.productForm = { stock: 0, price: '0', attributes: [] };
    }
    this.showProductModal = true;
    this.showAttributeSection = false;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.editingProduct = null;
    this.productForm = {};
  }

  saveProduct(event: Event): void {
    event.preventDefault();
    
    const productData: any = {
      name: this.productForm.name!,
      description: this.productForm.description,
      dimensions: this.productForm.dimensions!,
      price: this.productForm.price!.toString(),
      oldPrice: this.productForm.oldPrice,
      categoryId: this.productForm.categoryId!,
      image: this.productForm.image!,
      stock: Number(this.productForm.stock) || 0,
      material: this.productForm.material,
      attributes: this.productForm.attributes || []
    };

    if (this.editingProduct) {
      this.apiService.updateProduct(this.editingProduct.id, productData).subscribe({
        next: () => {
          this.products$ = this.apiService.getProducts();
          this.closeProductModal();
          alert('Produkt zaktualizowany pomyślnie!');
        },
        error: (err) => {
          console.error('Błąd aktualizacji produktu:', err);
          alert('Błąd podczas aktualizacji produktu');
        }
      });
    } else {
      this.apiService.createProduct(productData).subscribe({
        next: () => {
          this.products$ = this.apiService.getProducts();
          this.closeProductModal();
          alert('Produkt dodany pomyślnie!');
        },
        error: (err) => {
          console.error('Błąd dodawania produktu:', err);
          alert('Błąd podczas dodawania produktu');
        }
      });
    }
  }

  deleteProduct(id: string): void {
    if (confirm('Czy na pewno chcesz usunąć ten produkt?')) {
      this.apiService.deleteProduct(id).subscribe({
        next: () => {
          this.products$ = this.apiService.getProducts();
          alert('Produkt usunięty pomyślnie!');
        },
        error: (err) => {
          console.error('Błąd usuwania produktu:', err);
          alert('Błąd podczas usuwania produktu');
        }
      });
    }
  }

  // Attribute management methods
  addAttribute(): void {
    if (!this.currentAttribute.name || !this.currentAttribute.type) {
      alert('Nazwa i typ atrybutu są wymagane');
      return;
    }

    const newAttribute: ProductAttribute = {
      id: `attr-${Date.now()}`,
      name: this.currentAttribute.name,
      type: this.currentAttribute.type as 'color' | 'size' | 'text',
      variants: []
    };

    if (!this.productForm.attributes) {
      this.productForm.attributes = [];
    }

    if (this.editingAttributeIndex >= 0) {
      this.productForm.attributes[this.editingAttributeIndex] = {
        ...newAttribute,
        variants: this.productForm.attributes[this.editingAttributeIndex].variants
      };
      this.editingAttributeIndex = -1;
    } else {
      this.productForm.attributes.push(newAttribute);
    }

    this.currentAttribute = {};
    this.showAttributeSection = false;
  }

  editAttribute(index: number): void {
    const attr = this.productForm.attributes![index];
    this.currentAttribute = {
      name: attr.name,
      type: attr.type
    };
    this.editingAttributeIndex = index;
    this.showAttributeSection = true;
  }

  deleteAttribute(index: number): void {
    if (confirm('Czy na pewno chcesz usunąć ten atrybut?')) {
      this.productForm.attributes!.splice(index, 1);
    }
  }

  addVariant(attributeIndex: number): void {
    if (!this.currentVariant.name || !this.currentVariant.value) {
      alert('Nazwa i wartość wariantu są wymagane');
      return;
    }

    const newVariant: ProductVariant = {
      id: `variant-${Date.now()}`,
      name: this.currentVariant.name,
      value: this.currentVariant.value,
      priceModifier: this.currentVariant.priceModifier || 0,
      stockModifier: this.currentVariant.stockModifier || 0
    };

    if (this.editingVariantIndex >= 0) {
      this.productForm.attributes![attributeIndex].variants[this.editingVariantIndex] = newVariant;
      this.editingVariantIndex = -1;
    } else {
      this.productForm.attributes![attributeIndex].variants.push(newVariant);
    }

    this.currentVariant = {};
  }

  editVariant(attributeIndex: number, variantIndex: number): void {
    const variant = this.productForm.attributes![attributeIndex].variants[variantIndex];
    this.currentVariant = { ...variant };
    this.editingVariantIndex = variantIndex;
  }

  deleteVariant(attributeIndex: number, variantIndex: number): void {
    if (confirm('Czy na pewno chcesz usunąć ten wariant?')) {
      this.productForm.attributes![attributeIndex].variants.splice(variantIndex, 1);
    }
  }

  cancelAttributeEdit(): void {
    this.currentAttribute = {};
    this.editingAttributeIndex = -1;
    this.showAttributeSection = false;
  }

  cancelVariantEdit(): void {
    this.currentVariant = {};
    this.editingVariantIndex = -1;
  }

  // Category methods
  openCategoryModal(category?: Category): void {
    this.editingCategory = category || null;
    if (category) {
      this.categoryForm = {
        name: category.name,
        description: category.description || '',
        image: category.image
      };
    } else {
      this.categoryForm = {};
    }
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.editingCategory = null;
    this.categoryForm = {};
  }

  saveCategory(event: Event): void {
    event.preventDefault();
    
    const categoryData: InsertCategory = {
      name: this.categoryForm.name!,
      description: this.categoryForm.description,
      image: this.categoryForm.image!
    };

    if (this.editingCategory) {
      this.apiService.updateCategory(this.editingCategory.id, categoryData).subscribe({
        next: () => {
          this.categories$ = this.apiService.getCategories();
          this.categories$.subscribe(cats => this.allCategories = cats);
          this.closeCategoryModal();
          alert('Kategoria zaktualizowana pomyślnie!');
        },
        error: (err) => {
          console.error('Błąd aktualizacji kategorii:', err);
          alert('Błąd podczas aktualizacji kategorii');
        }
      });
    } else {
      this.apiService.createCategory(categoryData).subscribe({
        next: () => {
          this.categories$ = this.apiService.getCategories();
          this.categories$.subscribe(cats => this.allCategories = cats);
          this.closeCategoryModal();
          alert('Kategoria dodana pomyślnie!');
        },
        error: (err) => {
          console.error('Błąd dodawania kategorii:', err);
          alert('Błąd podczas dodawania kategorii');
        }
      });
    }
  }

  deleteCategory(id: string): void {
    if (confirm('Czy na pewno chcesz usunąć tę kategorię?')) {
      this.apiService.deleteCategory(id).subscribe({
        next: () => {
          this.categories$ = this.apiService.getCategories();
          this.categories$.subscribe(cats => this.allCategories = cats);
          alert('Kategoria usunięta pomyślnie!');
        },
        error: (err) => {
          console.error('Błąd usuwania kategorii:', err);
          alert('Błąd podczas usuwania kategorii');
        }
      });
    }
  }

  // Order methods
  updateOrderStatus(orderId: string, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const status = target.value;
    this.apiService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.orders$ = this.apiService.getOrders();
        alert('Status zamówienia zaktualizowany!');
      },
      error: (err) => {
        console.error('Błąd aktualizacji statusu:', err);
        alert('Błąd podczas aktualizacji statusu');
      }
    });
  }

  viewOrderDetails(orderId: string): void {
    this.apiService.getOrder(orderId).subscribe({
      next: (orderData) => {
        this.selectedOrder = orderData;
        this.orderItems = orderData.items;
        this.showOrderModal = true;
      },
      error: (err) => {
        console.error('Błąd pobierania szczegółów zamówienia:', err);
        alert('Błąd podczas pobierania szczegółów zamówienia');
      }
    });
  }

  closeOrderModal(): void {
    this.showOrderModal = false;
    this.selectedOrder = null;
    this.orderItems = [];
  }

  openOrderEditModal(): void {
    if (this.selectedOrder) {
      this.orderEditForm = {
        customerName: this.selectedOrder.customerName,
        email: this.selectedOrder.email,
        phone: this.selectedOrder.phone,
        address: this.selectedOrder.address,
        city: this.selectedOrder.city,
        postalCode: this.selectedOrder.postalCode,
        notes: this.selectedOrder.notes || ''
      };
      this.showOrderEditModal = true;
    }
  }

  closeOrderEditModal(): void {
    this.showOrderEditModal = false;
    this.orderEditForm = {};
  }

  saveOrderEdit(event: Event): void {
    event.preventDefault();
    
    if (!this.selectedOrder) return;

    const updates: Partial<Order> = {
      customerName: this.orderEditForm.customerName,
      email: this.orderEditForm.email,
      phone: this.orderEditForm.phone,
      address: this.orderEditForm.address,
      city: this.orderEditForm.city,
      postalCode: this.orderEditForm.postalCode,
      notes: this.orderEditForm.notes
    };

    this.apiService.updateOrder(this.selectedOrder.id, updates).subscribe({
      next: (updatedOrder) => {
        this.selectedOrder = { ...this.selectedOrder!, ...updatedOrder };
        this.orders$ = this.apiService.getOrders();
        this.closeOrderEditModal();
        alert('Zamówienie zaktualizowane pomyślnie!');
      },
      error: (err) => {
        console.error('Błąd aktualizacji zamówienia:', err);
        alert('Błąd podczas aktualizacji zamówienia');
      }
    });
  }

  // Low stock methods
  loadLowStockAlerts(): void {
    this.lowStockAlerts$ = this.apiService.getLowStockAlerts(this.lowStockThreshold);
  }

  autoOrderProduct(stockAlert: LowStockAlert): void {
    const confirmed = confirm(
      `Czy chcesz automatycznie zamówić ${stockAlert.suggestedOrder} sztuk produktu "${stockAlert.product.name}"?`
    );
    
    if (confirmed) {
      // Update stock
      const newStock = stockAlert.currentStock + stockAlert.suggestedOrder;
      this.apiService.updateProduct(stockAlert.product.id, { stock: newStock }).subscribe({
        next: () => {
          this.products$ = this.apiService.getProducts();
          this.loadLowStockAlerts();
          alert(`Zamówiono ${stockAlert.suggestedOrder} sztuk. Nowy stan: ${newStock} szt.`);
        },
        error: (err) => {
          console.error('Błąd automatycznego zamawiania:', err);
          alert('Błąd podczas automatycznego zamawiania');
        }
      });
    }
  }

  // Statistics methods
  loadStatistics(): void {
    const startDate = this.statsStartDate ? new Date(this.statsStartDate) : undefined;
    const endDate = this.statsEndDate ? new Date(this.statsEndDate) : undefined;
    this.statistics$ = this.apiService.getSalesStatistics(startDate, endDate);
  }

  // Support ticket methods
  loadSupportTickets(): void {
    this.loadingTickets = true;
    this.apiService.getAllTickets().subscribe({
      next: (tickets) => {
        this.allTickets = tickets;
        this.loadingTickets = false;
      },
      error: (err) => {
        console.error('Error loading tickets:', err);
        alert('Błąd podczas ładowania zgłoszeń');
        this.loadingTickets = false;
      }
    });
  }

  getFilteredTickets(): Ticket[] {
    if (this.selectedSupportStatus === 'all') {
      return this.allTickets;
    }
    return this.allTickets.filter(t => t.status === this.selectedSupportStatus);
  }

  viewSupportTicket(ticket: Ticket): void {
    this.loadingTickets = true;
    this.apiService.getAdminTicket(ticket.id).subscribe({
      next: (fullTicket) => {
        this.selectedTicket = fullTicket;
        this.ticketStatusForm = fullTicket.status;
        this.ticketReplyText = '';
        this.showTicketModal = true;
        this.loadingTickets = false;
      },
      error: (err) => {
        console.error('Error loading ticket details:', err);
        alert('Błąd podczas ładowania szczegółów zgłoszenia');
        this.loadingTickets = false;
      }
    });
  }

  closeTicketModal(): void {
    this.showTicketModal = false;
    this.selectedTicket = null;
    this.ticketReplyText = '';
  }

  updateTicketStatus(): void {
    if (!this.selectedTicket) return;

    const statusUpdate: TicketStatusUpdate = {
      status: this.ticketStatusForm as 'new' | 'in_progress' | 'closed'
    };

    this.apiService.updateTicketStatus(this.selectedTicket.id, statusUpdate).subscribe({
      next: (updatedTicket) => {
        alert('Status zgłoszenia został zaktualizowany');
        this.loadSupportTickets();
        if (this.selectedTicket) {
          this.selectedTicket.status = updatedTicket.status;
        }
      },
      error: (err) => {
        console.error('Error updating ticket status:', err);
        alert('Błąd podczas aktualizacji statusu zgłoszenia');
      }
    });
  }

  replyToSupportTicket(): void {
    if (!this.selectedTicket || !this.ticketReplyText.trim()) return;

    const reply: TicketReply = {
      body: this.ticketReplyText
    };

    this.apiService.adminReplyToTicket(this.selectedTicket.id, reply).subscribe({
      next: () => {
        alert('Odpowiedź została wysłana');
        this.ticketReplyText = '';
        // Reload ticket details
        if (this.selectedTicket) {
          this.viewSupportTicket(this.selectedTicket);
        }
      },
      error: (err) => {
        console.error('Error replying to ticket:', err);
        alert('Błąd podczas wysyłania odpowiedzi');
      }
    });
  }

  getSupportStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'new': 'Nowe',
      'in_progress': 'W trakcie',
      'closed': 'Zamknięte'
    };
    return labels[status] || status;
  }

  isAdminMessage(authorId: number): boolean {
    // Check if the message is from admin (not from the ticket creator)
    if (!this.selectedTicket) return false;
    return this.selectedTicket.user.id !== authorId.toString();
  }

  getTicketAuthorName(authorId: number): string {
    if (!this.selectedTicket) return 'Nieznany';
    
    const participant = this.selectedTicket.participants?.find(p => p.id === authorId.toString());
    if (participant) {
      return `${participant.firstName} ${participant.lastName}`;
    }
    
    return this.isAdminMessage(authorId) ? 'Administrator' : 'Klient';
  }

  downloadInvoice(orderId: string): void {
    this.apiService.downloadInvoice(orderId, `faktura_${orderId}.pdf`);
  }

  // Loyalty Program methods
  loadLoyaltyProgram(): void {
    this.apiService.getLoyaltyProgram().subscribe({
      next: (program) => {
        this.loyaltyProgram = program;
        if (program) {
          this.loyaltyProgramForm = {
            name: program.name,
            description: program.description,
            pointsPerZloty: program.pointsPerZloty,
            isActive: program.isActive
          };
        }
      },
      error: (err) => {
        console.error('Error loading loyalty program:', err);
      }
    });
  }

  saveLoyaltyProgram(event: Event): void {
    event.preventDefault();
    
    const programData: InsertLoyaltyProgram = {
      name: this.loyaltyProgramForm.name,
      description: this.loyaltyProgramForm.description,
      pointsPerZloty: this.loyaltyProgramForm.pointsPerZloty,
      isActive: this.loyaltyProgramForm.isActive
    };

    this.apiService.createOrUpdateLoyaltyProgram(programData).subscribe({
      next: (program) => {
        this.loyaltyProgram = program;
        alert('Konfiguracja programu lojalnościowego została zapisana');
      },
      error: (err) => {
        console.error('Error saving loyalty program:', err);
        alert('Błąd podczas zapisywania konfiguracji');
      }
    });
  }

  // Reward methods
  openRewardModal(reward?: LoyaltyReward): void {
    if (reward) {
      this.editingReward = reward;
      this.rewardForm = {
        name: reward.name,
        description: reward.description,
        pointsCost: reward.pointsCost,
        rewardType: reward.rewardType,
        rewardValue: reward.rewardValue,
        isActive: reward.isActive,
        image: reward.image,
        validUntilString: reward.validUntil ? new Date(reward.validUntil).toISOString().split('T')[0] : undefined,
        usageLimit: reward.usageLimit || undefined
      };
    } else {
      this.editingReward = null;
      this.rewardForm = {
        name: '',
        description: '',
        pointsCost: 100,
        rewardType: 'discount_percentage',
        rewardValue: 5,
        isActive: true
      };
    }
    this.showRewardModal = true;
  }

  closeRewardModal(): void {
    this.showRewardModal = false;
    this.editingReward = null;
  }

  saveReward(event: Event): void {
    event.preventDefault();
    
    const rewardData: InsertLoyaltyReward = {
      name: this.rewardForm.name,
      description: this.rewardForm.description,
      pointsCost: this.rewardForm.pointsCost,
      rewardType: this.rewardForm.rewardType,
      rewardValue: this.rewardForm.rewardValue,
      isActive: this.rewardForm.isActive,
      image: this.rewardForm.image,
      validUntil: this.rewardForm.validUntilString ? new Date(this.rewardForm.validUntilString) : undefined,
      usageLimit: this.rewardForm.usageLimit
    };

    if (this.editingReward) {
      // Update existing reward
      this.apiService.updateLoyaltyReward(this.editingReward.id, rewardData).subscribe({
        next: () => {
          this.loyaltyRewards$ = this.apiService.getLoyaltyRewards();
          this.closeRewardModal();
          alert('Nagroda została zaktualizowana');
        },
        error: (err) => {
          console.error('Error updating reward:', err);
          alert('Błąd podczas aktualizacji nagrody');
        }
      });
    } else {
      // Create new reward
      this.apiService.createLoyaltyReward(rewardData).subscribe({
        next: () => {
          this.loyaltyRewards$ = this.apiService.getLoyaltyRewards();
          this.closeRewardModal();
          alert('Nagroda została dodana');
        },
        error: (err) => {
          console.error('Error creating reward:', err);
          alert('Błąd podczas tworzenia nagrody');
        }
      });
    }
  }

  deleteReward(rewardId: string): void {
    if (!confirm('Czy na pewno chcesz usunąć tę nagrodę?')) return;

    this.apiService.deleteLoyaltyReward(rewardId).subscribe({
      next: () => {
        this.loyaltyRewards$ = this.apiService.getLoyaltyRewards();
        alert('Nagroda została usunięta');
      },
      error: (err) => {
        console.error('Error deleting reward:', err);
        alert('Błąd podczas usuwania nagrody');
      }
    });
  }

  getRewardTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'discount_percentage': 'Zniżka procentowa',
      'discount_fixed': 'Zniżka stała',
      'free_shipping': 'Darmowa dostawa',
      'free_product': 'Darmowy produkt'
    };
    return labels[type] || type;
  }

  formatRewardValue(reward: LoyaltyReward): string {
    switch (reward.rewardType) {
      case 'discount_percentage':
        return `${reward.rewardValue}%`;
      case 'discount_fixed':
        return `${reward.rewardValue} PLN`;
      case 'free_shipping':
        return 'Darmowa dostawa';
      case 'free_product':
        return `Produkt #${reward.rewardValue}`;
      default:
        return reward.rewardValue.toString();
    }
  }
}
