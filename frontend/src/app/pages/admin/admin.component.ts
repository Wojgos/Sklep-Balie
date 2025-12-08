import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of, forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Product, Category, Order, InsertProduct, InsertCategory, SalesStatistics, LowStockAlert, LowStockVariantAlert, LowStockStatistics, GroupedLowStockAlert, ProductSkuVariant, OrderItem, ProductAttribute, ProductVariant, Ticket, TicketReply, TicketStatusUpdate, LoyaltyProgram, LoyaltyReward, InsertLoyaltyProgram, InsertLoyaltyReward } from '../../models';
import { AdvancedStatisticsComponent } from './advanced-statistics.component';

type TabType = 'products' | 'categories' | 'orders' | 'lowStock' | 'statistics' | 'support' | 'loyalty' | 'attributes';

@Component({
  selector: 'bg-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AdvancedStatisticsComponent],
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
                      <th class="px-4 py-3 text-left text-sm font-semibold">Zakres cen</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Warianty</th>
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
                      <td class="px-4 py-3">
                        <div class="text-sm">
                          <div *ngIf="product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice">
                            {{ parseFloat(product.minPrice) | number:'1.2-2' }} - {{ parseFloat(product.maxPrice) | number:'1.2-2' }} PLN
                          </div>
                          <div *ngIf="product.minPrice && (!product.maxPrice || product.minPrice === product.maxPrice)">
                            {{ parseFloat(product.minPrice) | number:'1.2-2' }} PLN
                          </div>
                          <div *ngIf="!product.minPrice" class="text-muted-foreground">
                            Brak wariantów
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <div class="text-sm">
                          <span class="font-medium">{{ product.variantCount || 0 }}</span>
                          <span class="text-muted-foreground ml-1">
                            {{ (product.variantCount || 0) === 1 ? 'wariant' : 'warianty' }}
                          </span>
                        </div>
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

          <!-- Attributes Tab -->
          <div *ngIf="activeTab === 'attributes'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-semibold">Zarządzanie Atrybutami</h2>
              <button
                (click)="openAttributeModal(null)"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                + Dodaj Atrybut
              </button>
            </div>

            <div class="bg-card border border-card-border rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-muted">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Nazwa atrybutu</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">Liczba wartości</th>
                      <th class="px-4 py-3 text-right text-sm font-semibold">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let attribute of attributesList$ | async" class="border-t border-card-border hover:bg-muted/50">
                      <td class="px-4 py-3 font-medium">{{ attribute.name }}</td>
                      <td class="px-4 py-3">
                        <span class="text-sm text-muted-foreground">
                          {{ attribute.values?.length || 0 }} wartości
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="flex justify-end gap-2">
                          <button
                            (click)="manageAttributeValues(attribute)"
                            class="p-2 hover:bg-muted rounded-md transition-colors"
                            title="Zarządzaj wartościami"
                          >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                          </button>
                          <button
                            (click)="openAttributeModal(attribute)"
                            class="p-2 hover:bg-muted rounded-md transition-colors"
                            title="Edytuj"
                          >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </button>
                          <button
                            (click)="deleteAttribute(attribute.id)"
                            class="p-2 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                            title="Usuń"
                          >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <th class="px-4 py-3 text-left text-sm font-semibold">Opłacone</th>
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
                        <span 
                          [class]="order.paid 
                            ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium'
                            : 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium'"
                        >
                          {{ order.paid ? 'Tak' : 'Nie' }}
                        </span>
                      </td>
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
                          <option value="completed">Dostarczone</option>
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
          <!-- Low Stock Tab - Enhanced -->
          <div *ngIf="activeTab === 'lowStock'" class="space-y-6">
            <!-- Header with Actions -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 class="text-2xl font-semibold">Niskie Stany Magazynowe</h2>
                <p class="text-sm text-muted-foreground mt-1">Warianty produktów wymagające uzupełnienia</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  (click)="triggerLowStockAlert()"
                  [disabled]="sendingAlert"
                  class="bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-400 px-4 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center gap-2"
                  title="Wyślij email z alertem do administratora"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  {{ sendingAlert ? 'Wysyłanie...' : 'Wyślij Alert' }}
                </button>
                <button
                  (click)="exportLowStockToCSV()"
                  class="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center gap-2"
                  title="Eksportuj do CSV"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            <!-- Statistics Cards -->
            <div *ngIf="lowStockStats$ | async as stats" class="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div class="bg-card border border-card-border rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs text-muted-foreground">Wszystkie warianty</p>
                    <p class="text-2xl font-bold mt-1">{{ stats.total_variants }}</p>
                  </div>
                  <div class="p-2 bg-blue-100 rounded-full">
                    <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="bg-card border border-card-border rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs text-muted-foreground">OK</p>
                    <p class="text-2xl font-bold mt-1 text-green-600">{{ stats.ok_count }}</p>
                  </div>
                  <div class="p-2 bg-green-100 rounded-full">
                    <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="bg-card border border-card-border rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs text-muted-foreground">Niski stan</p>
                    <p class="text-2xl font-bold mt-1 text-yellow-600">{{ stats.low_stock_count }}</p>
                  </div>
                  <div class="p-2 bg-yellow-100 rounded-full">
                    <svg class="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="bg-card border border-card-border rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs text-muted-foreground">Ostrzeżenie</p>
                    <p class="text-2xl font-bold mt-1 text-orange-600">{{ stats.warning_count }}</p>
                  </div>
                  <div class="p-2 bg-orange-100 rounded-full">
                    <svg class="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="bg-card border border-card-border rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs text-muted-foreground">Krytyczne</p>
                    <p class="text-2xl font-bold mt-1 text-red-600">{{ stats.critical_count }}</p>
                  </div>
                  <div class="p-2 bg-red-100 rounded-full">
                    <svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Filters -->
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium">Filtruj:</label>
              <button
                *ngFor="let filter of lowStockFilters"
                (click)="selectedLowStockFilter = filter.value; loadLowStockAlerts()"
                [class]="selectedLowStockFilter === filter.value 
                  ? 'bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'
                  : 'bg-muted text-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors'"
              >
                {{ filter.label }}
              </button>
            </div>

            <!-- Loading State -->
            <div *ngIf="loadingLowStock" class="flex justify-center py-16">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>

            <!-- Alerts List - Grouped by Product -->
            <div *ngIf="!loadingLowStock && (groupedLowStockAlerts$ | async) as groupedAlerts">
              <!-- Empty State -->
              <div *ngIf="groupedAlerts.length === 0" class="text-center py-12 bg-card border border-card-border rounded-lg">
                <svg class="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 class="mt-2 text-lg font-medium">Brak alertów</h3>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ selectedLowStockFilter === 'all' ? 'Wszystkie warianty mają wystarczający stan magazynowy' : 
                     selectedLowStockFilter === 'critical' ? 'Brak wariantów w stanie krytycznym' :
                     'Brak wariantów w ostrzeżeniu' }}
                </p>
              </div>

              <!-- Grouped Alerts -->
              <div *ngIf="groupedAlerts.length > 0" class="space-y-4">
                <div *ngFor="let group of groupedAlerts" 
                     class="bg-card border border-card-border rounded-lg overflow-hidden"
                     [class.border-l-4]="true"
                     [class.border-l-red-500]="group.hasCritical"
                     [class.border-l-orange-500]="!group.hasCritical">
                  
                  <!-- Product Header -->
                  <div class="bg-muted/30 px-4 py-3 flex items-center justify-between cursor-pointer"
                       (click)="toggleProductGroup(group.productId)">
                    <div class="flex items-center gap-3">
                      <svg 
                        class="h-5 w-5 text-muted-foreground transition-transform"
                        [class.rotate-90]="expandedProducts.has(group.productId)"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                      <div>
                        <h3 class="font-semibold text-base">{{ group.productName }}</h3>
                        <p class="text-xs text-muted-foreground">
                          {{ group.totalVariantsAffected }} {{ group.totalVariantsAffected === 1 ? 'wariant' : 'warianty' }} 
                          • {{ group.categoryName }}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span 
                        *ngIf="group.hasCritical"
                        class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                        KRYTYCZNE
                      </span>
                      <button
                        (click)="bulkOrderGroup(group); $event.stopPropagation()"
                        class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Zamów wszystkie
                      </button>
                    </div>
                  </div>

                  <!-- Variants List (Collapsible) -->
                  <div *ngIf="expandedProducts.has(group.productId)" class="divide-y divide-card-border">
                    <div *ngFor="let alert of group.variants" 
                         class="px-4 py-4 hover:bg-muted/20 transition-colors">
                      <div class="flex items-start justify-between gap-4">
                        <!-- Variant Info -->
                        <div class="flex-1">
                          <div class="flex items-center gap-3 mb-2">
                            <!-- Severity Icon -->
                            <div 
                              class="w-3 h-3 rounded-full"
                              [class.bg-red-500]="alert.severity === 'critical'"
                              [class.bg-orange-500]="alert.severity === 'warning'"
                              [class.bg-yellow-500]="alert.severity === 'info'"
                              [title]="alert.severity === 'critical' ? 'Krytyczny' : alert.severity === 'warning' ? 'Ostrzeżenie' : 'Info'"
                            ></div>
                            
                            <div class="flex-1">
                              <div class="flex items-center gap-2">
                                <span class="font-medium">{{ alert.variant.name || 'Wariant domyślny' }}</span>
                                <span class="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                                  SKU: {{ alert.variant.sku }}
                                </span>
                                <span class="text-sm text-muted-foreground">
                                  {{ alert.variant.price }} PLN
                                </span>
                              </div>
                              
                              <!-- Attributes -->
                              <div *ngIf="alert.variant.attributes_details && alert.variant.attributes_details.length > 0" 
                                   class="flex items-center gap-2 mt-1">
                                <span *ngFor="let attr of alert.variant.attributes_details" 
                                      class="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                                  {{ attr.attribute }}: {{ attr.value }}
                                </span>
                              </div>

                              <!-- Stock Info -->
                              <div class="flex items-center gap-4 mt-2 text-sm">
                                <div>
                                  <span class="text-muted-foreground">Stan:</span>
                                  <span 
                                    class="font-semibold ml-1"
                                    [class.text-red-600]="alert.severity === 'critical'"
                                    [class.text-orange-600]="alert.severity === 'warning'"
                                    [class.text-yellow-600]="alert.severity === 'info'">
                                    {{ alert.currentStock }} szt.
                                  </span>
                                </div>
                                <div>
                                  <span class="text-muted-foreground">Próg:</span>
                                  <span class="font-medium ml-1">{{ alert.threshold }} szt.</span>
                                  <button
                                    (click)="editVariantThreshold(alert)"
                                    class="ml-2 text-primary hover:underline text-xs"
                                    title="Edytuj próg">
                                    ✏️
                                  </button>
                                </div>
                                <div>
                                  <span class="text-muted-foreground">Brakuje:</span>
                                  <span class="font-medium ml-1 text-red-600">{{ alert.difference }} szt.</span>
                                </div>
                                <div>
                                  <span class="text-muted-foreground">Sugerowane:</span>
                                  <span class="font-medium ml-1 text-green-600">{{ alert.suggestedOrder }} szt.</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex items-center gap-2">
                          <button
                            (click)="autoOrderVariant(alert)"
                            class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                          >
                            Zamów {{ alert.suggestedOrder }} szt.
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistics Tab -->
          <div *ngIf="activeTab === 'statistics'">
            <app-advanced-statistics></app-advanced-statistics>
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
                    ? 'bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2'
                    : 'bg-muted text-foreground px-4 py-2 rounded-lg font-semibold hover:bg-muted/80 transition-colors flex items-center gap-2'"
                >
                  <span>{{ status.label }}</span>
                  <span 
                    class="px-2 py-0.5 rounded-full text-xs font-bold"
                    [class]="selectedSupportStatus === status.value 
                      ? 'bg-primary-foreground/20' 
                      : 'bg-foreground/10'"
                  >
                    {{ getTicketCountByStatus(status.value) }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="loadingTickets" class="flex justify-center py-16">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loadingTickets && getFilteredTickets().length === 0" class="text-center py-16 bg-card border border-card-border rounded-lg">
              <svg class="w-24 h-24 mx-auto text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
              </svg>
              <h3 class="text-xl font-semibold text-foreground mb-2">Brak zgłoszeń</h3>
              <p class="text-muted-foreground">
                {{ selectedSupportStatus === 'all' ? 'Nie ma jeszcze żadnych zgłoszeń od klientów' : 'Nie ma zgłoszeń z tym statusem' }}
              </p>
            </div>

            <!-- Tickets List -->
            <div *ngIf="!loadingTickets && getFilteredTickets().length > 0" class="bg-card border border-card-border rounded-lg overflow-hidden">
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
                      <td class="px-4 py-3">{{ ticket.message_count || ticket.messages?.length || 0 }}</td>
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
              
              <div class="space-y-3">
                <p class="text-foreground">
                  <span class="font-semibold">Nazwa programu:</span> Program Lojalnościowy BarrelGarden
                </p>
                
                <p class="text-foreground">
                  <span class="font-semibold">Opis:</span> Zbieraj punkty za każde zamówienie i wymieniaj je na atrakcyjne nagrody!
                </p>
                
                <p class="text-foreground">
                  <span class="font-semibold">Punkty za 1 PLN:</span> 1
                </p>
                
                <p class="text-foreground">
                  <span class="font-semibold">Status:</span> <span class="text-green-600">✓ Program aktywny</span>
                </p>
              </div>
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
                      <span class="font-medium">{{ getRewardTypeLabel(reward.rewardType || 'discount_fixed') }}</span>
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
              <label class="block text-sm font-medium mb-2">
                Zdjęcie produktu
                @if (editingProduct) {
                  <span class="text-xs text-gray-500 ml-2">(opcjonalne - pozostaw puste aby zachować obecne)</span>
                }
              </label>
              <input 
                type="file" 
                (change)="onProductImageSelected($event)"
                name="imageFile"
                accept="image/*"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
              @if (productForm.imagePreview) {
                <div class="mt-2">
                  <p class="text-xs text-gray-500 mb-1">
                    @if (productForm.imageFile) {
                      Nowe zdjęcie:
                    } @else {
                      Obecne zdjęcie:
                    }
                  </p>
                  <img [src]="productForm.imagePreview" alt="Podgląd" class="h-32 w-32 object-cover rounded">
                </div>
              }
            </div>

            <!-- SKU Variants Section -->
            @if (editingProduct) {
              <div class="border-t border-border pt-4 mt-4">
                <div class="flex justify-between items-center mb-4">
                  <div>
                    <h3 class="text-lg font-semibold">📦 Warianty Produktu 
                      @if (editingProduct.variants && editingProduct.variants.length > 0) {
                        <span class="text-muted-foreground">({{ editingProduct.variants.length }})</span>
                      }
                    </h3>
                    <p class="text-sm text-muted-foreground mt-1">
                      Każdy wariant to osobny produkt z własnym SKU, ceną i stanem magazynowym
                    </p>
                  </div>
                  <button 
                    type="button"
                    (click)="openSkuVariantModal(null)"
                    class="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    + Dodaj wariant
                  </button>
                </div>

                @if (!editingProduct.variants || editingProduct.variants.length === 0) {
                  <div class="bg-muted/30 p-6 rounded-lg text-center">
                    <p class="text-muted-foreground mb-3">
                      Brak wariantów. Dodaj pierwszy wariant, aby produkt był dostępny w sklepie.
                    </p>
                    <button 
                      type="button"
                      (click)="openSkuVariantModal(null)"
                      class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      Utwórz pierwszy wariant
                    </button>
                  </div>
                } @else {

                <div class="space-y-2">
                  @for (variant of editingProduct.variants; track variant.id) {
                    <div class="bg-muted/30 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <div class="flex justify-between items-start">
                        <div class="flex-1">
                          <div class="flex items-center gap-3 mb-2">
                            <span class="font-mono text-sm bg-background px-2 py-1 rounded border border-border">
                              {{ variant.sku }}
                            </span>
                            <span class="font-semibold">{{ variant.name }}</span>
                            @if (!variant.available) {
                              <span class="text-xs px-2 py-0.5 bg-destructive/20 text-destructive rounded">
                                Niedostępny
                              </span>
                            }
                          </div>

                          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span class="text-muted-foreground">Cena:</span>
                              <span class="ml-2 font-semibold text-primary">{{ variant.price }} PLN</span>
                            </div>
                            <div>
                              <span class="text-muted-foreground">Stan:</span>
                              <span class="ml-2 font-semibold" [class.text-destructive]="variant.stock === 0">
                                {{ variant.stock }} szt.
                              </span>
                            </div>
                            <div>
                              <span class="text-muted-foreground">Próg alertu:</span>
                              <span class="ml-2">{{ variant.low_stock_threshold }} szt.</span>
                            </div>
                            <div>
                              <span class="text-muted-foreground">Status:</span>
                              <span class="ml-2" [class.text-green-600]="variant.available" [class.text-destructive]="!variant.available">
                                {{ variant.available ? 'Aktywny' : 'Nieaktywny' }}
                              </span>
                            </div>
                          </div>

                          @if (variant.attributes_details && variant.attributes_details.length > 0) {
                            <div class="mt-2 flex flex-wrap gap-2">
                              @for (attr of variant.attributes_details; track $index) {
                                <span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                  <strong>{{ attr.attribute }}:</strong> {{ attr.value }}
                                </span>
                              }
                            </div>
                          }
                        </div>

                        <div class="flex gap-2 ml-4">
                          <button 
                            type="button"
                            (click)="openSkuVariantModal(variant)"
                            class="p-2 hover:bg-primary/10 rounded transition-colors"
                            title="Edytuj wariant"
                          >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </button>
                          <button 
                            type="button"
                            (click)="deleteSkuVariant(variant)"
                            class="p-2 hover:bg-destructive/10 text-destructive rounded transition-colors"
                            title="Usuń wariant"
                          >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
                }
              </div>
            }

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

    <!-- SKU Variant Edit Modal -->
    <div *ngIf="showVariantModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeVariantModal()">
      <div class="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">{{ editingSkuVariant ? 'Edytuj Wariant SKU' : 'Dodaj Wariant SKU' }}</h2>
            <button (click)="closeVariantModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form (submit)="saveSkuVariant($event)" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">SKU *</label>
                <input 
                  type="text" 
                  [(ngModel)]="variantForm.sku" 
                  name="sku"
                  [readonly]="!!editingSkuVariant"
                  required
                  placeholder="SKU-123-ABC"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  [class.bg-muted]="!!editingSkuVariant"
                />
                @if (editingSkuVariant) {
                  <p class="text-xs text-muted-foreground mt-1">SKU nie może być zmieniony</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Nazwa wariantu</label>
                <input 
                  type="text" 
                  [(ngModel)]="variantForm.name" 
                  name="name"
                  placeholder="np. Mały - Brązowy"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Cena (PLN) *</label>
                <input 
                  type="number" 
                  [(ngModel)]="variantForm.price" 
                  name="price"
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Stan magazynowy *</label>
                <input 
                  type="number" 
                  [(ngModel)]="variantForm.stock" 
                  name="stock"
                  required
                  min="0"
                  placeholder="0"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Próg alertu niskiego stanu</label>
                <input 
                  type="number" 
                  [(ngModel)]="variantForm.low_stock_threshold" 
                  name="low_stock_threshold"
                  min="0"
                  placeholder="5"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Dostępność</label>
                <div class="flex items-center gap-4 pt-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      [(ngModel)]="variantForm.available" 
                      name="available"
                      [value]="true"
                      class="w-4 h-4"
                    />
                    <span>Dostępny</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      [(ngModel)]="variantForm.available" 
                      name="available"
                      [value]="false"
                      class="w-4 h-4"
                    />
                    <span>Niedostępny</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Editable Attributes Section -->
            <div class="border-t border-border pt-4">
              <h3 class="text-sm font-semibold mb-3">Atrybuty wariantu</h3>
              
              @if (allAttributes.length === 0) {
                <div class="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  <p>Ładowanie dostępnych atrybutów...</p>
                </div>
              }
              
              @if (allAttributes.length > 0) {
                <div class="space-y-3">
                  @for (attribute of allAttributes; track attribute.id) {
                    <div>
                      <label class="block text-sm font-medium mb-2">
                        {{ attribute.name }}
                        @if (selectedVariantAttributes[attribute.name]) {
                          <span class="text-xs text-muted-foreground ml-2">(wybrano)</span>
                        }
                      </label>
                      <select 
                        [(ngModel)]="selectedVariantAttributes[attribute.name]"
                        [name]="'attr_' + attribute.id"
                        class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      >
                        @if (!selectedVariantAttributes[attribute.name]) {
                          <option [value]="undefined" disabled selected>-- Wybierz {{ attribute.name }} --</option>
                        }
                        @for (value of attributeValues[attribute.id]; track value.id) {
                          <option [value]="value.id">{{ value.value }}</option>
                        }
                      </select>
                    </div>
                  }
                </div>
                
                      }
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-border">
              <button 
                type="button"
                (click)="closeVariantModal()"
                class="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Anuluj
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {{ editingSkuVariant ? 'Zapisz zmiany' : 'Utwórz wariant' }}
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
              <label class="block text-sm font-medium mb-2">
                Zdjęcie kategorii
                @if (editingCategory) {
                  <span class="text-xs text-gray-500 ml-2">(opcjonalne - pozostaw puste aby zachować obecne)</span>
                }
              </label>
              <input 
                type="file" 
                (change)="onCategoryImageSelected($event)"
                name="imageFile"
                accept="image/*"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
              @if (categoryForm.imagePreview) {
                <div class="mt-2">
                  <p class="text-xs text-gray-500 mb-1">
                    @if (categoryForm.imageFile) {
                      Nowe zdjęcie:
                    } @else {
                      Obecne zdjęcie:
                    }
                  </p>
                  <img [src]="categoryForm.imagePreview" alt="Podgląd" class="h-32 w-32 object-cover rounded">
                </div>
              }
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

    <!-- Attribute Modal -->
    <div *ngIf="showAttributeModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeAttributeModal()">
      <div class="bg-background rounded-lg max-w-lg w-full" (click)="$event.stopPropagation()">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">{{ editingAttribute ? 'Edytuj Atrybut' : 'Dodaj Atrybut' }}</h2>
            <button (click)="closeAttributeModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form (submit)="saveAttribute($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Nazwa atrybutu *</label>
              <input 
                type="text" 
                [(ngModel)]="attributeForm.name" 
                name="name"
                required
                placeholder="np. Kolor, Rozmiar, Materiał"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
              <p class="text-xs text-muted-foreground mt-1">
                Nazwa atrybutu (np. "Kolor", "Rozmiar", "Materiał"). Będzie wyświetlana w konfiguracjach produktów.
              </p>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-border">
              <button 
                type="button"
                (click)="closeAttributeModal()"
                class="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Anuluj
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {{ editingAttribute ? 'Zapisz zmiany' : 'Dodaj atrybut' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Attribute Values Modal -->
    <div *ngIf="showAttributeValueModal && selectedAttributeForValues" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeAttributeValueModal()">
      <div class="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-2xl font-semibold">Wartości atrybutu: {{ selectedAttributeForValues.name }}</h2>
              <p class="text-sm text-muted-foreground mt-1">Zarządzaj możliwymi wartościami dla tego atrybutu</p>
            </div>
            <button (click)="closeAttributeValueModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Add Value Form -->
          <form (submit)="saveAttributeValue($event)" class="mb-6 p-4 bg-muted rounded-lg">
            <div class="flex gap-3">
              <div class="flex-1">
                <input 
                  type="text" 
                  [(ngModel)]="attributeValueForm.value" 
                  name="value"
                  required
                  placeholder="Nowa wartość (np. Czerwony, XL, Bawełna)"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <button 
                type="submit"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                + Dodaj wartość
              </button>
            </div>
          </form>

          <!-- Values List -->
          <div class="space-y-2">
            <h3 class="font-semibold text-sm mb-3">Istniejące wartości:</h3>
            <div *ngIf="selectedAttributeForValues.values && selectedAttributeForValues.values.length > 0" class="space-y-2">
              <div 
                *ngFor="let value of selectedAttributeForValues.values"
                class="flex items-center justify-between p-3 bg-card border border-card-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span class="font-medium">{{ value.value }}</span>
                <button
                  (click)="deleteAttributeValue(value.id)"
                  class="p-2 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                  title="Usuń wartość"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div *ngIf="!selectedAttributeForValues.values || selectedAttributeForValues.values.length === 0" class="text-center py-8 text-muted-foreground">
              Brak wartości. Dodaj pierwszą wartość powyżej.
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button 
              type="button"
              (click)="closeAttributeValueModal()"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Zamknij
            </button>
          </div>
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
                <div>
                  <span class="text-muted-foreground">Status płatności:</span>
                  <p class="font-medium">
                    <span 
                      [class]="selectedOrder.paid 
                        ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium'
                        : 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium'"
                    >
                      {{ selectedOrder.paid ? 'Opłacone' : 'Nieopłacone' }}
                    </span>
                  </p>
                </div>
                <div *ngIf="selectedOrder.trackingNumber">
                  <span class="text-muted-foreground">Numer przesyłki:</span>
                  <p class="font-medium font-mono">{{ selectedOrder.trackingNumber }}</p>
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

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Numer przesyłki</label>
                <input 
                  type="text" 
                  [(ngModel)]="orderEditForm.trackingNumber" 
                  name="trackingNumber"
                  placeholder="np. 1234567890"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div class="flex items-end">
                <label class="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="orderEditForm.paid" 
                    name="paid"
                    class="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <span class="ml-2 text-sm font-medium">Zamówienie opłacone</span>
                </label>
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
              [ngClass]="{'justify-end': isAdminMessage(message.author_id)}"
            >
              <div 
                class="max-w-[80%] rounded-lg p-4"
                [ngClass]="{
                  'bg-primary text-primary-foreground': isAdminMessage(message.author_id),
                  'bg-muted': !isAdminMessage(message.author_id)
                }"
              >
                <p class="text-sm font-medium mb-1" [ngClass]="{'opacity-90': isAdminMessage(message.author_id)}">
                  {{ getTicketAuthorName(message.author_id) }}
                </p>
                <p class="whitespace-pre-line">{{ message.body }}</p>
                <p class="text-xs mt-2" [ngClass]="isAdminMessage(message.author_id) ? 'opacity-80' : 'text-muted-foreground'">
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
    { id: 'attributes' as TabType, label: 'Atrybuty' },
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
  groupedLowStockAlerts$: Observable<GroupedLowStockAlert[]>;
  lowStockStats$: Observable<LowStockStatistics>;
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

  // Attributes management
  attributesList$: Observable<any[]> = of([]);
  showAttributeModal: boolean = false;
  showAttributeValueModal: boolean = false;
  editingAttribute: any = null;
  editingAttributeValue: any = null;
  attributeForm: Partial<{ name: string; description: string }> = {};
  attributeValueForm: Partial<{ value: string; attribute: number }> = {};
  selectedAttributeForValues: any = null;

  // Forms
  // Note: Product form only contains basic info. Price/stock are managed via SKU variants
  productForm: Partial<{
    name: string;
    description: string;
    categoryId: string;
    image?: string;
    imageFile?: File;
    imagePreview?: string;
  }> = {};
  categoryForm: Partial<InsertCategory & { imageFile?: File; imagePreview?: string }> = {};

  // SKU Variant management
  showVariantModal: boolean = false;
  editingSkuVariant: ProductSkuVariant | null = null;
  variantForm: Partial<ProductSkuVariant & { 
    selectedAttributes?: { attributeId: number; valueId: number }[] 
  }> = {};
  
  // Attributes for variant editing
  allAttributes: any[] = [];
  attributeValues: { [attributeId: number]: any[] } = {};
  selectedVariantAttributes: { [attributeName: string]: number } = {}; // attributeName -> valueId

  // Statistics filters
  statsStartDate: string = '';
  statsEndDate: string = '';

  // Low stock management
  lowStockThreshold: number = 10;
  selectedLowStockFilter: 'all' | 'critical' | 'warning' = 'all';
  loadingLowStock: boolean = false;
  sendingAlert: boolean = false;
  expandedProducts: Set<number> = new Set();
  lowStockFilters = [
    { label: 'Wszystkie', value: 'all' as const },
    { label: 'Krytyczne (0 szt.)', value: 'critical' as const },
    { label: 'Ostrzeżenia', value: 'warning' as const }
  ];

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
    this.groupedLowStockAlerts$ = of([]);
    this.lowStockStats$ = this.apiService.getLowStockStatistics();
    this.statistics$ = this.apiService.getSalesStatistics();
    this.loyaltyRewards$ = this.apiService.getLoyaltyRewards();
  }

  ngOnInit(): void {
    this.categories$.subscribe(cats => this.allCategories = cats);
    this.loadSupportTickets();
    this.loadLoyaltyProgram();
    this.loadLowStockAlerts();
    this.loadAttributes();
  }

  // Attributes management methods
  loadAttributes(): void {
    this.attributesList$ = this.apiService.getAttributes();
  }

  openAttributeModal(attribute: any): void {
    this.editingAttribute = attribute;
    if (attribute) {
      this.attributeForm = {
        name: attribute.name,
        description: attribute.description || ''
      };
    } else {
      this.attributeForm = {};
    }
    this.showAttributeModal = true;
  }

  closeAttributeModal(): void {
    this.showAttributeModal = false;
    this.editingAttribute = null;
    this.attributeForm = {};
  }

  saveAttribute(event: Event): void {
    event.preventDefault();
    
    const attributeData: any = {
      name: this.attributeForm.name!
    };

    if (this.editingAttribute) {
      // Update existing attribute
      this.apiService.updateAttribute(this.editingAttribute.id, attributeData).subscribe({
        next: () => {
          alert('Atrybut zaktualizowany pomyślnie!');
          this.loadAttributes();
          this.closeAttributeModal();
        },
        error: (err) => {
          console.error('Błąd aktualizacji atrybutu:', err);
          alert('Błąd podczas aktualizacji atrybutu');
        }
      });
    } else {
      // Create new attribute
      this.apiService.createAttribute(attributeData).subscribe({
        next: () => {
          alert('Atrybut utworzony pomyślnie!');
          this.loadAttributes();
          this.closeAttributeModal();
        },
        error: (err) => {
          console.error('Błąd tworzenia atrybutu:', err);
          alert('Błąd podczas tworzenia atrybutu');
        }
      });
    }
  }

  deleteAttribute(id: number): void {
    if (confirm('Czy na pewno chcesz usunąć ten atrybut? Zostaną usunięte wszystkie jego wartości.')) {
      this.apiService.deleteAttribute(id).subscribe({
        next: () => {
          alert('Atrybut usunięty pomyślnie!');
          this.loadAttributes();
        },
        error: (err) => {
          console.error('Błąd usuwania atrybutu:', err);
          alert('Błąd podczas usuwania atrybutu');
        }
      });
    }
  }

  manageAttributeValues(attribute: any): void {
    this.selectedAttributeForValues = attribute;
    this.attributeValueForm = {
      attribute: attribute.id
    };
    this.showAttributeValueModal = true;
  }

  closeAttributeValueModal(): void {
    this.showAttributeValueModal = false;
    this.selectedAttributeForValues = null;
    this.attributeValueForm = {};
    this.loadAttributes(); // Refresh to get updated values
  }

  saveAttributeValue(event: Event): void {
    event.preventDefault();
    
    if (!this.selectedAttributeForValues) return;

    const valueData: any = {
      attribute: this.selectedAttributeForValues.id,
      value: this.attributeValueForm.value!
    };

    this.apiService.createAttributeValue(valueData).subscribe({
      next: () => {
        alert('Wartość dodana pomyślnie!');
        this.attributeValueForm.value = '';
        
        // Refresh the current attribute to show new value
        this.apiService.getAttribute(this.selectedAttributeForValues!.id).subscribe(updated => {
          this.selectedAttributeForValues = updated;
        });
        this.loadAttributes();
      },
      error: (err) => {
        console.error('Błąd dodawania wartości:', err);
        alert('Błąd podczas dodawania wartości');
      }
    });
  }

  deleteAttributeValue(valueId: number): void {
    if (confirm('Czy na pewno chcesz usunąć tę wartość?')) {
      this.apiService.deleteAttributeValue(valueId).subscribe({
        next: () => {
          alert('Wartość usunięta pomyślnie!');
          
          // Refresh the current attribute
          if (this.selectedAttributeForValues) {
            this.apiService.getAttribute(this.selectedAttributeForValues.id).subscribe(updated => {
              this.selectedAttributeForValues = updated;
            });
          }
          this.loadAttributes();
        },
        error: (err) => {
          console.error('Błąd usuwania wartości:', err);
          alert('Błąd podczas usuwania wartości');
        }
      });
    }
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
      'completed': 'Dostarczone',
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
        categoryId: product.categoryId,
        image: product.image,
        imagePreview: product.image // Show current image as preview
      };
    } else {
      this.productForm = {};
    }
    this.showProductModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.editingProduct = null;
    this.productForm = {};
    // Clear file input
    const fileInput = document.querySelector('input[type="file"][name="imageFile"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onProductImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.productForm.imageFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.productForm.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onCategoryImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.categoryForm.imageFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.categoryForm.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProduct(event: Event): void {
    event.preventDefault();
    
    const productData: any = {
      name: this.productForm.name!,
      description: this.productForm.description,
      categoryId: this.productForm.categoryId!,
      imageFile: this.productForm.imageFile
      // Note: price, oldPrice, stock are now managed via SKU variants
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

  // SKU Variant methods
  openSkuVariantModal(variant: ProductSkuVariant | null): void {
    this.editingSkuVariant = variant;
    
    // Prepare form first
    if (variant) {
      this.variantForm = {
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        price: variant.price,
        stock: variant.stock,
        low_stock_threshold: variant.low_stock_threshold,
        available: variant.available
      };
    } else {
      // Creating new variant
      const productId = this.editingProduct?.numericId;
      const timestamp = Date.now();
      this.variantForm = {
        sku: `SKU-${productId}-${timestamp}`,
        name: 'Nowy wariant',
        price: '0.00',
        stock: 0,
        low_stock_threshold: 5,
        available: true
      };
    }
    
    // Load attributes and their values BEFORE showing modal
    this.apiService.getAttributes().subscribe(attributes => {
      this.allAttributes = attributes;
      
      // Load all attribute values in parallel
      if (attributes.length > 0) {
        const valueRequests = attributes.map(attr => 
          this.apiService.getAttributeValues(attr.id)
        );
        
        forkJoin(valueRequests).subscribe(valuesArrays => {
          // Map values to attributes
          attributes.forEach((attr, index) => {
            this.attributeValues[attr.id] = valuesArrays[index];
          });
          
          // Now map current variant attributes (after values are loaded)
          if (variant && variant.attributes_details) {
            this.selectedVariantAttributes = {};
            variant.attributes_details.forEach(attrDetail => {
              // Find the attribute by name
              const attribute = this.allAttributes.find(a => a.name === attrDetail.attribute);
              if (attribute) {
                // Find the value by name
                const values = this.attributeValues[attribute.id] || [];
                const value = values.find(v => v.value === attrDetail.value);
                if (value) {
                  this.selectedVariantAttributes[attrDetail.attribute] = value.id;
                }
              }
            });
          } else {
            this.selectedVariantAttributes = {};
          }
          
          // Show modal AFTER all data is loaded and mapped
          this.showVariantModal = true;
        });
      } else {
        // No attributes, just show modal
        this.selectedVariantAttributes = {};
        this.showVariantModal = true;
      }
    });
  }

  closeVariantModal(): void {
    this.showVariantModal = false;
    this.editingSkuVariant = null;
    this.variantForm = {};
    this.selectedVariantAttributes = {};
    this.allAttributes = [];
    this.attributeValues = {};
  }

  saveSkuVariant(event: Event): void {
    event.preventDefault();
    
    // Collect selected attribute value IDs
    const attributeValueIds: number[] = [];
    Object.values(this.selectedVariantAttributes).forEach(valueId => {
      if (valueId) {
        attributeValueIds.push(valueId);
      }
    });
    
    if (this.editingSkuVariant) {
      // Update existing variant
      const updates: any = {
        name: this.variantForm.name,
        price: this.variantForm.price,
        stock: this.variantForm.stock,
        low_stock_threshold: this.variantForm.low_stock_threshold,
        available: this.variantForm.available,
        attribute_values: attributeValueIds
      };

      this.apiService.updateVariant(this.editingSkuVariant.id, updates).subscribe({
        next: () => {
          alert('Wariant zaktualizowany pomyślnie!');
          this.closeVariantModal();
          // Refresh product to get updated variants
          if (this.editingProduct?.numericId) {
            this.apiService.getProduct(this.editingProduct.numericId.toString()).subscribe({
              next: (product) => {
                this.editingProduct = product;
                this.products$ = this.apiService.getProducts();
              },
              error: (err) => console.error('Błąd odświeżania produktu:', err)
            });
          }
        },
        error: (err) => {
          console.error('Błąd aktualizacji wariantu:', err);
          alert('Błąd podczas aktualizacji wariantu');
        }
      });
    } else {
      // Create new variant
      if (!this.editingProduct?.numericId) {
        alert('Brak ID produktu');
        return;
      }

      const variantData: any = {
        sku: this.variantForm.sku,
        name: this.variantForm.name,
        price: this.variantForm.price,
        stock: this.variantForm.stock,
        low_stock_threshold: this.variantForm.low_stock_threshold,
        available: this.variantForm.available,
        attribute_values: attributeValueIds
      };

      this.apiService.createVariant(this.editingProduct.numericId, variantData).subscribe({
        next: () => {
          alert('Wariant utworzony pomyślnie!');
          this.closeVariantModal();
          // Refresh product to get new variant
          if (this.editingProduct?.numericId) {
            this.apiService.getProduct(this.editingProduct.numericId.toString()).subscribe({
              next: (product) => {
                this.editingProduct = product;
                this.products$ = this.apiService.getProducts();
              },
              error: (err) => console.error('Błąd odświeżania produktu:', err)
            });
          }
        },
        error: (err) => {
          console.error('Błąd tworzenia wariantu:', err);
          alert('Błąd podczas tworzenia wariantu');
        }
      });
    }
  }

  deleteSkuVariant(variant: ProductSkuVariant): void {
    if (!confirm(`Czy na pewno chcesz usunąć wariant ${variant.sku}?`)) {
      return;
    }

    this.apiService.deleteVariant(variant.id).subscribe({
      next: () => {
        alert('Wariant usunięty pomyślnie!');
        // Refresh product to remove deleted variant
        if (this.editingProduct?.numericId) {
          this.apiService.getProduct(this.editingProduct.numericId.toString()).subscribe({
            next: (product) => {
              this.editingProduct = product;
              this.products$ = this.apiService.getProducts();
            },
            error: (err) => console.error('Błąd odświeżania produktu:', err)
          });
        }
      },
      error: (err) => {
        console.error('Błąd usuwania wariantu:', err);
        alert('Błąd podczas usuwania wariantu');
      }
    });
  }

  // Category methods
  openCategoryModal(category?: Category): void {
    this.editingCategory = category || null;
    if (category) {
      this.categoryForm = {
        name: category.name,
        description: category.description || '',
        image: category.image,
        imagePreview: category.image // Show current image as preview
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
    // Clear file input
    const fileInput = document.querySelector('input[type="file"][name="imageFile"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  saveCategory(event: Event): void {
    event.preventDefault();
    
    const categoryData: any = {
      name: this.categoryForm.name!,
      description: this.categoryForm.description,
      imageFile: this.categoryForm.imageFile
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
    console.log('Pobieranie szczegółów zamówienia ID:', orderId);
    this.apiService.getOrder(orderId).subscribe({
      next: (orderData) => {
        console.log('Dane zamówienia:', orderData);
        this.selectedOrder = orderData;
        this.orderItems = orderData.items;
        this.showOrderModal = true;
      },
      error: (err) => {
        console.error('Błąd pobierania szczegółów zamówienia:', err);
        console.error('Status:', err.status);
        console.error('Szczegóły:', err.error);
        alert(`Błąd podczas pobierania szczegółów zamówienia.\nStatus: ${err.status}\nSprawdź konsolę przeglądarki (F12) po więcej szczegółów.`);
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
        paid: this.selectedOrder.paid,
        trackingNumber: this.selectedOrder.trackingNumber || '',
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
      paid: this.orderEditForm.paid,
      trackingNumber: this.orderEditForm.trackingNumber,
      notes: this.orderEditForm.notes
    };

    const orderId = this.selectedOrder.id;
    
    this.apiService.updateOrder(orderId, updates).subscribe({
      next: (updatedOrder) => {
        // Preserve the ID from the original order
        this.selectedOrder = { 
          ...this.selectedOrder!, 
          ...updatedOrder,
          id: orderId // Ensure ID is preserved
        };
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

  // Low stock methods - Enhanced
  loadLowStockAlerts(): void {
    this.loadingLowStock = true;
    this.groupedLowStockAlerts$ = this.apiService.getGroupedLowStockAlerts(
      this.selectedLowStockFilter
    );
    this.lowStockStats$ = this.apiService.getLowStockStatistics();
    
    // Also keep legacy alerts for backward compatibility
    this.lowStockAlerts$ = this.apiService.getLowStockAlerts(this.lowStockThreshold);
    
    // Set loading to false after a short delay
    setTimeout(() => {
      this.loadingLowStock = false;
    }, 500);
  }

  toggleProductGroup(productId: number): void {
    if (this.expandedProducts.has(productId)) {
      this.expandedProducts.delete(productId);
    } else {
      this.expandedProducts.add(productId);
    }
  }

  autoOrderVariant(variantAlert: LowStockVariantAlert): void {
    const confirmed = confirm(
      `Czy chcesz automatycznie zamówić ${variantAlert.suggestedOrder} sztuk wariantu?\n\n` +
      `Produkt: ${variantAlert.productName}\n` +
      `SKU: ${variantAlert.variant.sku}\n` +
      `Obecny stan: ${variantAlert.currentStock} szt.\n` +
      `Nowy stan: ${variantAlert.currentStock + variantAlert.suggestedOrder} szt.`
    );
    
    if (confirmed) {
      const newStock = variantAlert.currentStock + variantAlert.suggestedOrder;
      this.apiService.updateVariant(variantAlert.variant.id, { stock: newStock }).subscribe({
        next: () => {
          this.loadLowStockAlerts();
          this.products$ = this.apiService.getProducts();
          window.alert(`✅ Zamówiono ${variantAlert.suggestedOrder} sztuk.\nNowy stan: ${newStock} szt.`);
        },
        error: (err) => {
          console.error('Błąd automatycznego zamawiania:', err);
          window.alert('❌ Błąd podczas automatycznego zamawiania');
        }
      });
    }
  }

  bulkOrderGroup(group: GroupedLowStockAlert): void {
    const totalToOrder = group.variants.reduce((sum, v) => sum + v.suggestedOrder, 0);
    const confirmed = confirm(
      `Czy chcesz zamówić wszystkie warianty produktu "${group.productName}"?\n\n` +
      `Liczba wariantów: ${group.totalVariantsAffected}\n` +
      `Łączna ilość do zamówienia: ${totalToOrder} szt.\n\n` +
      `To zaktualizuje stan magazynowy wszystkich wariantów.`
    );
    
    if (confirmed) {
      let completedCount = 0;
      let errorCount = 0;
      
      group.variants.forEach(variantAlert => {
        const newStock = variantAlert.currentStock + variantAlert.suggestedOrder;
        this.apiService.updateVariant(variantAlert.variant.id, { stock: newStock }).subscribe({
          next: () => {
            completedCount++;
            if (completedCount + errorCount === group.variants.length) {
              this.loadLowStockAlerts();
              this.products$ = this.apiService.getProducts();
              window.alert(`✅ Zamówienie zakończone!\n\nZaktualizowano: ${completedCount} wariantów\nBłędy: ${errorCount}`);
            }
          },
          error: (err) => {
            console.error('Błąd zamawiania wariantu:', err);
            errorCount++;
            if (completedCount + errorCount === group.variants.length) {
              this.loadLowStockAlerts();
              window.alert(`⚠️ Zamówienie zakończone z błędami.\n\nZaktualizowano: ${completedCount} wariantów\nBłędy: ${errorCount}`);
            }
          }
        });
      });
    }
  }

  editVariantThreshold(variantAlert: LowStockVariantAlert): void {
    const newThreshold = prompt(
      `Edytuj próg niskiego stanu dla wariantu:\n\n` +
      `Produkt: ${variantAlert.productName}\n` +
      `SKU: ${variantAlert.variant.sku}\n\n` +
      `Obecny próg: ${variantAlert.threshold} szt.`,
      variantAlert.threshold.toString()
    );
    
    if (newThreshold !== null) {
      const threshold = parseInt(newThreshold, 10);
      if (isNaN(threshold) || threshold < 0) {
        window.alert('❌ Nieprawidłowa wartość progu');
        return;
      }
      
      this.apiService.updateVariant(variantAlert.variant.id, { low_stock_threshold: threshold }).subscribe({
        next: () => {
          this.loadLowStockAlerts();
          window.alert(`✅ Próg zaktualizowany do ${threshold} szt.`);
        },
        error: (err) => {
          console.error('Błąd aktualizacji progu:', err);
          window.alert('❌ Błąd podczas aktualizacji progu');
        }
      });
    }
  }

  triggerLowStockAlert(): void {
    this.sendingAlert = true;
    this.apiService.triggerLowStockAlert().subscribe({
      next: (response) => {
        this.sendingAlert = false;
        if (response.success) {
          window.alert(`✅ ${response.message}`);
        } else {
          window.alert(`❌ ${response.message}`);
        }
      },
      error: (err) => {
        console.error('Błąd wyzwalania alertu:', err);
        this.sendingAlert = false;
        window.alert('❌ Błąd podczas wyzwalania alertu');
      }
    });
  }

  exportLowStockToCSV(): void {
    this.groupedLowStockAlerts$.subscribe(groups => {
      if (groups.length === 0) {
        window.alert('Brak danych do eksportu');
        return;
      }

      // CSV header
      const headers = ['Produkt', 'Wariant', 'SKU', 'Atrybuty', 'Stan', 'Próg', 'Brakuje', 'Sugerowane zamówienie', 'Cena', 'Priorytet'];
      const rows: string[][] = [headers];

      // CSV data
      groups.forEach(group => {
        group.variants.forEach(variantAlert => {
          const attributes = variantAlert.variant.attributes_details
            ? variantAlert.variant.attributes_details.map(a => `${a.attribute}:${a.value}`).join('; ')
            : '';
          
          rows.push([
            group.productName,
            variantAlert.variant.name || 'Domyślny',
            variantAlert.variant.sku,
            attributes,
            variantAlert.currentStock.toString(),
            variantAlert.threshold.toString(),
            variantAlert.difference.toString(),
            variantAlert.suggestedOrder.toString(),
            variantAlert.variant.price,
            variantAlert.severity === 'critical' ? 'KRYTYCZNY' : variantAlert.severity === 'warning' ? 'OSTRZEŻENIE' : 'INFO'
          ]);
        });
      });

      // Generate CSV content
      const csvContent = rows.map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', url);
      link.setAttribute('download', `niskie_stany_magazynowe_${date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.alert('✅ Plik CSV został pobrany');
    });
  }

  // Legacy method for backward compatibility
  autoOrderProduct(stockAlert: LowStockAlert): void {
    const confirmed = confirm(
      `Czy chcesz automatycznie zamówić ${stockAlert.suggestedOrder} sztuk produktu "${stockAlert.product.name}"?`
    );
    
    if (confirmed) {
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

  downloadStatisticsPDF(): void {
    const startDate = this.statsStartDate ? new Date(this.statsStartDate) : undefined;
    const endDate = this.statsEndDate ? new Date(this.statsEndDate) : undefined;
    this.apiService.downloadStatisticsPDF(startDate, endDate);
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

  getTicketCountByStatus(status: string): number {
    if (status === 'all') {
      return this.allTickets.length;
    }
    return this.allTickets.filter(t => t.status === status).length;
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
    // Compare with ticket creator's user id
    return String(this.selectedTicket.user.id) !== String(authorId);
  }

  getTicketAuthorName(authorId: number): string {
    if (!this.selectedTicket) return 'Nieznany';
    
    // Find participant by matching author_id
    const participant = this.selectedTicket.participants?.find(p => 
      String(p.id) === String(authorId)
    );
    
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
      },
      error: (err) => {
        console.error('Error loading loyalty program:', err);
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
        pointsCost: reward.pointsCost || 100,
        rewardType: reward.rewardType || 'discount_percentage',
        rewardValue: reward.rewardValue || 0,
        isActive: reward.isActive !== undefined ? reward.isActive : true,
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
    const value = reward.rewardValue || 0;
    switch (reward.rewardType) {
      case 'discount_percentage':
        return `${value}%`;
      case 'discount_fixed':
        return `${value} PLN`;
      case 'free_shipping':
        return 'Darmowa dostawa';
      case 'free_product':
        return `Produkt #${value}`;
      default:
        return value.toString();
    }
  }
}
