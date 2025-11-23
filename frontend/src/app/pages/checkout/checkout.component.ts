import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { CartItem } from '../../models';

@Component({
  selector: 'bg-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex-1">
      <div class="py-12 bg-muted/30" *ngIf="!orderSuccess && (cart$ | async)!.length > 0">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="font-heading font-bold text-3xl sm:text-4xl mb-8" data-testid="text-checkout-title">
            Finalizacja zamówienia
          </h1>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Checkout Form -->
            <div class="lg:col-span-2">
              <div class="bg-card border border-card-border rounded-lg p-6">
                <h2 class="text-xl font-semibold mb-6">Dane do wysyłki</h2>
                <form [formGroup]="checkoutForm" (ngSubmit)="onSubmit()" class="space-y-6">
                  <div>
                    <label class="block text-sm font-medium mb-2">Imię i nazwisko *</label>
                    <input
                      type="text"
                      formControlName="customerName"
                      placeholder="Jan Kowalski"
                      class="w-full px-3 py-2 border border-border rounded-md bg-background"
                      data-testid="input-customer-name"
                    />
                    <div *ngIf="checkoutForm.get('customerName')?.invalid && checkoutForm.get('customerName')?.touched" 
                         class="text-destructive text-sm mt-1">
                      Imię i nazwisko jest wymagane
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        formControlName="email"
                        placeholder="jan@example.com"
                        class="w-full px-3 py-2 border border-border rounded-md bg-background"
                        data-testid="input-email"
                      />
                      <div *ngIf="checkoutForm.get('email')?.invalid && checkoutForm.get('email')?.touched" 
                           class="text-destructive text-sm mt-1">
                        Podaj prawidłowy adres email
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium mb-2">Telefon *</label>
                      <input
                        type="tel"
                        formControlName="phone"
                        placeholder="123456789"
                        class="w-full px-3 py-2 border border-border rounded-md bg-background"
                        data-testid="input-phone"
                      />
                      <div *ngIf="checkoutForm.get('phone')?.invalid && checkoutForm.get('phone')?.touched" 
                           class="text-destructive text-sm mt-1">
                        Numer telefonu jest wymagany
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-2">Adres *</label>
                    <input
                      type="text"
                      formControlName="address"
                      placeholder="ul. Przykładowa 123"
                      class="w-full px-3 py-2 border border-border rounded-md bg-background"
                      data-testid="input-address"
                    />
                    <div *ngIf="checkoutForm.get('address')?.invalid && checkoutForm.get('address')?.touched" 
                         class="text-destructive text-sm mt-1">
                      Adres jest wymagany
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-sm font-medium mb-2">Miasto *</label>
                      <input
                        type="text"
                        formControlName="city"
                        placeholder="Warszawa"
                        class="w-full px-3 py-2 border border-border rounded-md bg-background"
                        data-testid="input-city"
                      />
                      <div *ngIf="checkoutForm.get('city')?.invalid && checkoutForm.get('city')?.touched" 
                           class="text-destructive text-sm mt-1">
                        Miasto jest wymagane
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium mb-2">Kod pocztowy *</label>
                      <input
                        type="text"
                        formControlName="postalCode"
                        placeholder="00-000"
                        class="w-full px-3 py-2 border border-border rounded-md bg-background"
                        data-testid="input-postal-code"
                      />
                      <div *ngIf="checkoutForm.get('postalCode')?.invalid && checkoutForm.get('postalCode')?.touched" 
                           class="text-destructive text-sm mt-1">
                        Kod pocztowy musi być w formacie XX-XXX
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-2">Uwagi do zamówienia (opcjonalne)</label>
                    <textarea
                      formControlName="notes"
                      placeholder="Dodatkowe informacje..."
                      rows="3"
                      class="w-full px-3 py-2 border border-border rounded-md bg-background"
                      data-testid="textarea-notes"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    [disabled]="checkoutForm.invalid || isSubmitting"
                    data-testid="button-place-order"
                  >
                    <span *ngIf="isSubmitting">Przetwarzanie...</span>
                    <span *ngIf="!isSubmitting">Złóż zamówienie</span>
                  </button>
                </form>
              </div>
            </div>

            <!-- Order Summary -->
            <div>
              <div class="bg-card border border-card-border rounded-lg p-6 sticky top-24">
                <h2 class="text-xl font-semibold mb-6">Podsumowanie</h2>

                <div class="space-y-4 mb-6">
                  <div *ngFor="let item of (cart$ | async)" class="flex gap-3" [attr.data-testid]="'summary-item-' + item.product.id">
                    <img
                      [src]="item.product.image"
                      [alt]="item.product.name"
                      class="w-16 h-16 object-cover rounded"
                    />
                    <div class="flex-1">
                      <h3 class="font-medium text-sm" data-testid="text-summary-product-name">
                        {{ item.product.name }}
                      </h3>
                      <p class="text-sm text-muted-foreground">
                        Ilość: {{ item.quantity }}
                      </p>
                      <p class="text-sm font-semibold" data-testid="text-summary-product-price">
                        {{ (parseFloat(item.product.price) * item.quantity) | number:'1.2-2' }} PLN
                      </p>
                    </div>
                  </div>
                </div>

                <div class="border-t pt-4 space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Wartość produktów:</span>
                    <span data-testid="text-subtotal">{{ (totalPrice$ | async) | number:'1.2-2' }} PLN</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Dostawa:</span>
                    <span class="text-primary" data-testid="text-shipping">
                      {{ getShippingCost() === 0 ? 'Darmowa' : (getShippingCost() | number:'1.2-2') + ' PLN' }}
                    </span>
                  </div>
                </div>

                <div class="border-t pt-4 mt-4">
                  <div class="flex justify-between text-lg font-bold">
                    <span>Suma:</span>
                    <span data-testid="text-total">
                      {{ getFinalTotal() | number:'1.2-2' }} PLN
                    </span>
                  </div>
                </div>

                <div *ngIf="(totalPrice$ | async)! < 500" class="text-sm text-muted-foreground mt-4">
                  Dodaj produkty za {{ (500 - (totalPrice$ | async)!) | number:'1.2-2' }} PLN, aby otrzymać
                  darmową dostawę
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty Cart State -->
      <div *ngIf="!orderSuccess && (cart$ | async)!.length === 0" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <svg class="h-24 w-24 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          <h1 class="text-2xl font-bold mb-2">Twój koszyk jest pusty</h1>
          <p class="text-muted-foreground mb-6">
            Dodaj produkty do koszyka, aby kontynuować zakupy
          </p>
          <button (click)="goHome()" class="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-colors">
            Wróć do strony głównej
          </button>
        </div>
      </div>

      <!-- Success State -->
      <div *ngIf="orderSuccess" class="flex-1 flex items-center justify-center">
        <div class="text-center max-w-md">
          <div class="mb-6">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h1 class="text-3xl font-bold mb-2" data-testid="text-success-title">
            Dziękujemy za zamówienie!
          </h1>
          <p class="text-muted-foreground mb-6" data-testid="text-success-message">
            Twoje zamówienie zostało przyjęte. Wkrótce skontaktujemy się z Tobą w celu
            potwierdzenia szczegółów.
          </p>
          <p class="text-sm text-muted-foreground">
            Za chwilę zostaniesz przekierowany na stronę główną...
          </p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  checkoutForm: FormGroup;
  cart$: Observable<CartItem[]>;
  totalPrice$: Observable<number>;
  isSubmitting = false;
  orderSuccess = false;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private apiService: ApiService,
    private router: Router
  ) {
    this.cart$ = this.cartService.cart$;
    this.totalPrice$ = this.cartService.totalPrice$;
    
    this.checkoutForm = this.fb.group({
      customerName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(9)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{3}$/)]],
      notes: ['']
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.checkoutForm.valid) {
      this.isSubmitting = true;
      
      const formData = this.checkoutForm.value;
      const cartItems = this.cartService.getItems();
      
      const orderData = {
        ...formData,
        totalPrice: this.getFinalTotal().toFixed(2),
        items: cartItems.map(item => ({
          productId: item.product.id,
          productNumericId: item.product.numericId,
          variantId: item.product.variantId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        }))
      };

      console.log('🛒 Order data being sent:', orderData);
      
      this.apiService.createOrder(orderData).subscribe({
        next: () => {
          this.orderSuccess = true;
          this.cartService.clearCart();
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 3000);
        },
        error: (error) => {
          console.error('Order creation failed:', error);
          this.isSubmitting = false;
          
          // Show user-friendly error message
          let errorMessage = 'Wystąpił błąd podczas składania zamówienia. ';
          
          if (error.error?.error) {
            errorMessage += error.error.error;
            
            // If it's a product not found error, suggest clearing cart
            if (error.error.error.includes('nie istnieje') || error.error.error.includes('niedostępny')) {
              errorMessage += '\n\nMożliwe, że w koszyku znajdują się nieaktualne produkty. Spróbuj wyczyścić koszyk i dodać produkty ponownie.';
            }
          } else {
            errorMessage += 'Sprawdź dane i spróbuj ponownie.';
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  getShippingCost(): number {
    const total = this.cartService.getTotalPrice();
    return total >= 500 ? 0 : 29.99;
  }

  getFinalTotal(): number {
    return this.cartService.getTotalPrice() + this.getShippingCost();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  parseFloat(value: string): number {
    return parseFloat(value);
  }
}

