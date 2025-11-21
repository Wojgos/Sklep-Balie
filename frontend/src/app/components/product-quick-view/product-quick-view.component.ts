import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../models';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'bg-product-quick-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Overlay -->
    <div 
      class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      (click)="close.emit()"
    >
      <!-- Modal -->
      <div 
        class="bg-background rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        (click)="$event.stopPropagation()"
      >
        <div class="relative">
          <!-- Close Button -->
          <button
            (click)="close.emit()"
            class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background flex items-center justify-center transition-colors"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <!-- Product Image -->
            <div class="aspect-square overflow-hidden rounded-lg bg-card border border-card-border">
              <img 
                [src]="product.image" 
                [alt]="product.name"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Product Info -->
            <div class="flex flex-col">
              <h2 class="font-heading font-bold text-2xl mb-3">
                {{ product.name }}
              </h2>

              <!-- Rating -->
              <div class="flex items-center gap-1 mb-4">
                <ng-container *ngFor="let star of [1,2,3,4,5]; let i = index">
                  <svg 
                    class="h-4 w-4"
                    [class]="i < product.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'"
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </ng-container>
                <span class="text-sm text-muted-foreground ml-2">({{ product.rating }})</span>
              </div>

              <!-- Description -->
              <p class="text-muted-foreground mb-4" *ngIf="product.description">
                {{ product.description }}
              </p>

              <!-- Product Variants Configuration -->
              <div *ngIf="product.attributes && product.attributes.length > 0" class="mb-6">
                <h4 class="font-semibold mb-3">Konfiguracja</h4>
                <div class="space-y-3">
                  <div *ngFor="let attribute of product.attributes" class="space-y-2">
                    <label class="block text-xs font-medium text-muted-foreground">
                      {{ attribute.name }}
                    </label>
                    <div class="grid grid-cols-3 gap-2">
                      <button
                        *ngFor="let variant of attribute.variants"
                        (click)="selectVariant(attribute.id, variant.id)"
                        [class]="getVariantButtonClass(attribute.id, variant.id)"
                        class="px-3 py-2 text-xs font-medium rounded-md border transition-colors"
                      >
                        <div class="text-left">
                          <div>{{ variant.name }}</div>
                          <div class="text-xs opacity-75" *ngIf="variant.priceModifier && variant.priceModifier !== 0">
                            {{ variant.priceModifier > 0 ? '+' : '' }}{{ variant.priceModifier }} PLN
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Details -->
              <div class="space-y-3 mb-6">
                <div class="flex items-center gap-3">
                  <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                  </svg>
                  <span class="text-sm">
                    <span class="text-muted-foreground">Wymiary:</span> {{ product.dimensions }}
                  </span>
                </div>

                <div class="flex items-center gap-3" *ngIf="product.material">
                  <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                  </svg>
                  <span class="text-sm">
                    <span class="text-muted-foreground">Materiał:</span> {{ product.material }}
                  </span>
                </div>

                <div class="flex items-center gap-3">
                  <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                  <span class="text-sm">
                    <span class="text-muted-foreground">Stan magazynowy:</span>
                    <span [class]="product.stock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                      {{ product.stock > 0 ? product.stock + ' szt.' : 'Brak' }}
                    </span>
                  </span>
                </div>

                <div class="flex items-center gap-3" *ngIf="product.stock > 0">
                  <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span class="text-sm">
                    <span class="text-muted-foreground">Dostawa:</span>
                    <span class="font-semibold">{{ getDeliveryTime(product.stock) }}</span>
                  </span>
                </div>
              </div>

              <!-- Price -->
              <div class="mb-6">
                <div class="flex items-center gap-3">
                  <span *ngIf="product.oldPrice" class="text-lg text-muted-foreground line-through">
                    {{ parseFloat(product.oldPrice) | number:'1.2-2' }} PLN
                  </span>
                  <span class="text-3xl font-bold text-primary">
                    {{ getFinalPrice(product) | number:'1.2-2' }} PLN
                  </span>
                </div>
                <div *ngIf="getTotalPriceModifier() !== 0" class="text-xs text-muted-foreground">
                  Cena bazowa: {{ parseFloat(product.price) | number:'1.2-2' }} PLN
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-auto space-y-3">
                <button 
                  *ngIf="product.stock > 0"
                  (click)="handleAddToCart()"
                  [class.scale-95]="isAdding"
                  class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  Dodaj do koszyka
                </button>

                <button 
                  *ngIf="product.stock === 0"
                  disabled
                  class="w-full bg-muted text-muted-foreground px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                >
                  Produkt niedostępny
                </button>

                <a
                  [routerLink]="['/product', product.slug || product.id]"
                  (click)="close.emit()"
                  class="block w-full text-center border border-border hover:bg-muted px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Zobacz pełne szczegóły
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ProductQuickViewComponent implements OnInit {
  @Input() product!: Product;
  @Output() close = new EventEmitter<void>();
  
  isAdding = false;
  selectedVariants: { [attributeId: string]: string } = {};

  constructor(
    private cartService: CartService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Initialize default variants (first option for each attribute)
    if (this.product.attributes) {
      this.product.attributes.forEach(attr => {
        if (attr.variants.length > 0) {
          this.selectedVariants[attr.id] = attr.variants[0].id;
        }
      });
    }
  }

  handleAddToCart(): void {
    if (this.isAdding) return;
    
    this.isAdding = true;
    this.cartService.addItem(this.product);
    
    this.notificationService.showSuccess(`${this.product.name} został dodany do koszyka!`);
    
    setTimeout(() => {
      this.isAdding = false;
    }, 300);
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

  selectVariant(attributeId: string, variantId: string): void {
    this.selectedVariants[attributeId] = variantId;
  }

  getVariantButtonClass(attributeId: string, variantId: string): string {
    const isSelected = this.selectedVariants[attributeId] === variantId;
    return isSelected 
      ? 'bg-primary text-primary-foreground border-primary' 
      : 'bg-background hover:bg-muted border-border';
  }

  getTotalPriceModifier(): number {
    let total = 0;
    
    if (this.product.attributes) {
      this.product.attributes.forEach(attr => {
        const selectedVariantId = this.selectedVariants[attr.id];
        const variant = attr.variants.find(v => v.id === selectedVariantId);
        if (variant && variant.priceModifier) {
          total += variant.priceModifier;
        }
      });
    }
    
    return total;
  }

  getFinalPrice(product: Product): number {
    const basePrice = parseFloat(product.price);
    const modifier = this.getTotalPriceModifier();
    return basePrice + modifier;
  }
}

