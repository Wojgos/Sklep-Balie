import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { Product, ProductSkuVariant } from '../../models';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'bg-product-details',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <ng-container *ngIf="product$ | async as product">
      <div class="flex-1 py-12 bg-background">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <!-- Product Image -->
            <div class="space-y-4">
              <div class="aspect-square overflow-hidden rounded-lg bg-card border border-card-border">
                <img 
                  [src]="product.image" 
                  [alt]="product.name"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>

            <!-- Product Info -->
            <div class="space-y-6">
              <div>
                <h1 class="font-heading font-bold text-3xl sm:text-4xl">
                  {{ product.name }}
                </h1>
                <div class="flex items-center gap-1">
                  <ng-container *ngFor="let star of [1,2,3,4,5]; let i = index">
                    <svg 
                      class="h-5 w-5"
                      [class]="i < product.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'"
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </ng-container>
                  <span class="text-muted-foreground ml-2">({{ product.rating }})</span>
                </div>
              </div>

              <div class="space-y-2">
                <div *ngIf="product.description">
                  <h3 class="font-semibold text-lg mb-2">Opis</h3>
                  <p class="text-muted-foreground">{{ product.description }}</p>
                </div>
              </div>

              <!-- Product Variants Configuration -->
              <div *ngIf="product.available_attributes && getObjectKeys(product.available_attributes).length > 0" class="border-t pt-6">
                <h3 class="font-semibold text-lg mb-4">Konfiguracja produktu</h3>
                <div class="space-y-4">
                  <div *ngFor="let attrKey of getObjectKeys(product.available_attributes)" class="space-y-2">
                    <label class="block text-sm font-medium">
                      {{ attrKey }}
                    </label>
                    <div class="grid grid-cols-3 gap-2">
                      <button
                        *ngFor="let value of product.available_attributes![attrKey]"
                        (click)="selectAttribute(attrKey, value)"
                        [class]="getAttributeButtonClass(attrKey, value)"
                        class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                      >
                        {{ value }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="border-t pt-6">
                <div class="flex items-center gap-4 mb-6">
                  <div>
                    <span *ngIf="product.oldPrice" class="text-lg text-muted-foreground line-through mr-2">
                      {{ parseFloat(product.oldPrice) | number:'1.2-2' }} PLN
                    </span>
                    <span class="text-3xl font-bold">
                      {{ getCurrentPrice() | number:'1.2-2' }} PLN
                    </span>
                  </div>
                </div>

                <div class="space-y-3 mb-6">
                  <div class="flex items-center gap-4">
                    <span class="text-sm text-muted-foreground">Stan magazynowy:</span>
                    <span [class]="getCurrentStock() > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                      {{ getCurrentStock() > 0 ? getCurrentStock() + ' szt.' : 'Brak w magazynie' }}
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-4" *ngIf="getCurrentStock() > 0">
                    <span class="text-sm text-muted-foreground">Czas dostawy:</span>
                    <span class="text-foreground font-semibold flex items-center gap-2">
                      <svg class="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      {{ getDeliveryTime(getCurrentStock()) }}
                    </span>
                  </div>
                  
                  <div *ngIf="!currentVariant && product.variants?.length" class="text-red-500 text-sm font-medium">
                    Wybrana kombinacja jest niedostępna.
                  </div>
                </div>
                
                <button 
                  *ngIf="getCurrentStock() > 0 && (currentVariant || !product.variants?.length)"
                  (click)="addToCart(product)"
                  [class.scale-95]="isAdding"
                  class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  Dodaj do koszyka
                </button>

                <button 
                  *ngIf="getCurrentStock() === 0 || (!currentVariant && product.variants?.length)"
                  disabled
                  class="w-full bg-muted text-muted-foreground px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                >
                  Produkt niedostępny
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Similar products section -->
      <section class="py-12 bg-muted/40 border-t border-border" *ngIf="isSimilarLoading || similarProducts.length">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-primary uppercase tracking-wide mb-1">
                Rekomendacje produktów
              </p>
              <h2 class="text-2xl font-heading font-semibold">
                Propozycje podobnych produktów
              </h2>
            </div>
          </div>

          <div *ngIf="isSimilarLoading" class="text-muted-foreground">
            Ładowanie propozycji...
          </div>

          <div 
            *ngIf="!isSimilarLoading && similarProducts.length > 0" 
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <bg-product-card 
              *ngFor="let similar of similarProducts" 
              [product]="similar"
            ></bg-product-card>
          </div>

          <div *ngIf="!isSimilarLoading && similarProducts.length === 0" class="text-muted-foreground text-center">
            Aktualnie brak podobnych produktów do wyświetlenia.
          </div>
        </div>
      </section>

      <!-- Bought together section -->
      <section class="py-12 bg-background border-t border-border" *ngIf="isBoughtTogetherLoading || boughtTogetherProducts.length">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-primary uppercase tracking-wide mb-1">
                Inspiracje zakupowe
              </p>
              <h2 class="text-2xl font-heading font-semibold">
                Inni kupili też…
              </h2>
            </div>
          </div>

          <div *ngIf="isBoughtTogetherLoading" class="text-muted-foreground">
            Analizujemy zamówienia klientów...
          </div>

          <div 
            *ngIf="!isBoughtTogetherLoading && boughtTogetherProducts.length > 0" 
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <bg-product-card 
              *ngFor="let productItem of boughtTogetherProducts" 
              [product]="productItem"
            ></bg-product-card>
          </div>

          <div *ngIf="!isBoughtTogetherLoading && boughtTogetherProducts.length === 0" class="text-muted-foreground text-center">
            Nie mamy jeszcze danych o wspólnych zakupach dla tego produktu.
          </div>
        </div>
      </section>
    </ng-container>
  `,
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit {
  product$: Observable<Product>;
  product: Product | null = null;
  isAdding = false;
  
  // New state for attributes and variants
  selectedAttributes: { [key: string]: string } = {};
  currentVariant: ProductSkuVariant | null = null;

  similarProducts: Product[] = [];
  boughtTogetherProducts: Product[] = [];
  isSimilarLoading = false;
  isBoughtTogetherLoading = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cartService: CartService,
    private notificationService: NotificationService
  ) {
    this.product$ = new Observable();
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.product$ = this.apiService.getProduct(productId);
      
      this.product$.subscribe(product => {
        this.product = product;
        console.log('=== DANE PRODUKTU Z BACKENDU ===');
        console.log('Pełny obiekt produktu:', JSON.stringify(product, null, 2));
        console.log('\n--- PODSTAWOWE INFORMACJE ---');
        console.log('ID:', product.id);
        console.log('Slug:', product.slug);
        console.log('Nazwa:', product.name);
        console.log('Opis:', product.description);
        console.log('Dostępny:', product.available);
        console.log('Data utworzenia:', product.createdAt);
        console.log('Data aktualizacji:', product.updatedAt);
        
        console.log('\n--- KATEGORIA ---');
        console.log('Kategoria (slug):', product.categoryId);
        console.log('Kategoria ID:', product.category_id);
        console.log('Nazwa kategorii:', product.category_name);
        
        console.log('\n--- DOSTĘPNE ATRYBUTY ---');
        console.log('available_attributes:', JSON.stringify(product.available_attributes, null, 2));
        
        console.log('\n--- WARIANTY ---');
        console.log('Liczba wariantów:', product.variants?.length || 0);
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant, index) => {
            console.log(`\nWariant ${index + 1}:`, JSON.stringify({
              id: variant.id,
              sku: variant.sku,
              name: variant.name,
              price: variant.price,
              stock: variant.stock,
              available: variant.available,
              attributes: variant.attributes_details,
              images: variant.images
            }, null, 2));
          });
        }
        
        console.log('\n--- ZDJĘCIA ---');
        console.log('Zdjęcia produktu:', JSON.stringify(product.images, null, 2));
        
        console.log('\n=== KONIEC DANYCH PRODUKTU ===\n');
        
        this.initializeAttributes(product);

        const productKey = product.slug || product.id;
        this.loadSimilarProducts(productKey);
        this.loadBoughtTogetherProducts(productKey);
      });
    }
  }

  initializeAttributes(product: Product): void {
    if (product.available_attributes) {
      Object.keys(product.available_attributes).forEach(key => {
        const values = product.available_attributes![key];
        if (values && values.length > 0) {
          this.selectedAttributes[key] = values[0];
        }
      });
      this.updateCurrentVariant(product);
    }
  }

  selectAttribute(attribute: string, value: string): void {
    this.selectedAttributes[attribute] = value;
    if (this.product) {
      this.updateCurrentVariant(this.product);
    }
  }

  updateCurrentVariant(product: Product): void {
    if (!product.variants || product.variants.length === 0) {
      this.currentVariant = null;
      return;
    }

    // Find variant that matches all selected attributes
    this.currentVariant = product.variants.find(variant => {
      return Object.keys(this.selectedAttributes).every(attrKey => {
        const selectedValue = this.selectedAttributes[attrKey];
        const variantAttr = variant.attributes_details.find(a => a.attribute === attrKey);
        return variantAttr && variantAttr.value === selectedValue;
      });
    }) || null;
  }

  getCurrentPrice(): number {
    if (this.currentVariant) {
      return parseFloat(this.currentVariant.price);
    }
    return parseFloat(this.product?.price || '0');
  }

  getCurrentStock(): number {
    if (this.currentVariant) {
      return this.currentVariant.stock;
    }
    return this.product?.stock || 0;
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getAttributeButtonClass(attribute: string, value: string): string {
    const isSelected = this.selectedAttributes[attribute] === value;
    return isSelected 
      ? 'bg-primary text-primary-foreground border-primary' 
      : 'bg-background hover:bg-muted border-border';
  }

  addToCart(product: Product): void {
    if (this.isAdding) return;
    
    this.isAdding = true;

    // Construct product object for cart (using variant details if available)
    const productToAdd: Product = this.currentVariant ? {
      ...product,
      id: this.currentVariant.id.toString(), // Use variant ID for cart uniqueness
      numericId: this.currentVariant.id,
      name: `${product.name} (${Object.values(this.selectedAttributes).join(', ')})`,
      price: this.currentVariant.price,
      stock: this.currentVariant.stock,
      // Keep original slug to allow navigation back to main product page
    } : product;
    
    this.cartService.addItem(productToAdd);
    
    this.notificationService.showSuccess(`${productToAdd.name} został dodany do koszyka! 🎉`);
    
    setTimeout(() => {
      this.isAdding = false;
    }, 200);
  }

  parseFloat(value: string): number {
    return parseFloat(value);
  }

  getDeliveryTime(stock: number): string {
    if (stock >= 10) {
      return '2-3 dni robocze';
    } else if (stock >= 5) {
      return '3-5 dni roboczych';
    } else {
      return '5-7 dni roboczych';
    }
  }

  private loadSimilarProducts(productId: string): void {
    this.isSimilarLoading = true;
    this.apiService.getSimilarProducts(productId).subscribe({
      next: (products) => {
        this.similarProducts = products;
        console.log('=== PODOBNE PRODUKTY ===');
        console.log('Liczba podobnych produktów:', products.length);
        console.log('Dane podobnych produktów:', JSON.stringify(products, null, 2));
        console.log('=== KONIEC PODOBNYCH PRODUKTÓW ===\n');
      },
      error: () => {
        this.similarProducts = [];
      },
      complete: () => {
        this.isSimilarLoading = false;
      }
    });
  }

  private loadBoughtTogetherProducts(productId: string): void {
    this.isBoughtTogetherLoading = true;
    this.apiService.getFrequentlyBoughtTogether(productId).subscribe({
      next: (products) => {
        this.boughtTogetherProducts = products;
        console.log('=== PRODUKTY KUPOWANE RAZEM ===');
        console.log('Liczba produktów kupowanych razem:', products.length);
        console.log('Dane produktów kupowanych razem:', JSON.stringify(products, null, 2));
        console.log('=== KONIEC PRODUKTÓW KUPOWANYCH RAZEM ===\n');
      },
      error: () => {
        this.boughtTogetherProducts = [];
      },
      complete: () => {
        this.isBoughtTogetherLoading = false;
      }
    });
  }
}
