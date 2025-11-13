import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { Product } from '../../models';

@Component({
  selector: 'bg-product-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 py-12 bg-background" *ngIf="product$ | async as product">
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
                <h1 class="font-heading font-bold text-3xl sm:text-4xl mb-4">
                  {{ product.name }}
                </h1>
                <div class="flex items-center gap-1 mb-4">
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

              <div class="space-y-4">
                <div>
                  <h3 class="font-semibold text-lg mb-2">Wymiary</h3>
                  <p class="text-muted-foreground">{{ product.dimensions }}</p>
                </div>

                <div *ngIf="product.material">
                  <h3 class="font-semibold text-lg mb-2">Materiał</h3>
                  <p class="text-muted-foreground">{{ product.material }}</p>
                </div>

                <div *ngIf="product.description">
                  <h3 class="font-semibold text-lg mb-2">Opis</h3>
                  <p class="text-muted-foreground">{{ product.description }}</p>
                </div>
              </div>

              <!-- Product Variants Configuration -->
              <div *ngIf="product.attributes && product.attributes.length > 0" class="border-t pt-6">
                <h3 class="font-semibold text-lg mb-4">Konfiguracja produktu</h3>
                <div class="space-y-4">
                  <div *ngFor="let attribute of product.attributes" class="space-y-2">
                    <label class="block text-sm font-medium">
                      {{ attribute.name }}
                    </label>
                    <div class="grid grid-cols-3 gap-2">
                      <button
                        *ngFor="let variant of attribute.variants"
                        (click)="selectVariant(attribute.id, variant.id)"
                        [class]="getVariantButtonClass(attribute.id, variant.id)"
                        class="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
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

              <div class="border-t pt-6">
                <div class="flex items-center gap-4 mb-6">
                  <div>
                    <span *ngIf="product.oldPrice" class="text-lg text-muted-foreground line-through mr-2">
                      {{ parseFloat(product.oldPrice) | number:'1.2-2' }} PLN
                    </span>
                    <span class="text-3xl font-bold">
                      {{ getFinalPrice(product) | number:'1.2-2' }} PLN
                    </span>
                    <span *ngIf="getTotalPriceModifier() !== 0" class="text-sm text-muted-foreground ml-2">
                      (bazowa: {{ parseFloat(product.price) | number:'1.2-2' }} PLN)
                    </span>
                  </div>
                </div>

                <div class="space-y-3 mb-6">
                  <div class="flex items-center gap-4">
                    <span class="text-sm text-muted-foreground">Stan magazynowy:</span>
                    <span [class]="product.stock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                      {{ product.stock > 0 ? product.stock + ' szt.' : 'Brak w magazynie' }}
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-4" *ngIf="product.stock > 0">
                    <span class="text-sm text-muted-foreground">Czas dostawy:</span>
                    <span class="text-foreground font-semibold flex items-center gap-2">
                      <svg class="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      {{ getDeliveryTime(product.stock) }}
                    </span>
                  </div>
                </div>

                <button 
                  *ngIf="product.stock > 0"
                  (click)="addToCart(product)"
                  [class.scale-95]="isAdding"
                  class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  Dodaj do koszyka
                </button>

                <button 
                  *ngIf="product.stock === 0"
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
  `,
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit {
  product$: Observable<Product>;
  product: Product | null = null;
  isAdding = false;
  selectedVariants: { [attributeId: string]: string } = {}; // attributeId -> variantId

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
      
      // Initialize default variants (first option for each attribute)
      this.product$.subscribe(product => {
        this.product = product;
        if (product.attributes) {
          product.attributes.forEach(attr => {
            if (attr.variants.length > 0) {
              this.selectedVariants[attr.id] = attr.variants[0].id;
            }
          });
        }
      });
    }
  }

  addToCart(product: Product): void {
    if (this.isAdding) return;
    
    this.isAdding = true;
    this.cartService.addItem(product);
    
    // Show success notification
    this.notificationService.showSuccess(`${product.name} został dodany do koszyka! 🎉`);
    
    // Reset button state after animation
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
    
    if (this.product && this.product.attributes) {
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
