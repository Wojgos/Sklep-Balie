import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, map, Subject, takeUntil, switchMap } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { Product, Category, PaginatedResponse } from '../../models';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'rating-desc' | 'newest';

@Component({
  selector: 'bg-products',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ProductCardComponent,
    TranslateModule,
    PaginationComponent
  ],
  template: `
    <div class="flex-1 bg-background">
        <!-- Page Header -->
        <section class="bg-primary text-primary-foreground py-12">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 class="font-heading font-bold text-4xl mb-2">{{ 'PRODUCTS.TITLE' | translate }}</h1>
            <p class="text-primary-foreground/80">{{ 'PRODUCTS.SUBTITLE' | translate }}</p>
          </div>
        </section>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Search and Filters Bar -->
          <div class="bg-card border border-card-border rounded-lg p-6 mb-8 shadow-sm">
            <div class="flex flex-col lg:flex-row gap-4">
              <!-- Search -->
              <div class="flex-1">
                <label class="block text-sm font-medium mb-2">{{ 'PRODUCTS.SEARCH' | translate }}</label>
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="searchTerm"
                    (ngModelChange)="applyFilters()"
                    [placeholder]="'PRODUCTS.SEARCH_PLACEHOLDER' | translate"
                    class="w-full px-4 py-2 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>

              <!-- Category Filter -->
              <div class="lg:w-56">
                <label class="block text-sm font-medium mb-2">{{ 'PRODUCTS.CATEGORY' | translate }}</label>
                <select
                  [(ngModel)]="selectedCategory"
                  (ngModelChange)="applyFilters()"
                  class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                >
                  <option value="">{{ 'PRODUCTS.ALL_CATEGORIES' | translate }}</option>
                  <option *ngFor="let category of categories" [value]="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <!-- Sort -->
              <div class="lg:w-56">
                <label class="block text-sm font-medium mb-2">{{ 'PRODUCTS.SORT' | translate }}</label>
                <select
                  [(ngModel)]="sortOption"
                  (ngModelChange)="applyFilters()"
                  class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                >
                  <option value="newest">{{ 'PRODUCTS.SORT_NEWEST' | translate }}</option>
                  <option value="name-asc">{{ 'PRODUCTS.SORT_NAME_ASC' | translate }}</option>
                  <option value="name-desc">{{ 'PRODUCTS.SORT_NAME_DESC' | translate }}</option>
                  <option value="price-asc">{{ 'PRODUCTS.SORT_PRICE_ASC' | translate }}</option>
                  <option value="price-desc">{{ 'PRODUCTS.SORT_PRICE_DESC' | translate }}</option>
                  <option value="rating-desc">{{ 'PRODUCTS.SORT_RATING' | translate }}</option>
                </select>
              </div>
            </div>

            <!-- Price Range Filter -->
            <div class="mt-4 pt-4 border-t border-border">
              <label class="block text-sm font-medium mb-2">{{ 'PRODUCTS.PRICE_RANGE' | translate }}</label>
              <div class="flex items-center gap-4">
                <div class="flex-1">
                  <input
                    type="number"
                    [(ngModel)]="minPrice"
                    (ngModelChange)="applyFilters()"
                    [placeholder]="'PRODUCTS.MIN' | translate"
                    min="0"
                    class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>
                <span class="text-muted-foreground">-</span>
                <div class="flex-1">
                  <input
                    type="number"
                    [(ngModel)]="maxPrice"
                    (ngModelChange)="applyFilters()"
                    [placeholder]="'PRODUCTS.MAX' | translate"
                    min="0"
                    class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>
                <button
                  (click)="clearFilters()"
                  class="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  {{ 'PRODUCTS.CLEAR' | translate }}
                </button>
              </div>
            </div>

            <!-- Active Filters -->
            <div *ngIf="hasActiveFilters()" class="mt-4 pt-4 border-t border-border">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium">{{ 'PRODUCTS.ACTIVE_FILTERS' | translate }}:</span>
                <button
                  *ngIf="selectedCategory"
                  (click)="selectedCategory = ''; applyFilters()"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                >
                  {{ getCategoryName(selectedCategory) }}
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
                <button
                  *ngIf="minPrice !== null || maxPrice !== null"
                  (click)="minPrice = null; maxPrice = null; applyFilters()"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                >
                  {{ minPrice || 0 }} zł - {{ maxPrice || '∞' }} zł
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
                <button
                  *ngIf="searchTerm"
                  (click)="searchTerm = ''; applyFilters()"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                >
                  "{{ searchTerm }}"
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Results Info -->
          <div class="flex items-center justify-between mb-6">
            <p class="text-muted-foreground">
              {{ 'PRODUCTS.FOUND' | translate }} <span class="font-semibold text-foreground">{{ filteredProducts.length }}</span> 
              {{ filteredProducts.length === 1 ? ('PRODUCTS.PRODUCT_SINGULAR' | translate) : ('PRODUCTS.PRODUCT_PLURAL' | translate) }}
            </p>
            <div class="flex items-center gap-2">
              <button
                (click)="viewMode = 'grid'"
                [class]="viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'"
                class="p-2 rounded-lg transition-colors border border-border"
                [title]="'PRODUCTS.GRID_VIEW' | translate"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                </svg>
              </button>
              <button
                (click)="viewMode = 'list'"
                [class]="viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'"
                class="p-2 rounded-lg transition-colors border border-border"
                [title]="'PRODUCTS.LIST_VIEW' | translate"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Products Grid/List -->
          <div *ngIf="filteredProducts.length > 0; else noResults">
            <!-- Grid View -->
            <div *ngIf="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              <bg-product-card 
                *ngFor="let product of paginatedProducts" 
                [product]="product"
              ></bg-product-card>
            </div>

            <!-- List View -->
            <div *ngIf="viewMode === 'list'" class="space-y-4 mb-8">
              <div 
                *ngFor="let product of paginatedProducts"
                class="bg-card border border-card-border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                (click)="navigateToProduct(product.slug || product.id)"
              >
                <div class="flex gap-4">
                  <div class="w-32 h-32 flex-shrink-0">
                    <img 
                      [src]="product.image" 
                      [alt]="product.name"
                      class="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-lg mb-1 truncate">{{ product.name }}</h3>
                    <p class="text-sm text-muted-foreground mb-2 line-clamp-2">{{ product.description }}</p>
                    <div class="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span *ngIf="product.variantSummary" class="flex items-center gap-1">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                        </svg>
                        {{ product.variantSummary }}
                      </span>
                      <span class="flex items-center gap-1">
                        <svg class="h-4 w-4 text-yellow-500 fill-yellow-500" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        {{ product.rating }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <div class="flex items-baseline gap-2">
                        <span class="text-2xl font-bold text-primary">{{ product.price }} zł</span>
                        <span *ngIf="product.oldPrice" class="text-sm text-muted-foreground line-through">
                          {{ product.oldPrice }} zł
                        </span>
                      </div>
                      <span 
                        *ngIf="product.stock > 0" 
                        class="text-sm"
                        [class]="product.stock < 5 ? 'text-orange-600' : 'text-green-600'"
                      >
                        {{ product.stock < 5 ? ('PRODUCTS.LIMITED_STOCK' | translate) : ('PRODUCTS.AVAILABLE' | translate) }}
                      </span>
                      <span *ngIf="product.stock === 0" class="text-sm text-red-600">
                        {{ 'PRODUCTS.OUT_OF_STOCK' | translate }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <app-pagination
              [currentPage]="currentPage"
              [totalItems]="totalItems"
              [pageSize]="pageSize"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)">
            </app-pagination>
          </div>

          <!-- No Results -->
          <ng-template #noResults>
            <div class="text-center py-16">
              <svg class="mx-auto h-24 w-24 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 class="text-xl font-semibold mb-2">{{ 'PRODUCTS.NO_RESULTS' | translate }}</h3>
              <p class="text-muted-foreground mb-4">
                {{ 'PRODUCTS.TRY_DIFFERENT_FILTERS' | translate }}
              </p>
              <button
                (click)="clearFilters()"
                class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {{ 'PRODUCTS.CLEAR_ALL_FILTERS' | translate }}
              </button>
            </div>
          </ng-template>
        </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class ProductsComponent implements OnInit, OnDestroy {
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  categories: Category[] = [];

  // Filter values
  searchTerm: string = '';
  selectedCategory: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortOption: SortOption = 'newest';
  viewMode: 'grid' | 'list' = 'grid';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 12;
  totalItems: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private languageService: LanguageService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Load products and categories with auto-reload on language change
    this.languageService.currentLanguage$.pipe(
      takeUntil(this.destroy$),
      switchMap(() => combineLatest([
        this.apiService.getAllProducts(),
        this.apiService.getAllCategories()
      ]))
    ).subscribe(([products, categories]) => {
      this.allProducts = products;
      this.categories = categories;
      
      // Check for category filter in query params
      this.route.queryParams.pipe(
        takeUntil(this.destroy$)
      ).subscribe(params => {
        if (params['category']) {
          this.selectedCategory = params['category'];
        }
        this.applyFilters();
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    let filtered = [...this.allProducts];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        (p.description?.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (this.selectedCategory) {
      const allowedCategories = this.getDescendantCategoryIds(this.selectedCategory);
      filtered = filtered.filter(p => allowedCategories.has(p.categoryId));
    }

    // Price range filter
    if (this.minPrice !== null && this.minPrice > 0) {
      filtered = filtered.filter(p => parseFloat(p.price) >= this.minPrice!);
    }
    if (this.maxPrice !== null && this.maxPrice > 0) {
      filtered = filtered.filter(p => parseFloat(p.price) <= this.maxPrice!);
    }

    // Apply sorting
    filtered = this.sortProducts(filtered, this.sortOption);

    this.filteredProducts = filtered;
    this.totalItems = filtered.length;
    
    // Reset to page 1 when filters change
    this.currentPage = 1;
    this.updatePaginatedProducts();
  }

  updatePaginatedProducts(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePaginatedProducts();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.updatePaginatedProducts();
  }

  sortProducts(products: Product[], option: SortOption): Product[] {
    const sorted = [...products];
    
    switch (option) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name, 'pl'));
      case 'price-asc':
        return sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case 'price-desc':
        return sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      case 'rating-desc':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      default:
        return sorted;
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortOption = 'newest';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.selectedCategory ||
      this.minPrice !== null ||
      this.maxPrice !== null
    );
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  }

  private getDescendantCategoryIds(rootId: string): Set<string> {
    const ids = new Set<string>([rootId]);
    const queue = [rootId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = this.categories.filter(c => c.parent === currentId);
      children.forEach(child => {
        if (!ids.has(child.id)) {
          ids.add(child.id);
          queue.push(child.id);
        }
      });
    }
    return ids;
  }

  navigateToProduct(productId: string): void {
    this.router.navigate(['/product', productId]);
  }
}

