import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of, forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../services/api.service';
import { ModalService } from '../../services/modal.service';
import { LanguageService } from '../../services/language.service';
import { Product, Category, Order, InsertProduct, InsertCategory, SalesStatistics, LowStockAlert, LowStockVariantAlert, LowStockStatistics, GroupedLowStockAlert, ProductSkuVariant, OrderItem, ProductAttribute, ProductVariant, Ticket, TicketReply, TicketStatusUpdate, LoyaltyProgram, LoyaltyReward, InsertLoyaltyProgram, InsertLoyaltyReward } from '../../models';
import { AdvancedStatisticsComponent } from './advanced-statistics.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';

type TabType = 'products' | 'categories' | 'orders' | 'lowStock' | 'statistics' | 'support' | 'loyalty' | 'attributes';

@Component({
  selector: 'bg-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, AdvancedStatisticsComponent, PaginationComponent],
  template: `
    <div class="flex-1 bg-background py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Header -->
          <div class="mb-8">
            <h1 class="font-heading font-bold text-3xl sm:text-4xl mb-2" data-testid="text-admin-title">
              {{ 'ADMIN.TITLE' | translate }}
            </h1>
            <p class="text-muted-foreground">{{ 'ADMIN.SUBTITLE' | translate }}</p>
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
              <h2 class="text-2xl font-semibold">{{ 'ADMIN.PRODUCT_MANAGEMENT' | translate }}</h2>
              <button 
                (click)="openProductModal()"
                class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
                data-testid="button-add-product"
              >
                + {{ 'ADMIN.ADD_PRODUCT' | translate }}
              </button>
            </div>

            <div class="bg-card border border-card-border rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-muted">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.IMAGE' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.NAME' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.CATEGORY' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.PRICE_RANGE' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.VARIANTS' | translate }}</th>
                      <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'ADMIN.ACTIONS' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let product of paginatedProducts" class="border-t border-card-border hover:bg-muted/50">
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
                            {{ 'ADMIN.NO_VARIANTS' | translate }}
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <div class="text-sm">
                          <span class="font-medium">{{ product.variantCount || 0 }}</span>
                          <span class="text-muted-foreground ml-1">
                            {{ (product.variantCount || 0) === 1 ? ('ADMIN.VARIANT' | translate) : ('ADMIN.VARIANTS_PLURAL' | translate) }}
                          </span>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="flex justify-end gap-2">
                          <button
                            (click)="openProductModal(product)"
                            class="p-2 hover:bg-muted rounded-md transition-colors"
                            data-testid="button-edit-product"
                            [title]="'ADMIN.EDIT' | translate"
                          >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </button>
                          <button
                            (click)="deleteProduct(product.id)"
                            class="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                            data-testid="button-delete-product"
                            [title]="'ADMIN.DELETE' | translate"
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

            <!-- Products Pagination -->
            <app-pagination
              [currentPage]="productsCurrentPage"
              [totalItems]="productsTotalItems"
              [pageSize]="productsPageSize"
              (pageChange)="onProductsPageChange($event)"
              (pageSizeChange)="onProductsPageSizeChange($event)">
            </app-pagination>
          </div>

          <!-- Categories Tab -->
          <div *ngIf="activeTab === 'categories'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-semibold">{{ 'ADMIN.CATEGORY_MANAGEMENT' | translate }}</h2>
              <button 
                (click)="openCategoryModal()"
                class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                + {{ 'ADMIN.ADD_CATEGORY' | translate }}
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div *ngFor="let category of paginatedCategories" 
                   class="bg-card border border-card-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <img [src]="category.image" [alt]="category.name" class="w-full h-48 object-cover" />
                <div class="p-4">
                  <h3 class="font-semibold text-lg mb-2">{{ category.name }}</h3>
                  <p class="text-sm text-muted-foreground mb-4">{{ category.description }}</p>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-muted-foreground">{{ category.productCount }} {{ 'ADMIN.PRODUCTS_COUNT' | translate }}</span>
                    <div class="flex gap-2">
                      <button
                        (click)="openCategoryModal(category)"
                        class="p-2 hover:bg-muted rounded-md transition-colors"
                        [title]="'ADMIN.EDIT' | translate"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        (click)="deleteCategory(category.id)"
                        class="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
                        [title]="'ADMIN.DELETE' | translate"
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

            <!-- Categories Pagination -->
            <app-pagination
              [currentPage]="categoriesCurrentPage"
              [totalItems]="categoriesTotalItems"
              [pageSize]="categoriesPageSize"
              (pageChange)="onCategoriesPageChange($event)"
              (pageSizeChange)="onCategoriesPageSizeChange($event)">
            </app-pagination>
          </div>

          <!-- Attributes Tab -->
          <div *ngIf="activeTab === 'attributes'" class="space-y-6">
            <div class="flex justify-between items-center">
              <h2 class="text-2xl font-semibold">{{ 'ADMIN.ATTRIBUTES_MANAGEMENT' | translate }}</h2>
              <button
                (click)="openAttributeModal(null)"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                + {{ 'ADMIN.ADD_ATTRIBUTE' | translate }}
              </button>
            </div>

            <div class="bg-card border border-card-border rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-muted">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.ATTRIBUTE_NAME' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.VALUES' | translate }}</th>
                      <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'ADMIN.ACTIONS' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let attribute of attributesList$ | async" class="border-t border-card-border hover:bg-muted/50">
                      <td class="px-4 py-3 font-medium">{{ attribute.name }}</td>
                      <td class="px-4 py-3">
                        <span class="text-sm text-muted-foreground">
                          {{ attribute.values?.length || 0 }} {{ 'ADMIN.VALUES_COUNT' | translate }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="flex justify-end gap-2">
                          <button
                            (click)="manageAttributeValues(attribute)"
                            class="p-2 hover:bg-muted rounded-md transition-colors"
                            [title]="'ADMIN.MANAGE_VALUES' | translate"
                          >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                          </button>
                          <button
                            (click)="openAttributeModal(attribute)"
                            class="p-2 hover:bg-muted rounded-md transition-colors"
                            [title]="'ADMIN.EDIT' | translate"
                          >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </button>
                          <button
                            (click)="deleteAttribute(attribute.id)"
                            class="p-2 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                            [title]="'ADMIN.DELETE' | translate"
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
            <h2 class="text-2xl font-semibold">{{ 'ADMIN.ORDERS_OVERVIEW' | translate }}</h2>

            <div class="bg-card border border-card-border rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-muted">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.ORDER_NUMBER' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.CUSTOMER' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.EMAIL' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.VALUE' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.PAID' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.STATUS' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.DATE' | translate }}</th>
                      <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'ADMIN.ACTIONS' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let order of paginatedOrders" class="border-t border-card-border hover:bg-muted/50">
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
                          {{ order.paid ? ('ADMIN.YES' | translate) : ('ADMIN.NO' | translate) }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <select 
                          [value]="order.status"
                          (change)="updateOrderStatus(order.id, $event)"
                          class="px-2 py-1 border border-border rounded text-sm bg-background"
                          data-testid="select-order-status"
                        >
                          <option value="pending">{{ 'ADMIN.STATUS_PENDING' | translate }}</option>
                          <option value="processing">{{ 'ADMIN.STATUS_PROCESSING' | translate }}</option>
                          <option value="shipped">{{ 'ADMIN.STATUS_SHIPPED' | translate }}</option>
                          <option value="completed">{{ 'ADMIN.STATUS_COMPLETED' | translate }}</option>
                          <option value="cancelled">{{ 'ADMIN.STATUS_CANCELLED' | translate }}</option>
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
                          {{ 'ADMIN.DETAILS' | translate }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Orders Pagination -->
            <app-pagination
              [currentPage]="ordersCurrentPage"
              [totalItems]="ordersTotalItems"
              [pageSize]="ordersPageSize"
              (pageChange)="onOrdersPageChange($event)"
              (pageSizeChange)="onOrdersPageSizeChange($event)">
            </app-pagination>
          </div>

          <!-- Low Stock Tab -->
          <!-- Low Stock Tab - Enhanced -->
          <div *ngIf="activeTab === 'lowStock'" class="space-y-6">
            <!-- Header with Actions -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 class="text-2xl font-semibold">{{ 'ADMIN.LOW_STOCK_TITLE' | translate }}</h2>
                <p class="text-sm text-muted-foreground mt-1">{{ 'ADMIN.LOW_STOCK_DESC' | translate }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  (click)="triggerLowStockAlert()"
                  [disabled]="sendingAlert"
                  class="bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-400 px-4 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center gap-2"
                  [title]="'ADMIN.SEND_EMAIL_ALERT' | translate"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  {{ sendingAlert ? ('ADMIN.SENDING' | translate) : ('ADMIN.SEND_ALERT' | translate) }}
                </button>
                <button
                  (click)="exportLowStockToCSV()"
                  class="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center gap-2"
                  [title]="'ADMIN.EXPORT_TO_CSV' | translate"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  {{ 'ADMIN.EXPORT_CSV' | translate }}
                </button>
              </div>
            </div>

            <!-- Statistics Cards -->
            <div *ngIf="lowStockStats$ | async as stats" class="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div class="bg-card border border-card-border rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs text-muted-foreground">{{ 'ADMIN.ALL_VARIANTS' | translate }}</p>
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
                    <p class="text-xs text-muted-foreground">{{ 'ADMIN.OK_STATUS' | translate }}</p>
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
                    <p class="text-xs text-muted-foreground">{{ 'ADMIN.LOW_STOCK' | translate }}</p>
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
                    <p class="text-xs text-muted-foreground">{{ 'ADMIN.WARNINGS' | translate }}</p>
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
                    <p class="text-xs text-muted-foreground">{{ 'ADMIN.CRITICAL' | translate }}</p>
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
              <label class="text-sm font-medium">{{ 'ADMIN.FILTER_LABEL' | translate }}</label>
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
                <h3 class="mt-2 text-lg font-medium">{{ 'ADMIN.NO_ALERTS' | translate }}</h3>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ selectedLowStockFilter === 'all' ? ('ADMIN.NO_ALERTS_ALL' | translate) : 
                     selectedLowStockFilter === 'critical' ? ('ADMIN.NO_ALERTS_CRITICAL' | translate) :
                     ('ADMIN.NO_ALERTS_WARNING' | translate) }}
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
                          {{ group.totalVariantsAffected }} {{ group.totalVariantsAffected === 1 ? ('ADMIN.VARIANT_AFFECTED' | translate) : ('ADMIN.VARIANTS_AFFECTED' | translate) }} 
                          • {{ group.categoryName }}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span 
                        *ngIf="group.hasCritical"
                        class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                        {{ 'ADMIN.CRITICAL_STATUS' | translate }}
                      </span>
                      <button
                        (click)="bulkOrderGroup(group); $event.stopPropagation()"
                        class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        {{ 'ADMIN.ORDER_ALL' | translate }}
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
                                <span class="font-medium">{{ alert.variant.name || ('ADMIN.DEFAULT_VARIANT' | translate) }}</span>
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
                                  <span class="text-muted-foreground">{{ 'ADMIN.STOCK_STATUS' | translate }}:</span>
                                  <span 
                                    class="font-semibold ml-1"
                                    [class.text-red-600]="alert.severity === 'critical'"
                                    [class.text-orange-600]="alert.severity === 'warning'"
                                    [class.text-yellow-600]="alert.severity === 'info'">
                                    {{ alert.currentStock }} {{ 'ADMIN.PIECES' | translate }}
                                  </span>
                                </div>
                                <div>
                                  <span class="text-muted-foreground">{{ 'ADMIN.THRESHOLD' | translate }}:</span>
                                  <span class="font-medium ml-1">{{ alert.threshold }} {{ 'ADMIN.PIECES' | translate }}</span>
                                  <button
                                    (click)="editVariantThreshold(alert)"
                                    class="ml-2 text-primary hover:underline text-xs"
                                    [title]="'ADMIN.EDIT_THRESHOLD' | translate">
                                    ✏️
                                  </button>
                                </div>
                                <div>
                                  <span class="text-muted-foreground">{{ 'ADMIN.MISSING' | translate }}:</span>
                                  <span class="font-medium ml-1 text-red-600">{{ alert.difference }} {{ 'ADMIN.PIECES' | translate }}</span>
                                </div>
                                <div>
                                  <span class="text-muted-foreground">{{ 'ADMIN.SUGGESTED' | translate }}:</span>
                                  <span class="font-medium ml-1 text-green-600">{{ alert.suggestedOrder }} {{ 'ADMIN.PIECES' | translate }}</span>
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
                            {{ 'ADMIN.ORDER_ALL' | translate }} {{ alert.suggestedOrder }} {{ 'ADMIN.PIECES' | translate }}
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
              <h2 class="text-2xl font-semibold">{{ 'ADMIN.SUPPORT_MANAGEMENT' | translate }}</h2>
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
              <h3 class="text-xl font-semibold text-foreground mb-2">{{ 'ADMIN.NO_TICKETS' | translate }}</h3>
              <p class="text-muted-foreground">
                {{ selectedSupportStatus === 'all' ? ('ADMIN.NO_TICKETS_DESC' | translate) : ('ADMIN.NO_TICKETS_STATUS' | translate) }}
              </p>
            </div>

            <!-- Tickets List -->
            <div *ngIf="!loadingTickets && getFilteredTickets().length > 0" class="bg-card border border-card-border rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-muted">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold">ID</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.SUBJECT' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.USER' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.STATUS' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.MESSAGES' | translate }}</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold">{{ 'ADMIN.LAST_UPDATE' | translate }}</th>
                      <th class="px-4 py-3 text-right text-sm font-semibold">{{ 'ADMIN.ACTIONS' | translate }}</th>
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
                          {{ 'ADMIN.DETAILS' | translate }}
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
              <h2 class="text-2xl font-semibold mb-6">{{ 'ADMIN.LOYALTY_CONFIG' | translate }}</h2>
              
              <div class="space-y-3">
                <p class="text-foreground">
                  <span class="font-semibold">{{ 'ADMIN.PROGRAM_NAME' | translate }}:</span> {{ 'ADMIN.PROGRAM_NAME_VALUE' | translate }}
                </p>
                
                <p class="text-foreground">
                  <span class="font-semibold">{{ 'ADMIN.PROGRAM_DESC' | translate }}:</span> {{ 'ADMIN.PROGRAM_DESC_VALUE' | translate }}
                </p>
                
                <p class="text-foreground">
                  <span class="font-semibold">{{ 'ADMIN.POINTS_PER_PLN' | translate }}:</span> 1
                </p>
                
                <p class="text-foreground">
                  <span class="font-semibold">{{ 'ADMIN.PROGRAM_STATUS' | translate }}:</span> <span class="text-green-600">✓ {{ 'ADMIN.PROGRAM_ACTIVE' | translate }}</span>
                </p>
              </div>
            </div>

            <!-- Rewards Management -->
            <div>
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-semibold">{{ 'ADMIN.REWARDS' | translate }}</h2>
                <button 
                  (click)="openRewardModal()"
                  class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  + {{ 'ADMIN.ADD_REWARD' | translate }}
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
                      {{ reward.isActive ? ('ADMIN.ACTIVE_STATUS' | translate) : ('ADMIN.INACTIVE_STATUS' | translate) }}
                    </span>
                  </div>
                  
                  <p class="text-sm text-muted-foreground mb-4">{{ reward.description }}</p>
                  
                  <div class="space-y-2 mb-4">
                    <div class="flex justify-between text-sm">
                      <span class="text-muted-foreground">{{ 'ADMIN.REWARD_COST' | translate }}:</span>
                      <span class="font-semibold">{{ reward.pointsCost }} {{ 'ADMIN.POINTS' | translate }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted-foreground">{{ 'ADMIN.REWARD_TYPE' | translate }}:</span>
                      <span class="font-medium">{{ getRewardTypeLabel(reward.rewardType || 'discount_fixed') }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted-foreground">{{ 'ADMIN.REWARD_VALUE' | translate }}:</span>
                      <span class="font-medium">{{ formatRewardValue(reward) }}</span>
                    </div>
                    <div *ngIf="reward.usageLimit" class="flex justify-between text-sm">
                      <span class="text-muted-foreground">{{ 'ADMIN.USAGE_LIMIT' | translate }}:</span>
                      <span class="font-medium">{{ reward.usageLimit }}</span>
                    </div>
                    <div *ngIf="reward.validUntil" class="flex justify-between text-sm">
                      <span class="text-muted-foreground">{{ 'ADMIN.VALID_UNTIL' | translate }}:</span>
                      <span class="font-medium">{{ reward.validUntil | date:'dd.MM.yyyy' }}</span>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <button
                      (click)="openRewardModal(reward)"
                      class="flex-1 px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    >
                      {{ 'ADMIN.EDIT' | translate }}
                    </button>
                    <button
                      (click)="deleteReward(reward.id)"
                      class="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                    >
                      {{ 'ADMIN.DELETE' | translate }}
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
            <h2 class="text-2xl font-semibold">{{ editingProduct ? translate.instant('ADMIN.EDIT_PRODUCT') : translate.instant('ADMIN.ADD_PRODUCT') }}</h2>
            <button (click)="closeProductModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form (submit)="saveProduct($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.PRODUCT_NAME') }}</label>
              <input 
                type="text" 
                [(ngModel)]="productForm.name" 
                name="name"
                required
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.DESCRIPTION') }}</label>
              <textarea 
                [(ngModel)]="productForm.description" 
                name="description"
                rows="3"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.CATEGORY') }}</label>
              <select 
                [(ngModel)]="productForm.categoryId" 
                name="categoryId"
                required
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="">{{ translate.instant('ADMIN.SELECT_CATEGORY') }}</option>
                <option *ngFor="let cat of categories$ | async" [value]="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

          
            
            <div>
              <label class="block text-sm font-medium mb-2">
                {{ translate.instant('ADMIN.PRODUCT_IMAGE') }}
                @if (editingProduct) {
                  <span class="text-xs text-gray-500 ml-2">{{ translate.instant('ADMIN.OPTIONAL_KEEP_CURRENT') }}</span>
                }
              </label>
              <div class="flex items-center gap-3">
                <input 
                  #productFileInput
                  type="file" 
                  (change)="onProductImageSelected($event)"
                  name="imageFile"
                  accept="image/*"
                  class="hidden"
                />
                <button 
                  type="button"
                  (click)="productFileInput.click()"
                  class="px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted transition-colors"
                >
                  {{ translate.instant('COMMON.CHOOSE_FILE') }}
                </button>
                <span class="text-sm text-muted-foreground">
                  {{ productForm.imageFile?.name || translate.instant('COMMON.NO_FILE_CHOSEN') }}
                </span>
              </div>
              @if (productForm.imagePreview) {
                <div class="mt-2">
                  <p class="text-xs text-gray-500 mb-1">
                    @if (productForm.imageFile) {
                      {{ translate.instant('ADMIN.NEW_IMAGE') }}
                    } @else {
                      {{ translate.instant('ADMIN.CURRENT_IMAGE') }}
                    }
                  </p>
                  <img [src]="productForm.imagePreview" [alt]="translate.instant('ADMIN.IMAGE_PREVIEW')" class="h-32 w-32 object-cover rounded">
                </div>
              }
            </div>

            <!-- SKU Variants Section -->
            @if (editingProduct) {
              <div class="border-t border-border pt-4 mt-4">
                <div class="flex justify-between items-center mb-4">
                  <div>
                    <h3 class="text-lg font-semibold">📦 {{ translate.instant('ADMIN.PRODUCT_VARIANTS') }}
                      @if (editingProduct.variants && editingProduct.variants.length > 0) {
                        <span class="text-muted-foreground">({{ editingProduct.variants.length }})</span>
                      }
                    </h3>
                    <p class="text-sm text-muted-foreground mt-1">
                      {{ translate.instant('ADMIN.VARIANT_DESCRIPTION') }}
                    </p>
                  </div>
                  <button 
                    type="button"
                    (click)="openSkuVariantModal(null)"
                    class="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    {{ translate.instant('ADMIN.ADD_VARIANT') }}
                  </button>
                </div>

                @if (!editingProduct.variants || editingProduct.variants.length === 0) {
                  <div class="bg-muted/30 p-6 rounded-lg text-center">
                    <p class="text-muted-foreground mb-3">
                      {{ translate.instant('ADMIN.NO_VARIANTS_MSG') }}
                    </p>
                    <button 
                      type="button"
                      (click)="openSkuVariantModal(null)"
                      class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      {{ translate.instant('ADMIN.CREATE_FIRST_VARIANT') }}
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
            <h2 class="text-2xl font-semibold">{{ editingCategory ? translate.instant('ADMIN.EDIT_CATEGORY') : translate.instant('ADMIN.ADD_CATEGORY') }}</h2>
            <button (click)="closeCategoryModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form (submit)="saveCategory($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.CATEGORY_NAME') }}</label>
              <input 
                type="text" 
                [(ngModel)]="categoryForm.name" 
                name="name"
                required
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.DESCRIPTION') }}</label>
              <textarea 
                [(ngModel)]="categoryForm.description" 
                name="description"
                rows="3"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                {{ translate.instant('ADMIN.CATEGORY_IMAGE') }}
                @if (editingCategory) {
                  <span class="text-xs text-gray-500 ml-2">{{ translate.instant('ADMIN.OPTIONAL_KEEP_CURRENT') }}</span>
                }
              </label>
              <div class="flex items-center gap-3">
                <input 
                  #categoryFileInput
                  type="file" 
                  (change)="onCategoryImageSelected($event)"
                  name="imageFile"
                  accept="image/*"
                  class="hidden"
                />
                <button 
                  type="button"
                  (click)="categoryFileInput.click()"
                  class="px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted transition-colors"
                >
                  {{ translate.instant('COMMON.CHOOSE_FILE') }}
                </button>
                <span class="text-sm text-muted-foreground">
                  {{ categoryForm.imageFile?.name || translate.instant('COMMON.NO_FILE_CHOSEN') }}
                </span>
              </div>
              @if (categoryForm.imagePreview) {
                <div class="mt-2">
                  <p class="text-xs text-gray-500 mb-1">
                    @if (categoryForm.imageFile) {
                      {{ translate.instant('ADMIN.NEW_IMAGE') }}
                    } @else {
                      {{ translate.instant('ADMIN.CURRENT_IMAGE') }}
                    }
                  </p>
                  <img [src]="categoryForm.imagePreview" [alt]="translate.instant('ADMIN.IMAGE_PREVIEW')" class="h-32 w-32 object-cover rounded">
                </div>
              }
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <button 
                type="button"
                (click)="closeCategoryModal()"
                class="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {{ translate.instant('COMMON.CANCEL') }}
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {{ editingCategory ? translate.instant('COMMON.SAVE') : translate.instant('COMMON.ADD') }}
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
            <h2 class="text-2xl font-semibold">{{ editingAttribute ? translate.instant('ADMIN.EDIT_ATTRIBUTE') : translate.instant('ADMIN.ADD_ATTRIBUTE_TITLE') }}</h2>
            <button (click)="closeAttributeModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form (submit)="saveAttribute($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.ATTRIBUTE_NAME') }} *</label>
              <input 
                type="text" 
                [(ngModel)]="attributeForm.name" 
                name="name"
                required
                [placeholder]="translate.instant('ADMIN.ATTRIBUTE_NAME_PLACEHOLDER')"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
              <p class="text-xs text-muted-foreground mt-1">
                {{ translate.instant('ADMIN.ATTRIBUTE_NAME_HINT') }}
              </p>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-border">
              <button 
                type="button"
                (click)="closeAttributeModal()"
                class="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {{ translate.instant('COMMON.CANCEL') }}
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {{ editingAttribute ? translate.instant('COMMON.SAVE') : translate.instant('COMMON.ADD') }}
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
              <h2 class="text-2xl font-semibold">{{ translate.instant('ADMIN.ATTRIBUTE_VALUES_TITLE') }} {{ selectedAttributeForValues.name }}</h2>
              <p class="text-sm text-muted-foreground mt-1">{{ translate.instant('ADMIN.MANAGE_ATTRIBUTE_VALUES') }}</p>
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
                  [placeholder]="translate.instant('ADMIN.NEW_VALUE_PLACEHOLDER')"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <button 
                type="submit"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                {{ translate.instant('ADMIN.ADD_VALUE') }}
              </button>
            </div>
          </form>

          <!-- Values List -->
          <div class="space-y-2">
            <h3 class="font-semibold text-sm mb-3">{{ translate.instant('ADMIN.EXISTING_VALUES') }}</h3>
            <div *ngIf="selectedAttributeForValues.values && selectedAttributeForValues.values.length > 0" class="space-y-2">
              <div 
                *ngFor="let value of selectedAttributeForValues.values"
                class="flex items-center justify-between p-3 bg-card border border-card-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span class="font-medium">{{ value.value }}</span>
                <button
                  (click)="deleteAttributeValue(value.id)"
                  class="p-2 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                  [title]="translate.instant('COMMON.DELETE')"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div *ngIf="!selectedAttributeForValues.values || selectedAttributeForValues.values.length === 0" class="text-center py-8 text-muted-foreground">
              {{ translate.instant('ADMIN.NO_VALUES_YET') }}
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button 
              type="button"
              (click)="closeAttributeValueModal()"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {{ translate.instant('ADMIN.CLOSE') }}
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
            <h2 class="text-2xl font-semibold">{{ translate.instant('ADMIN.ORDER_DETAILS') }} #{{ selectedOrder.id }}</h2>
            <div class="flex items-center gap-2">
              <button 
                (click)="downloadInvoice(selectedOrder.id)"
                class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-2"
                [title]="translate.instant('ADMIN.INVOICE_PDF')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                {{ translate.instant('ADMIN.INVOICE_PDF') }}
              </button>
              <button 
                (click)="openOrderEditModal()"
                class="px-3 py-1 text-sm border border-border rounded hover:bg-muted transition-colors"
              >
                {{ translate.instant('COMMON.EDIT') }}
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
              <h3 class="font-semibold mb-3">{{ translate.instant('ADMIN.CUSTOMER_INFO') }}</h3>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="text-muted-foreground">{{ translate.instant('ADMIN.FULL_NAME') }}:</span>
                  <p class="font-medium">{{ selectedOrder.customerName }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">{{ translate.instant('ADMIN.EMAIL') }}:</span>
                  <p class="font-medium">{{ selectedOrder.email }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">{{ translate.instant('ADMIN.PHONE') }}:</span>
                  <p class="font-medium">{{ selectedOrder.phone }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">{{ translate.instant('ADMIN.ADDRESS_LABEL') }}:</span>
                  <p class="font-medium">{{ selectedOrder.address }}, {{ selectedOrder.city }}, {{ selectedOrder.postalCode }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">{{ translate.instant('ADMIN.PAYMENT_STATUS') }}:</span>
                  <p class="font-medium">
                    <span 
                      [class]="selectedOrder.paid 
                        ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium'
                        : 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium'"
                    >
                      {{ selectedOrder.paid ? translate.instant('ADMIN.PAID') : translate.instant('ADMIN.UNPAID') }}
                    </span>
                  </p>
                </div>
                <div *ngIf="selectedOrder.trackingNumber">
                  <span class="text-muted-foreground">{{ translate.instant('ADMIN.TRACKING_NUMBER') }}:</span>
                  <p class="font-medium font-mono">{{ selectedOrder.trackingNumber }}</p>
                </div>
              </div>
            </div>

            <!-- Order Items -->
            <div>
              <h3 class="font-semibold mb-3">{{ translate.instant('ADMIN.PRODUCTS') }}</h3>
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
                <span>{{ translate.instant('ADMIN.TOTAL_VALUE') }}:</span>
                <span>{{ parseFloat(selectedOrder.totalPrice) | number:'1.2-2' }} PLN</span>
              </div>
            </div>

            <!-- Notes -->
            <div *ngIf="selectedOrder.notes" class="bg-muted/50 rounded-lg p-4">
              <h3 class="font-semibold mb-2">{{ translate.instant('ADMIN.NOTES') }}</h3>
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
            <h2 class="text-2xl font-semibold">{{ translate.instant('ADMIN.EDIT_ORDER') }}</h2>
            <button (click)="closeOrderEditModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form (submit)="saveOrderEdit($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.FULL_NAME') }}</label>
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
                <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.EMAIL') }}</label>
                <input 
                  type="email" 
                  [(ngModel)]="orderEditForm.email" 
                  name="email"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.PHONE') }}</label>
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
              <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.ADDRESS_LABEL') }}</label>
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
                <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.CITY') }}</label>
                <input 
                  type="text" 
                  [(ngModel)]="orderEditForm.city" 
                  name="city"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.POSTAL_CODE') }}</label>
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
                <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.TRACKING_NUMBER') }}</label>
                <input 
                  type="text" 
                  [(ngModel)]="orderEditForm.trackingNumber" 
                  name="trackingNumber"
                  [placeholder]="translate.instant('ADMIN.TRACKING_NUMBER_PLACEHOLDER')"
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
                  <span class="ml-2 text-sm font-medium">{{ translate.instant('ADMIN.ORDER_PAID') }}</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.NOTES') }}</label>
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
                {{ translate.instant('COMMON.CANCEL') }}
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {{ translate.instant('COMMON.SAVE') }}
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
                <span>{{ translate.instant('ADMIN.TICKET_NUMBER') }}{{ selectedTicket.id }}</span>
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
            <label class="block text-sm font-medium mb-2">{{ 'ADMIN.CHANGE_TICKET_STATUS' | translate }}</label>
            <div class="flex gap-2">
              <select
                [(ngModel)]="ticketStatusForm"
                class="flex-1 px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="new">{{ 'ADMIN.TICKET_STATUS_NEW' | translate }}</option>
                <option value="in_progress">{{ 'ADMIN.TICKET_STATUS_IN_PROGRESS' | translate }}</option>
                <option value="closed">{{ 'ADMIN.TICKET_STATUS_CLOSED' | translate }}</option>
              </select>
              <button
                (click)="updateTicketStatus()"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {{ 'ADMIN.SAVE_STATUS' | translate }}
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div class="space-y-4 mb-6 max-h-96 overflow-y-auto">
            <h3 class="font-semibold">{{ translate.instant('ADMIN.CONVERSATION_HISTORY') }}</h3>
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
                <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.ADMIN_REPLY') }}</label>
                <textarea
                  [(ngModel)]="ticketReplyText"
                  name="reply"
                  required
                  rows="4"
                  class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  [placeholder]="translate.instant('ADMIN.REPLY_PLACEHOLDER_ADMIN')"
                ></textarea>
              </div>
              <div class="flex justify-end">
                <button
                  type="submit"
                  [disabled]="!ticketReplyText.trim()"
                  class="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {{ translate.instant('ADMIN.SEND_REPLY_BTN') }}
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
            <h2 class="text-2xl font-semibold">{{ editingReward ? translate.instant('ADMIN.EDIT_REWARD') : translate.instant('ADMIN.ADD_REWARD') }}</h2>
            <button (click)="closeRewardModal()" class="text-muted-foreground hover:text-foreground">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form (submit)="saveReward($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.REWARD_NAME') }}</label>
              <input 
                type="text" 
                [(ngModel)]="rewardForm.name" 
                name="name"
                required
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.REWARD_DESCRIPTION') }}</label>
              <textarea 
                [(ngModel)]="rewardForm.description" 
                name="description"
                rows="2"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.POINTS_COST') }}</label>
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
                <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.REWARD_TYPE') }}</label>
                <select 
                  [(ngModel)]="rewardForm.rewardType" 
                  name="rewardType"
                  required
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="discount_percentage">{{ translate.instant('ADMIN.PERCENTAGE_DISCOUNT') }}</option>
                  <option value="discount_fixed">{{ translate.instant('ADMIN.FIXED_DISCOUNT') }}</option>
                  <option value="free_shipping">{{ translate.instant('ADMIN.FREE_SHIPPING_REWARD') }}</option>
                  <option value="free_product">{{ translate.instant('ADMIN.FREE_PRODUCT') }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">
                  {{ rewardForm.rewardType === 'discount_percentage' ? translate.instant('ADMIN.REWARD_VALUE_PERCENT') : 
                     rewardForm.rewardType === 'discount_fixed' ? translate.instant('ADMIN.REWARD_VALUE_PLN') : 
                     rewardForm.rewardType === 'free_product' ? translate.instant('ADMIN.PRODUCT_ID') : translate.instant('ADMIN.VALUE_LABEL') }}
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
                <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.USAGE_LIMIT_OPTIONAL') }}</label>
                <input 
                  type="number" 
                  [(ngModel)]="rewardForm.usageLimit" 
                  name="usageLimit"
                  min="1"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  [placeholder]="translate.instant('ADMIN.NO_LIMIT_PLACEHOLDER')"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.VALID_UNTIL_OPTIONAL') }}</label>
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
                  <span class="ml-2 text-sm font-medium">{{ translate.instant('ADMIN.REWARD_ACTIVE') }}</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">{{ translate.instant('ADMIN.IMAGE_URL_OPTIONAL') }}</label>
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
                {{ translate.instant('COMMON.CANCEL') }}
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {{ editingReward ? translate.instant('COMMON.SAVE') : translate.instant('COMMON.ADD') }}
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
  translate!: TranslateService;
  private destroy$ = new Subject<void>();
  
  tabs: { id: TabType; label: string }[] = [];

  products$!: Observable<Product[]>;
  categories$!: Observable<Category[]>;
  orders$!: Observable<Order[]>;
  lowStockAlerts$: Observable<LowStockAlert[]>;
  groupedLowStockAlerts$: Observable<GroupedLowStockAlert[]>;
  lowStockStats$: Observable<LowStockStatistics>;
  statistics$: Observable<SalesStatistics>;

  // Pagination for products
  allProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  productsCurrentPage: number = 1;
  productsPageSize: number = 10;
  productsTotalItems: number = 0;

  // Pagination for categories
  allCategories: Category[] = [];
  paginatedCategories: Category[] = [];
  categoriesCurrentPage: number = 1;
  categoriesPageSize: number = 10;
  categoriesTotalItems: number = 0;

  // Pagination for orders
  allOrders: Order[] = [];
  paginatedOrders: Order[] = [];
  ordersCurrentPage: number = 1;
  ordersPageSize: number = 10;
  ordersTotalItems: number = 0;

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
  lowStockFilters: { label: string; value: 'all' | 'critical' | 'warning' }[] = [];

  // Support tickets
  allTickets: Ticket[] = [];
  selectedTicket: Ticket | null = null;
  showTicketModal: boolean = false;
  loadingTickets: boolean = false;
  selectedSupportStatus: string = 'all';
  ticketStatusForm: string = 'new';
  ticketReplyText: string = '';
  supportStatusFilters: { label: string; value: string }[] = [];

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

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private injector: Injector,
    private languageService: LanguageService
  ) {
    this.translate = this.injector.get(TranslateService);
    this.initializeTabs();
    this.initializeSupportFilters();
    this.initializeLowStockFilters();
    
    // Load data with pagination
    this.reloadProducts();
    this.reloadCategories();
    this.reloadOrders();

    this.lowStockAlerts$ = this.apiService.getLowStockAlerts(this.lowStockThreshold);
    this.groupedLowStockAlerts$ = of([]);
    this.lowStockStats$ = this.apiService.getLowStockStatistics();
    this.statistics$ = this.apiService.getSalesStatistics();
    this.loyaltyRewards$ = this.apiService.getLoyaltyRewards();
  }
  
  private initializeTabs(): void {
    this.tabs = [
      { id: 'products' as TabType, label: this.translate.instant('ADMIN.TAB_PRODUCTS') },
      { id: 'categories' as TabType, label: this.translate.instant('ADMIN.TAB_CATEGORIES') },
      { id: 'attributes' as TabType, label: this.translate.instant('ADMIN.TAB_ATTRIBUTES') },
      { id: 'orders' as TabType, label: this.translate.instant('ADMIN.TAB_ORDERS') },
      { id: 'lowStock' as TabType, label: this.translate.instant('ADMIN.TAB_LOW_STOCK') },
      { id: 'statistics' as TabType, label: this.translate.instant('ADMIN.TAB_STATISTICS') },
      { id: 'support' as TabType, label: this.translate.instant('ADMIN.TAB_SUPPORT') },
      { id: 'loyalty' as TabType, label: this.translate.instant('ADMIN.TAB_LOYALTY') }
    ];
  }
  
  private initializeSupportFilters(): void {
    this.supportStatusFilters = [
      { label: this.translate.instant('ADMIN.ALL'), value: 'all' },
      { label: this.translate.instant('ADMIN.TICKET_STATUS_NEW'), value: 'new' },
      { label: this.translate.instant('ADMIN.TICKET_STATUS_IN_PROGRESS'), value: 'in_progress' },
      { label: this.translate.instant('ADMIN.TICKET_STATUS_CLOSED'), value: 'closed' }
    ];
  }
  
  private initializeLowStockFilters(): void {
    this.lowStockFilters = [
      { label: this.translate.instant('ADMIN.ALL'), value: 'all' as const },
      { label: this.translate.instant('ADMIN.CRITICAL_ZERO'), value: 'critical' as const },
      { label: this.translate.instant('ADMIN.WARNINGS'), value: 'warning' as const }
    ];
  }

  ngOnInit(): void {
    this.categories$.subscribe(cats => this.allCategories = cats);
    this.loadSupportTickets();
    this.loadLoyaltyProgram();
    this.loadLowStockAlerts();
    this.loadAttributes();
    
    // Re-initialize tabs and filters on language change
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.initializeTabs();
        this.initializeSupportFilters();
        this.initializeLowStockFilters();
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          this.modalService.showSuccess(this.translate.instant('ADMIN.ATTRIBUTE_UPDATED'));
          this.loadAttributes();
          this.closeAttributeModal();
        },
        error: (err) => {
          console.error('Błąd aktualizacji atrybutu:', err);
          this.modalService.showError(this.translate.instant('ADMIN.ATTRIBUTE_UPDATE_ERROR'));
        }
      });
    } else {
      // Create new attribute
      this.apiService.createAttribute(attributeData).subscribe({
        next: () => {
          this.modalService.showSuccess(this.translate.instant('ADMIN.ATTRIBUTE_CREATED'));
          this.loadAttributes();
          this.closeAttributeModal();
        },
        error: (err) => {
          console.error('Błąd tworzenia atrybutu:', err);
          this.modalService.showError(this.translate.instant('ADMIN.ATTRIBUTE_CREATE_ERROR'));
        }
      });
    }
  }

  async deleteAttribute(id: number): Promise<void> {
    const confirmed = await this.modalService.showConfirm(
      this.translate.instant('ADMIN.CONFIRM_DELETE_ATTRIBUTE'),
      this.translate.instant('ADMIN.CONFIRM_DELETE_TITLE')
    );
    
    if (confirmed) {
      this.apiService.deleteAttribute(id).subscribe({
        next: () => {
          this.modalService.showSuccess(this.translate.instant('ADMIN.ATTRIBUTE_DELETED'));
          this.loadAttributes();
        },
        error: (err) => {
          console.error('Błąd usuwania atrybutu:', err);
          this.modalService.showError(this.translate.instant('ADMIN.ATTRIBUTE_DELETE_ERROR'));
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
        this.modalService.showSuccess(this.translate.instant('ADMIN.VALUE_ADDED'));
        this.attributeValueForm.value = '';
        
        // Refresh the current attribute to show new value
        this.apiService.getAttribute(this.selectedAttributeForValues!.id).subscribe(updated => {
          this.selectedAttributeForValues = updated;
        });
        this.loadAttributes();
      },
      error: (err) => {
        console.error('Błąd dodawania wartości:', err);
        this.modalService.showError(this.translate.instant('ADMIN.VALUE_ADD_ERROR'));
      }
    });
  }

  async deleteAttributeValue(valueId: number): Promise<void> {
    const confirmed = await this.modalService.showConfirm(
      this.translate.instant('ADMIN.CONFIRM_DELETE_VALUE'),
      this.translate.instant('ADMIN.CONFIRM_DELETE_TITLE')
    );
    
    if (confirmed) {
      this.apiService.deleteAttributeValue(valueId).subscribe({
        next: () => {
          this.modalService.showSuccess(this.translate.instant('ADMIN.VALUE_DELETED'));
          
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
          this.modalService.showError(this.translate.instant('ADMIN.VALUE_DELETE_ERROR'));
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
          this.reloadProducts();
          this.closeProductModal();
          this.modalService.showSuccess(this.translate.instant('ADMIN.PRODUCT_UPDATED'));
        },
        error: (err) => {
          console.error('Błąd aktualizacji produktu:', err);
          this.modalService.showError(this.translate.instant('ADMIN.PRODUCT_UPDATE_ERROR'));
        }
      });
    } else {
      this.apiService.createProduct(productData).subscribe({
        next: () => {
          this.reloadProducts();
          this.closeProductModal();
          this.modalService.showSuccess(this.translate.instant('ADMIN.PRODUCT_CREATED'));
        },
        error: (err) => {
          console.error('Błąd dodawania produktu:', err);
          this.modalService.showError(this.translate.instant('ADMIN.PRODUCT_CREATE_ERROR'));
        }
      });
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const confirmed = await this.modalService.showConfirm(
      this.translate.instant('ADMIN.CONFIRM_DELETE'),
      this.translate.instant('ADMIN.CONFIRM_DELETE_TITLE')
    );
    
    if (confirmed) {
      this.apiService.deleteProduct(id).subscribe({
        next: () => {
          this.reloadProducts();
          this.modalService.showSuccess(this.translate.instant('ADMIN.PRODUCT_DELETED'));
        },
        error: (err) => {
          console.error('Błąd usuwania produktu:', err);
          this.modalService.showError(this.translate.instant('ADMIN.PRODUCT_DELETE_ERROR'));
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
          this.modalService.showSuccess(this.translate.instant('ADMIN.VARIANT_UPDATED'));
          this.closeVariantModal();
          // Refresh product to get updated variants
          if (this.editingProduct?.numericId) {
            this.apiService.getProduct(this.editingProduct.numericId.toString()).subscribe({
              next: (product) => {
                this.editingProduct = product;
                this.reloadProducts();
              },
              error: (err) => console.error('Błąd odświeżania produktu:', err)
            });
          }
        },
        error: (err) => {
          console.error('Błąd aktualizacji wariantu:', err);
          this.modalService.showError(this.translate.instant('ADMIN.VARIANT_UPDATE_ERROR'));
        }
      });
    } else {
      // Create new variant
      if (!this.editingProduct?.numericId) {
        this.modalService.showError(this.translate.instant('ADMIN.NO_PRODUCT_ID'));
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
          this.modalService.showSuccess(this.translate.instant('ADMIN.VARIANT_CREATED'));
          this.closeVariantModal();
          // Refresh product to get new variant
          if (this.editingProduct?.numericId) {
            this.apiService.getProduct(this.editingProduct.numericId.toString()).subscribe({
              next: (product) => {
                this.editingProduct = product;
                this.reloadProducts();
              },
              error: (err) => console.error('Błąd odświeżania produktu:', err)
            });
          }
        },
        error: (err) => {
          console.error('Błąd tworzenia wariantu:', err);
          this.modalService.showError(this.translate.instant('ADMIN.VARIANT_CREATE_ERROR'));
        }
      });
    }
  }

  async deleteSkuVariant(variant: ProductSkuVariant): Promise<void> {
    const confirmed = await this.modalService.showConfirm(
      this.translate.instant('ADMIN.CONFIRM_DELETE_VARIANT'),
      this.translate.instant('ADMIN.CONFIRM_DELETE_TITLE')
    );
    
    if (!confirmed) {
      return;
    }

    this.apiService.deleteVariant(variant.id).subscribe({
      next: () => {
        this.modalService.showSuccess(this.translate.instant('ADMIN.VARIANT_DELETED'));
        // Refresh product to remove deleted variant
        if (this.editingProduct?.numericId) {
          this.apiService.getProduct(this.editingProduct.numericId.toString()).subscribe({
            next: (product) => {
              this.editingProduct = product;
              this.reloadProducts();
            },
            error: (err) => console.error('Błąd odświeżania produktu:', err)
          });
        }
      },
      error: (err) => {
        console.error('Błąd usuwania wariantu:', err);
        this.modalService.showError(this.translate.instant('ADMIN.VARIANT_DELETE_ERROR'));
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
          this.reloadCategories();
          this.categories$.subscribe(cats => this.allCategories = cats);
          this.closeCategoryModal();
          this.modalService.showSuccess(this.translate.instant('ADMIN.CATEGORY_UPDATED'));
        },
        error: (err) => {
          console.error('Błąd aktualizacji kategorii:', err);
          this.modalService.showError(this.translate.instant('ADMIN.CATEGORY_UPDATE_ERROR'));
        }
      });
    } else {
      this.apiService.createCategory(categoryData).subscribe({
        next: () => {
          this.reloadCategories();
          this.categories$.subscribe(cats => this.allCategories = cats);
          this.closeCategoryModal();
          this.modalService.showSuccess(this.translate.instant('ADMIN.CATEGORY_CREATED'));
        },
        error: (err) => {
          console.error('Błąd dodawania kategorii:', err);
          this.modalService.showError(this.translate.instant('ADMIN.CATEGORY_CREATE_ERROR'));
        }
      });
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const confirmed = await this.modalService.showConfirm(
      this.translate.instant('ADMIN.CONFIRM_DELETE_CATEGORY'),
      this.translate.instant('ADMIN.CONFIRM_DELETE_TITLE')
    );
    
    if (confirmed) {
      this.apiService.deleteCategory(id).subscribe({
        next: () => {
          this.reloadCategories();
          this.categories$.subscribe(cats => this.allCategories = cats);
          this.modalService.showSuccess(this.translate.instant('ADMIN.CATEGORY_DELETED'));
        },
        error: (err) => {
          console.error('Błąd usuwania kategorii:', err);
          this.modalService.showError(this.translate.instant('ADMIN.CATEGORY_DELETE_ERROR'));
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
        this.reloadOrders();
        this.modalService.showSuccess(this.translate.instant('ADMIN.ORDER_STATUS_UPDATED'));
      },
      error: (err) => {
        console.error('Błąd aktualizacji statusu:', err);
        this.modalService.showError(this.translate.instant('ADMIN.ORDER_STATUS_UPDATE_ERROR'));
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
        this.modalService.showError(this.translate.instant('ADMIN.ORDER_DETAILS_ERROR'));
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
        this.reloadOrders();
        this.closeOrderEditModal();
        this.modalService.showSuccess(this.translate.instant('ADMIN.ORDER_UPDATED'));
      },
      error: (err) => {
        console.error('Błąd aktualizacji zamówienia:', err);
        this.modalService.showError(this.translate.instant('ADMIN.ORDER_UPDATE_ERROR'));
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

  async autoOrderVariant(variantAlert: LowStockVariantAlert): Promise<void> {
    const newStock = variantAlert.currentStock + variantAlert.suggestedOrder;
    const confirmed = await this.modalService.showConfirm(
      this.translate.instant('ADMIN.AUTO_ORDER_CONFIRM', { 
        qty: variantAlert.suggestedOrder 
      }) + `\n\n` +
      `${this.translate.instant('ADMIN.PRODUCT')}: ${variantAlert.productName}\n` +
      `SKU: ${variantAlert.variant.sku}\n` +
      `${this.translate.instant('ADMIN.CURRENT_STOCK')}: ${variantAlert.currentStock} ${this.translate.instant('ADMIN.PIECES')}\n` +
      `${this.translate.instant('ADMIN.STOCK_STATUS')}: ${newStock} ${this.translate.instant('ADMIN.PIECES')}`,
      this.translate.instant('ADMIN.CONFIRM_DELETE_TITLE')
    );
    
    if (confirmed) {
      this.apiService.updateVariant(variantAlert.variant.id, { stock: newStock }).subscribe({
        next: () => {
          this.loadLowStockAlerts();
          this.reloadProducts();
          this.modalService.showSuccess(
            this.translate.instant('ADMIN.AUTO_ORDER_SUCCESS', { 
              qty: variantAlert.suggestedOrder,
              newStock: newStock 
            })
          );
        },
        error: (err) => {
          console.error('Błąd automatycznego zamawiania:', err);
          this.modalService.showError(this.translate.instant('ADMIN.AUTO_ORDER_ERROR'));
        }
      });
    }
  }

  async bulkOrderGroup(group: GroupedLowStockAlert): Promise<void> {
    const totalToOrder = group.variants.reduce((sum, v) => sum + v.suggestedOrder, 0);
    const confirmed = await this.modalService.showConfirm(
      this.translate.instant('ADMIN.BULK_ORDER_CONFIRM', {
        totalQty: totalToOrder,
        variantsCount: group.totalVariantsAffected
      }),
      this.translate.instant('ADMIN.CONFIRM_DELETE_TITLE')
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
              this.reloadProducts();
              this.modalService.showSuccess(
                this.translate.instant('ADMIN.BULK_ORDER_SUCCESS', {
                  completed: completedCount,
                  errors: errorCount
                })
              );
            }
          },
          error: (err) => {
            console.error('Błąd zamawiania wariantu:', err);
            errorCount++;
            if (completedCount + errorCount === group.variants.length) {
              this.loadLowStockAlerts();
              this.modalService.showError(
                this.translate.instant('ADMIN.BULK_ORDER_ERROR', {
                  completed: completedCount,
                  errors: errorCount
                })
              );
            }
          }
        });
      });
    }
  }

  editVariantThreshold(variantAlert: LowStockVariantAlert): void {
    // Note: Using browser prompt for now - could be replaced with custom input modal
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
        this.modalService.showError(this.translate.instant('ADMIN.THRESHOLD_INVALID'));
        return;
      }
      
      this.apiService.updateVariant(variantAlert.variant.id, { low_stock_threshold: threshold }).subscribe({
        next: () => {
          this.loadLowStockAlerts();
          this.modalService.showSuccess(
            this.translate.instant('ADMIN.THRESHOLD_UPDATED', { threshold: threshold })
          );
        },
        error: (err) => {
          console.error('Błąd aktualizacji progu:', err);
          this.modalService.showError(this.translate.instant('ADMIN.THRESHOLD_UPDATE_ERROR'));
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
          this.modalService.showSuccess(response.message);
        } else {
          this.modalService.showError(response.message);
        }
      },
      error: (err) => {
        console.error('Błąd wyzwalania alertu:', err);
        this.sendingAlert = false;
        this.modalService.showError(this.translate.instant('ADMIN.ALERT_TRIGGER_ERROR'));
      }
    });
  }

  exportLowStockToCSV(): void {
    this.groupedLowStockAlerts$.subscribe(groups => {
      if (groups.length === 0) {
        this.modalService.showError(this.translate.instant('ADMIN.NO_EXPORT_DATA'));
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
      
      this.modalService.showSuccess(this.translate.instant('ADMIN.CSV_DOWNLOADED'));
    });
  }

  // Legacy method for backward compatibility
  async autoOrderProduct(stockAlert: LowStockAlert): Promise<void> {
    const confirmed = await this.modalService.showConfirm(
      this.translate.instant('ADMIN.AUTO_ORDER_CONFIRM', { qty: stockAlert.suggestedOrder }),
      this.translate.instant('ADMIN.CONFIRM_DELETE_TITLE')
    );
    
    if (confirmed) {
      const newStock = stockAlert.currentStock + stockAlert.suggestedOrder;
      this.apiService.updateProduct(stockAlert.product.id, { stock: newStock }).subscribe({
        next: () => {
          this.reloadProducts();
          this.loadLowStockAlerts();
          this.modalService.showSuccess(
            this.translate.instant('ADMIN.AUTO_ORDER_SUCCESS', { 
              qty: stockAlert.suggestedOrder,
              newStock: newStock 
            })
          );
        },
        error: (err) => {
          console.error('Błąd automatycznego zamawiania:', err);
          this.modalService.showError(this.translate.instant('ADMIN.AUTO_ORDER_ERROR'));
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
        this.modalService.showError(this.translate.instant('ADMIN.TICKETS_LOAD_ERROR'));
        this.loadingTickets = false;
      }
    });
  }

  getFilteredTickets(): Ticket[] {
    if (!Array.isArray(this.allTickets)) {
      return [];
    }
    if (this.selectedSupportStatus === 'all') {
      return this.allTickets;
    }
    return this.allTickets.filter(t => t.status === this.selectedSupportStatus);
  }

  getTicketCountByStatus(status: string): number {
    if (!Array.isArray(this.allTickets)) {
      return 0;
    }
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
        this.modalService.showError(this.translate.instant('ADMIN.TICKET_DETAILS_ERROR'));
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
        this.modalService.showSuccess(this.translate.instant('ADMIN.TICKET_STATUS_UPDATED'));
        this.loadSupportTickets();
        if (this.selectedTicket) {
          this.selectedTicket.status = updatedTicket.status;
        }
      },
      error: (err) => {
        console.error('Error updating ticket status:', err);
        this.modalService.showError(this.translate.instant('ADMIN.TICKET_STATUS_UPDATE_ERROR'));
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
        this.modalService.showSuccess(this.translate.instant('ADMIN.REPLY_SENT'));
        this.ticketReplyText = '';
        // Reload ticket details
        if (this.selectedTicket) {
          this.viewSupportTicket(this.selectedTicket);
        }
      },
      error: (err) => {
        console.error('Error replying to ticket:', err);
        this.modalService.showError(this.translate.instant('ADMIN.REPLY_SEND_ERROR'));
      }
    });
  }

  getSupportStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'new': this.translate.instant('ADMIN.TICKET_STATUS_NEW'),
      'in_progress': this.translate.instant('ADMIN.TICKET_STATUS_IN_PROGRESS'),
      'closed': this.translate.instant('ADMIN.TICKET_STATUS_CLOSED')
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
          this.modalService.showSuccess(this.translate.instant('ADMIN.REWARD_UPDATED'));
        },
        error: (err) => {
          console.error('Error updating reward:', err);
          this.modalService.showError(this.translate.instant('ADMIN.REWARD_UPDATE_ERROR'));
        }
      });
    } else {
      // Create new reward
      this.apiService.createLoyaltyReward(rewardData).subscribe({
        next: () => {
          this.loyaltyRewards$ = this.apiService.getLoyaltyRewards();
          this.closeRewardModal();
          this.modalService.showSuccess(this.translate.instant('ADMIN.REWARD_CREATED'));
        },
        error: (err) => {
          console.error('Error creating reward:', err);
          this.modalService.showError(this.translate.instant('ADMIN.REWARD_CREATE_ERROR'));
        }
      });
    }
  }

  async deleteReward(rewardId: string): Promise<void> {
    const confirmed = await this.modalService.showConfirm(
      this.translate.instant('ADMIN.CONFIRM_DELETE_REWARD'),
      this.translate.instant('ADMIN.DELETE_REWARD_TITLE')
    );
    if (!confirmed) return;

    this.apiService.deleteLoyaltyReward(rewardId).subscribe({
      next: () => {
        this.loyaltyRewards$ = this.apiService.getLoyaltyRewards();
        this.modalService.showSuccess(this.translate.instant('ADMIN.REWARD_DELETED'));
      },
      error: (err) => {
        console.error('Error deleting reward:', err);
        this.modalService.showError(this.translate.instant('ADMIN.REWARD_DELETE_ERROR'));
      }
    });
  }

  getRewardTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'discount_percentage': this.translate.instant('ADMIN.REWARD_TYPE_DISCOUNT_PERCENTAGE'),
      'discount_fixed': this.translate.instant('ADMIN.REWARD_TYPE_DISCOUNT_FIXED'),
      'free_shipping': this.translate.instant('ADMIN.REWARD_TYPE_FREE_SHIPPING'),
      'free_product': this.translate.instant('ADMIN.REWARD_TYPE_FREE_PRODUCT')
    };
    return labels[type] || type;
  }

  // Reload methods with pagination
  reloadProducts(): void {
    this.apiService.getAllProducts().subscribe(products => {
      this.allProducts = products;
      this.productsTotalItems = products.length;
      this.updatePaginatedProducts();
    });
    this.products$ = this.apiService.getAllProducts();
  }

  reloadCategories(): void {
    this.apiService.getAllCategories().subscribe(categories => {
      this.allCategories = categories;
      this.categoriesTotalItems = categories.length;
      this.updatePaginatedCategories();
    });
    this.categories$ = this.apiService.getAllCategories();
  }

  reloadOrders(): void {
    this.apiService.getAllOrders().subscribe(orders => {
      this.allOrders = orders;
      this.ordersTotalItems = orders.length;
      this.updatePaginatedOrders();
    });
    this.orders$ = this.apiService.getAllOrders();
  }

  // Pagination methods for Products
  updatePaginatedProducts(): void {
    const startIndex = (this.productsCurrentPage - 1) * this.productsPageSize;
    const endIndex = startIndex + this.productsPageSize;
    this.paginatedProducts = this.allProducts.slice(startIndex, endIndex);
  }

  onProductsPageChange(page: number): void {
    this.productsCurrentPage = page;
    this.updatePaginatedProducts();
  }

  onProductsPageSizeChange(pageSize: number): void {
    this.productsPageSize = pageSize;
    this.productsCurrentPage = 1;
    this.updatePaginatedProducts();
  }

  // Pagination methods for Categories
  updatePaginatedCategories(): void {
    const startIndex = (this.categoriesCurrentPage - 1) * this.categoriesPageSize;
    const endIndex = startIndex + this.categoriesPageSize;
    this.paginatedCategories = this.allCategories.slice(startIndex, endIndex);
  }

  onCategoriesPageChange(page: number): void {
    this.categoriesCurrentPage = page;
    this.updatePaginatedCategories();
  }

  onCategoriesPageSizeChange(pageSize: number): void {
    this.categoriesPageSize = pageSize;
    this.categoriesCurrentPage = 1;
    this.updatePaginatedCategories();
  }

  // Pagination methods for Orders
  updatePaginatedOrders(): void {
    const startIndex = (this.ordersCurrentPage - 1) * this.ordersPageSize;
    const endIndex = startIndex + this.ordersPageSize;
    this.paginatedOrders = this.allOrders.slice(startIndex, endIndex);
  }

  onOrdersPageChange(page: number): void {
    this.ordersCurrentPage = page;
    this.updatePaginatedOrders();
  }

  onOrdersPageSizeChange(pageSize: number): void {
    this.ordersPageSize = pageSize;
    this.ordersCurrentPage = 1;
    this.updatePaginatedOrders();
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
