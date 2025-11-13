import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CartItem } from '../../models';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'bg-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Overlay -->
    <div class="fixed inset-0 z-40 bg-black/50" (click)="close.emit()"></div>

    <!-- Drawer -->
    <aside class="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-background border-l shadow-xl flex flex-col">
      <div class="flex items-center justify-between px-6 py-5 border-b">
        <h2 class="font-heading font-bold text-2xl">Koszyk<span class="text-muted-foreground" *ngIf="(cart$ | async) as items"> ({{ items.length }} produktów)</span></h2>
        <button (click)="close.emit()" class="p-2 hover:bg-muted rounded-md">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Empty state -->
      <div *ngIf="(cart$ | async)!.length === 0" class="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <svg class="h-16 w-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          <h3 class="text-lg font-semibold mb-2">Twój koszyk jest pusty</h3>
          <p class="text-sm text-muted-foreground mb-6">Dodaj produkty, aby kontynuować zakupy</p>
          <button (click)="close.emit()" class="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-md">Kontynuuj zakupy</button>
        </div>
      </div>

      <!-- Items list -->
      <div *ngIf="(cart$ | async)!.length > 0" class="flex-1 overflow-y-auto p-4 space-y-4">
        <div *ngFor="let item of (cart$ | async)" class="border rounded-xl p-4">
          <div class="flex gap-3">
            <img [src]="item.product.image" [alt]="item.product.name" class="w-20 h-20 object-cover rounded" />
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <h3 class="font-semibold truncate">{{ item.product.name }}</h3>
                  <p class="text-sm text-muted-foreground truncate">{{ item.product.dimensions }}</p>
                </div>
                <div class="font-bold whitespace-nowrap">{{ parseFloat(item.product.price) | number:'1.2-2' }} PLN</div>
              </div>

              <div class="mt-3 flex items-center gap-3">
                <button class="w-8 h-8 rounded border flex items-center justify-center" (click)="decrease(item)">−</button>
                <span class="w-6 text-center">{{ item.quantity }}</span>
                <button class="w-8 h-8 rounded border flex items-center justify-center" (click)="increase(item)">+</button>
                <button class="ml-auto p-2 text-muted-foreground hover:text-destructive" (click)="remove(item)">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 7h4m-7 0V5a2 2 0 012-2h6a2 2 0 012 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer summary -->
      <div *ngIf="(cart$ | async)!.length > 0" class="border-t p-6">
        <div class="flex items-center justify-between mb-4">
          <span class="text-lg font-semibold">Suma:</span>
          <span class="text-xl font-bold">{{ (totalPrice$ | async) | number:'1.2-2' }} PLN</span>
        </div>
        <button (click)="goToCheckout()" class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold">Przejdź do kasy</button>
      </div>
    </aside>
  `,
  styles: []
})
export class CartDrawerComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  cart$: Observable<CartItem[]>;
  totalPrice$: Observable<number>;

  constructor(private cartService: CartService, private router: Router) {
    this.cart$ = this.cartService.cart$;
    this.totalPrice$ = this.cartService.totalPrice$;
  }

  ngOnInit(): void {}

  increase(item: CartItem): void {
    this.cartService.updateQuantity(item.product.id, item.quantity + 1);
  }

  decrease(item: CartItem): void {
    this.cartService.updateQuantity(item.product.id, item.quantity - 1);
  }

  remove(item: CartItem): void {
    this.cartService.removeItem(item.product.id);
  }

  goToCheckout(): void {
    this.close.emit();
    this.router.navigate(['/checkout']);
  }

  parseFloat(value: string): number {
    return parseFloat(value);
  }
}




