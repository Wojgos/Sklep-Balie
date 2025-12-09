import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Product } from '../../models';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { ProductQuickViewComponent } from '../product-quick-view/product-quick-view.component';

@Component({
  selector: 'bg-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductQuickViewComponent, TranslateModule],
  template: `
    <a [routerLink]="['/product', product.slug || product.id]" class="block h-full">
      <div 
        class="group overflow-hidden hover:shadow-lg active:shadow-xl transition-all cursor-pointer bg-card border border-card-border rounded-lg h-full flex flex-col"
        [attr.data-testid]="'card-product-' + product.id"
      >
        <div class="relative aspect-[4/3] overflow-hidden">
          <img 
            [src]="product.image" 
            [alt]="product.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          <!-- Quick View Button -->
          <button
            (click)="openQuickView($event)"
            class="absolute top-3 left-3 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            data-testid="button-quick-view"
            [title]="'PRODUCT.QUICK_VIEW' | translate"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </button>

          <!-- Wishlist Button -->
          <button
            (click)="toggleWishlist($event)"
            [class]="'absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ' + 
                     (wishlist ? 'bg-red-500 text-white' : 'bg-background/80 backdrop-blur-sm')"
            data-testid="button-wishlist"
          >
            <svg 
              class="h-4 w-4" 
              [class.fill-current]="wishlist"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </button>
        </div>

        <div class="p-4 flex flex-col flex-1">
          <div class="flex items-center gap-1 mb-2">
            <ng-container *ngFor="let star of [1,2,3,4,5]; let i = index">
              <svg 
                class="h-3 w-3"
                [class]="i < product.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'"
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </ng-container>
            <span class="text-xs text-muted-foreground ml-1" data-testid="text-rating">
              ({{ product.rating }})
            </span>
          </div>

          <h3 class="font-semibold text-lg mb-1 line-clamp-2" data-testid="text-product-name">
            {{ product.name }}
          </h3>
          
          <p *ngIf="product.variantSummary" class="text-sm text-muted-foreground mb-3" data-testid="text-variants">
            {{ product.variantSummary }}
          </p>

          <div class="flex items-center justify-between gap-2 mt-auto">
            <div>
              <span 
                *ngIf="product.oldPrice" 
                class="text-sm text-muted-foreground line-through mr-2" 
                data-testid="text-old-price"
              >
                {{ parseFloat(product.oldPrice) | number:'1.2-2' }} PLN
              </span>
              <span class="text-xl font-bold" data-testid="text-price">
                {{ parseFloat(product.price) | number:'1.2-2' }} PLN
              </span>
            </div>
          </div>

          <button 
            class="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-all" 
            [class.animate-bounce-once]="isAdding"
            (click)="addToCart($event)"
            data-testid="button-add-to-cart"
          >
            {{ 'CART.ADD_TO_CART' | translate }}
          </button>
        </div>
      </div>
    </a>

    <!-- Quick View Modal -->
    <bg-product-quick-view
      *ngIf="showQuickView"
      [product]="product"
      (close)="showQuickView = false"
    ></bg-product-quick-view>
  `,
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;
  wishlist = false;
  isAdding = false;
  showQuickView = false;

  constructor(
    private cartService: CartService,
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {}

  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.wishlist = !this.wishlist;
  }

  openQuickView(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.showQuickView = true;
  }

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.isAdding) return;
    
    this.isAdding = true;
    this.cartService.addItem(this.product);
    
    // Show success notification
    const message = this.translate.instant('CART.ADDED_TO_CART', { productName: this.product.name });
    this.notificationService.showSuccess(message);
    
    // Reset button state after animation
    setTimeout(() => {
      this.isAdding = false;
    }, 500);
  }

  parseFloat(value: string): number {
    return parseFloat(value);
  }
}

