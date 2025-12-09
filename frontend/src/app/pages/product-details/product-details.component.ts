import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { LanguageService } from '../../services/language.service';
import { Product, ProductSkuVariant } from '../../models';
import { ProductCardComponent } from '../../components/product-card/product-card.component';

@Component({
  selector: 'bg-product-details',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, TranslateModule],
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
                <div class="flex items-center gap-4 mt-2">
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
                  <div *ngIf="product.variants && product.variants.length > 0" class="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                    </svg>
                    <span>
                      {{ 'PRODUCT_DETAILS.AVAILABLE_IN' | translate }} {{ product.variants.length }} 
                      {{ product.variants.length === 1 ? ('PRODUCT_DETAILS.VERSION_SINGULAR' | translate) : ('PRODUCT_DETAILS.VERSION_PLURAL' | translate) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <div *ngIf="product.description">
                  <h3 class="font-semibold text-lg mb-2">{{ 'PRODUCT.DESCRIPTION' | translate }}</h3>
                  <p class="text-muted-foreground">{{ product.description }}</p>
                </div>
              </div>

              <!-- Product Variants Configuration -->
              <div *ngIf="product.available_attributes && getObjectKeys(product.available_attributes).length > 0" class="border-t pt-6">
                <h3 class="font-semibold text-lg mb-4">{{ 'PRODUCT.CONFIGURATION' | translate }}</h3>
                <div class="space-y-4">
                  <div *ngFor="let attrKey of getObjectKeys(product.available_attributes)" class="space-y-2">
                    <label class="block text-sm font-medium">
                      {{ attrKey }}
                    </label>
                    <div class="grid grid-cols-3 gap-2">
                      <button
                        *ngFor="let value of product.available_attributes![attrKey]"
                        (click)="isAttributeValueAvailable(attrKey, value) && selectAttribute(attrKey, value)"
                        [disabled]="!isAttributeValueAvailable(attrKey, value)"
                        [class]="getAttributeButtonClass(attrKey, value)"
                        [title]="!isAttributeValueAvailable(attrKey, value) ? ('PRODUCT_DETAILS.COMBINATION_UNAVAILABLE' | translate) : ''"
                        class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors flex flex-col items-center relative"
                      >
                        <span [class.line-through]="!isAttributeValueAvailable(attrKey, value)">{{ value }}</span>
                        <span *ngIf="!isAttributeValueAvailable(attrKey, value)" class="text-xs text-red-500 mt-1">{{ 'PRODUCT_DETAILS.UNAVAILABLE' | translate }}</span>
                        <span *ngIf="getPriceModifier(attrKey, value) !== 0 && isAttributeValueAvailable(attrKey, value)" class="text-xs mt-1">
                          {{ getPriceModifier(attrKey, value) > 0 ? '+' : '' }}{{ getPriceModifier(attrKey, value) | number:'1.2-2' }} PLN
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Current Variant Info -->
                <div *ngIf="currentVariant" class="mt-4 p-4 bg-muted rounded-lg border border-border">
                  <div class="flex items-start gap-3">
                    <svg class="h-5 w-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <div class="flex-1">
                      <p class="font-medium text-sm">{{ 'PRODUCT_DETAILS.SELECTED_CONFIGURATION' | translate }}:</p>
                      <p class="text-sm text-muted-foreground mt-1">{{ currentVariant.name }}</p>
                      <div class="flex items-center gap-4 mt-2 text-xs">
                        <span class="text-muted-foreground">SKU: {{ currentVariant.sku }}</span>
                        <span *ngIf="currentVariant.stock > 0" class="text-green-600 font-medium">
                          {{ 'PRODUCT_DETAILS.AVAILABLE' | translate }}: {{ currentVariant.stock }} {{ 'PRODUCT.PIECES' | translate }}
                        </span>
                        <span *ngIf="currentVariant.stock === 0" class="text-red-600 font-medium">
                          {{ 'PRODUCT.OUT_OF_STOCK' | translate }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- All Variants List -->
                <div *ngIf="product.variants && product.variants.length > 1" class="mt-4">
                  <button 
                    (click)="showAllVariants = !showAllVariants"
                    class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-between p-3 rounded-lg hover:bg-muted border border-transparent hover:border-border"
                  >
                    <span>{{ 'PRODUCT_DETAILS.VIEW_ALL_VERSIONS' | translate }} ({{ product.variants.length }})</span>
                    <svg 
                      class="h-4 w-4 transition-transform"
                      [class.rotate-180]="showAllVariants"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  
                  <div *ngIf="showAllVariants" class="mt-3 space-y-2">
                    <button 
                      *ngFor="let variant of product.variants"
                      (click)="selectVariant(variant)"
                      class="w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-md"
                      [class.border-primary]="variant.id === currentVariant?.id"
                      [class.bg-primary]="variant.id === currentVariant?.id"
                      [class.ring-2]="variant.id === currentVariant?.id"
                      [class.ring-primary]="variant.id === currentVariant?.id"
                      [class.border-border]="variant.id !== currentVariant?.id"
                      [class.hover:border-primary]="variant.id !== currentVariant?.id"
                      [class.hover:bg-muted]="variant.id !== currentVariant?.id"
                      [disabled]="variant.stock === 0"
                      [class.opacity-60]="variant.stock === 0"
                      [class.cursor-not-allowed]="variant.stock === 0"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex-1">
                          <p class="font-medium text-sm flex items-center gap-2">
                            {{ variant.name }}
                            <span *ngIf="variant.id === currentVariant?.id" class="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                              ✓ {{ 'PRODUCT_DETAILS.SELECTED' | translate }}
                            </span>
                          </p>
                          <p class="text-xs text-muted-foreground mt-1">SKU: {{ variant.sku }}</p>
                          <div class="flex items-center gap-2 mt-2">
                            <span class="text-sm font-semibold">{{ parseFloat(variant.price) | number:'1.2-2' }} PLN</span>
                            <span 
                              *ngIf="variant.stock > 0" 
                              class="text-xs px-2 py-0.5 rounded"
                              [class.bg-green-100]="variant.stock > variant.low_stock_threshold"
                              [class.text-green-700]="variant.stock > variant.low_stock_threshold"
                              [class.bg-yellow-100]="variant.stock <= variant.low_stock_threshold && variant.stock > 0"
                              [class.text-yellow-700]="variant.stock <= variant.low_stock_threshold && variant.stock > 0"
                            >
                              {{ variant.stock }} {{ 'PRODUCT.PIECES' | translate }}
                            </span>
                            <span *ngIf="variant.stock === 0" class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              {{ 'PRODUCT.OUT_OF_STOCK' | translate }}
                            </span>
                          </div>
                        </div>
                        <svg 
                          *ngIf="variant.id === currentVariant?.id"
                          class="h-5 w-5 text-primary flex-shrink-0" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <svg 
                          *ngIf="variant.id !== currentVariant?.id && variant.stock > 0"
                          class="h-5 w-5 text-muted-foreground flex-shrink-0" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
                    </button>
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
                    <span class="text-sm text-muted-foreground">{{ 'PRODUCT.STOCK_STATUS' | translate }}:</span>
                    <span [class]="getCurrentStock() > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                      {{ getCurrentStock() > 0 ? (getCurrentStock() + ' ' + ('PRODUCT.PIECES' | translate)) : ('PRODUCT.OUT_OF_STOCK' | translate) }}
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-4" *ngIf="getCurrentStock() > 0">
                    <span class="text-sm text-muted-foreground">{{ 'PRODUCT.DELIVERY' | translate }}:</span>
                    <span class="text-foreground font-semibold flex items-center gap-2">
                      <svg class="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      {{ getDeliveryTime(getCurrentStock()) }}
                    </span>
                  </div>
                  
                  <div *ngIf="!currentVariant && product.variants?.length" class="text-red-500 text-sm font-medium">
                    {{ 'PRODUCT_DETAILS.COMBINATION_UNAVAILABLE_MESSAGE' | translate }}
                  </div>
                </div>
                
                <button 
                  *ngIf="getCurrentStock() > 0 && (currentVariant || !product.variants?.length)"
                  (click)="addToCart(product)"
                  [class.scale-95]="isAdding"
                  class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  {{ 'CART.ADD_TO_CART' | translate }}
                </button>

                <button 
                  *ngIf="getCurrentStock() === 0 || (!currentVariant && product.variants?.length)"
                  disabled
                  class="w-full bg-muted text-muted-foreground px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                >
                  {{ 'PRODUCT.UNAVAILABLE' | translate }}
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
                {{ 'PRODUCT_DETAILS.RECOMMENDATIONS' | translate }}
              </p>
              <h2 class="text-2xl font-heading font-semibold">
                {{ 'PRODUCT_DETAILS.SIMILAR_PRODUCTS' | translate }}
              </h2>
            </div>
          </div>

          <div *ngIf="isSimilarLoading" class="text-muted-foreground">
            {{ 'PRODUCT_DETAILS.LOADING_SUGGESTIONS' | translate }}
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
            {{ 'PRODUCT_DETAILS.NO_SIMILAR_PRODUCTS' | translate }}
          </div>
        </div>
      </section>

      <!-- Bought together section -->
      <section class="py-12 bg-background border-t border-border" *ngIf="isBoughtTogetherLoading || boughtTogetherProducts.length">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p class="text-sm font-medium text-primary uppercase tracking-wide mb-1">
                {{ 'PRODUCT_DETAILS.SHOPPING_INSPIRATION' | translate }}
              </p>
              <h2 class="text-2xl font-heading font-semibold">
                {{ 'PRODUCT_DETAILS.OTHERS_BOUGHT' | translate }}
              </h2>
            </div>
          </div>

          <div *ngIf="isBoughtTogetherLoading" class="text-muted-foreground">
            {{ 'PRODUCT_DETAILS.ANALYZING_ORDERS' | translate }}
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
            {{ 'PRODUCT_DETAILS.NO_BOUGHT_TOGETHER_DATA' | translate }}
          </div>
        </div>
      </section>
    </ng-container>
  `,
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  product$: Observable<Product>;
  product: Product | null = null;
  isAdding = false;
  
  // New state for attributes and variants
  selectedAttributes: { [key: string]: string } = {};
  currentVariant: ProductSkuVariant | null = null;
  showAllVariants = false;

  similarProducts: Product[] = [];
  boughtTogetherProducts: Product[] = [];
  isSimilarLoading = false;
  isBoughtTogetherLoading = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private languageService: LanguageService
  ) {
    this.product$ = new Observable();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      // Auto-reload product on language change
      this.product$ = this.languageService.currentLanguage$.pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.apiService.getProduct(productId!))
      );
      
      this.product$.subscribe(product => {
        this.product = product;
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

  /**
   * Select a variant from the list and update all attribute selections
   */
  selectVariant(variant: ProductSkuVariant): void {
    // Clear current selections
    this.selectedAttributes = {};
    
    // Set all attributes from the selected variant
    if (variant.attributes_details) {
      variant.attributes_details.forEach(attr => {
        this.selectedAttributes[attr.attribute] = attr.value;
      });
    }
    
    // Update the current variant
    this.currentVariant = variant;
    
    // Scroll to configuration section
    const configSection = document.querySelector('.border-t.pt-6');
    if (configSection) {
      configSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Check if a specific attribute value is available given the current selection
   */
  isAttributeValueAvailable(attributeKey: string, value: string): boolean {
    if (!this.product?.variants || this.product.variants.length === 0) {
      return true;
    }

    // Create a temporary selection with this value
    const testSelection = { ...this.selectedAttributes, [attributeKey]: value };

    // Check if any variant matches this partial selection
    return this.product.variants.some(variant => {
      return Object.keys(testSelection).every(key => {
        const variantAttr = variant.attributes_details.find(a => a.attribute === key);
        return variantAttr && variantAttr.value === testSelection[key];
      });
    });
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
    // Jeśli produkt ma attributes (konfiguracje z panelu admina), oblicz cenę z modyfikatorami
    if (this.product?.attributes && Array.isArray(this.product.attributes) && this.product.attributes.length > 0) {
      const basePrice = parseFloat(this.product?.price || '0');
      let totalModifier = 0;

      // Dla każdej konfiguracji sprawdź wybraną wartość i jej priceModifier
      this.product.attributes.forEach((attr: any) => {
        const selectedValue = this.selectedAttributes[attr.name];
        if (selectedValue) {
          const variant = attr.variants?.find((v: any) => v.name === selectedValue);
          if (variant && variant.priceModifier) {
            totalModifier += parseFloat(variant.priceModifier);
          }
        }
      });

      return basePrice + totalModifier;
    }

    // Fallback: użyj wariantu jeśli istnieje
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
    const isAvailable = this.isAttributeValueAvailable(attribute, value);
    
    if (!isAvailable) {
      return 'bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed';
    }
    
    return isSelected 
      ? 'bg-primary text-primary-foreground border-primary' 
      : 'bg-background hover:bg-muted border-border';
  }

  getPriceModifier(attributeName: string, variantName: string): number {
    // Check if attributes exist and is an array
    if (!this.product?.attributes || !Array.isArray(this.product.attributes) || this.product.attributes.length === 0) {
      return 0;
    }
    
    const attribute = this.product.attributes.find((attr: any) => attr.name === attributeName);
    if (!attribute) return 0;
    
    const variant = attribute.variants?.find((v: any) => v.name === variantName);
    if (!variant?.priceModifier) return 0;
    
    return typeof variant.priceModifier === 'number' 
      ? variant.priceModifier 
      : parseFloat(variant.priceModifier);
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
    
    const message = this.translate.instant('CART.ADDED_TO_CART', { productName: productToAdd.name });
    this.notificationService.showSuccess(message + ' 🎉');
    
    setTimeout(() => {
      this.isAdding = false;
    }, 200);
  }

  parseFloat(value: string | number): number {
    return typeof value === 'number' ? value : parseFloat(value);
  }

  getDeliveryTime(stock: number): string {
    if (stock >= 10) {
      return this.translate.instant('PRODUCT.DELIVERY_2_3');
    } else if (stock >= 5) {
      return this.translate.instant('PRODUCT.DELIVERY_3_5');
    } else {
      return this.translate.instant('PRODUCT.DELIVERY_5_7');
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
