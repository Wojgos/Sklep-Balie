import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, map } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Product, Category } from '../../models';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'rating-desc' | 'newest';

@Component({
  selector: 'bg-products',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ProductCardComponent
  ],
  template: `
    <div class="flex-1 bg-background">
        <!-- Page Header -->
        <section class="bg-primary text-primary-foreground py-12">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 class="font-heading font-bold text-4xl mb-2">Wszystkie Produkty</h1>
            <p class="text-primary-foreground/80">Odkryj naszą pełną kolekcję drewnianych produktów ogrodowych</p>
          </div>
        </section>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Search and Filters Bar -->
          <div class="bg-card border border-card-border rounded-lg p-6 mb-8 shadow-sm">
            <div class="flex flex-col lg:flex-row gap-4">
              <!-- Search -->
              <div class="flex-1">
                <label class="block text-sm font-medium mb-2">Szukaj</label>
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="searchTerm"
                    (ngModelChange)="applyFilters()"
                    placeholder="Szukaj produktów..."
                    class="w-full px-4 py-2 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>

              <!-- Category Filter -->
              <div class="lg:w-56">
                <label class="block text-sm font-medium mb-2">Kategoria</label>
                <select
                  [(ngModel)]="selectedCategory"
                  (ngModelChange)="applyFilters()"
                  class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                >
                  <option value="">Wszystkie kategorie</option>
                  <option *ngFor="let category of categories" [value]="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <!-- Material Filter -->
              <div class="lg:w-48">
                <label class="block text-sm font-medium mb-2">Materiał</label>
                <select
                  [(ngModel)]="selectedMaterial"
                  (ngModelChange)="applyFilters()"
                  class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                >
                  <option value="">Wszystkie materiały</option>
                  <option *ngFor="let material of materials" [value]="material">
                    {{ material }}
                  </option>
                </select>
              </div>

              <!-- Sort -->
              <div class="lg:w-56">
                <label class="block text-sm font-medium mb-2">Sortuj</label>
                <select
                  [(ngModel)]="sortOption"
                  (ngModelChange)="applyFilters()"
                  class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                >
                  <option value="newest">Najnowsze</option>
                  <option value="name-asc">Nazwa (A-Z)</option>
                  <option value="name-desc">Nazwa (Z-A)</option>
                  <option value="price-asc">Cena (rosnąco)</option>
                  <option value="price-desc">Cena (malejąco)</option>
                  <option value="rating-desc">Ocena (najwyższe)</option>
                </select>
              </div>
            </div>

            <!-- Price Range Filter -->
            <div class="mt-4 pt-4 border-t border-border">
              <label class="block text-sm font-medium mb-2">Zakres cenowy</label>
              <div class="flex items-center gap-4">
                <div class="flex-1">
                  <input
                    type="number"
                    [(ngModel)]="minPrice"
                    (ngModelChange)="applyFilters()"
                    placeholder="Min"
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
                    placeholder="Max"
                    min="0"
                    class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>
                <button
                  (click)="clearFilters()"
                  class="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Wyczyść
                </button>
              </div>
            </div>

            <!-- Active Filters -->
            <div *ngIf="hasActiveFilters()" class="mt-4 pt-4 border-t border-border">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium">Aktywne filtry:</span>
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
                  *ngIf="selectedMaterial"
                  (click)="selectedMaterial = ''; applyFilters()"
                  class="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                >
                  {{ selectedMaterial }}
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
              Znaleziono <span class="font-semibold text-foreground">{{ filteredProducts.length }}</span> 
              {{ filteredProducts.length === 1 ? 'produkt' : filteredProducts.length < 5 ? 'produkty' : 'produktów' }}
            </p>
            <div class="flex items-center gap-2">
              <button
                (click)="viewMode = 'grid'"
                [class]="viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'"
                class="p-2 rounded-lg transition-colors border border-border"
                title="Widok siatki"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                </svg>
              </button>
              <button
                (click)="viewMode = 'list'"
                [class]="viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'"
                class="p-2 rounded-lg transition-colors border border-border"
                title="Widok listy"
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
            <div *ngIf="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <bg-product-card 
                *ngFor="let product of filteredProducts" 
                [product]="product"
              ></bg-product-card>
            </div>

            <!-- List View -->
            <div *ngIf="viewMode === 'list'" class="space-y-4">
              <div 
                *ngFor="let product of filteredProducts"
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
                      <span class="flex items-center gap-1">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                        </svg>
                        {{ product.dimensions }}
                      </span>
                      <span *ngIf="product.material">{{ product.material }}</span>
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
                        {{ product.stock < 5 ? 'Ostatnie sztuki!' : 'Dostępny' }}
                      </span>
                      <span *ngIf="product.stock === 0" class="text-sm text-red-600">
                        Brak w magazynie
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <ng-template #noResults>
            <div class="text-center py-16">
              <svg class="mx-auto h-24 w-24 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 class="text-xl font-semibold mb-2">Nie znaleziono produktów</h3>
              <p class="text-muted-foreground mb-4">
                Spróbuj zmienić kryteria wyszukiwania lub filtry
              </p>
              <button
                (click)="clearFilters()"
                class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Wyczyść wszystkie filtry
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
export class ProductsComponent implements OnInit {
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  materials: string[] = [];

  // Filter values
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedMaterial: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortOption: SortOption = 'newest';
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Load products and categories
    combineLatest([
      this.apiService.getProducts(),
      this.apiService.getCategories()
    ]).subscribe(([products, categories]) => {
      this.allProducts = products;
      this.categories = categories;
      
      // Extract unique materials
      this.materials = [...new Set(products
        .map(p => p.material)
        .filter(m => m !== null && m !== undefined))] as string[];
      
      // Check for category filter in query params
      this.route.queryParams.subscribe(params => {
        if (params['category']) {
          this.selectedCategory = params['category'];
        }
        this.applyFilters();
      });
    });
  }

  applyFilters(): void {
    let filtered = [...this.allProducts];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        (p.description?.toLowerCase().includes(term)) ||
        (p.material?.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.categoryId === this.selectedCategory);
    }

    // Material filter
    if (this.selectedMaterial) {
      filtered = filtered.filter(p => p.material === this.selectedMaterial);
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
    this.selectedMaterial = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortOption = 'newest';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.selectedCategory ||
      this.selectedMaterial ||
      this.minPrice !== null ||
      this.maxPrice !== null
    );
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  }

  navigateToProduct(productId: string): void {
    this.router.navigate(['/product', productId]);
  }
}

