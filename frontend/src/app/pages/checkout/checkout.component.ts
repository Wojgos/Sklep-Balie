import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { CartItem } from '../../models';

@Component({
  selector: 'bg-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule],
  template: `
    <div class="flex-1">
      <div class="py-12 bg-muted/30" *ngIf="!orderSuccess && (cart$ | async)!.length > 0">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="font-heading font-bold text-3xl sm:text-4xl mb-8" data-testid="text-checkout-title">
            {{ 'CHECKOUT.TITLE' | translate }}
          </h1>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Checkout Form -->
            <div class="lg:col-span-2">
              <div class="bg-card border border-card-border rounded-lg p-6">
                <h2 class="text-xl font-semibold mb-6">{{ 'CHECKOUT.SHIPPING_DATA' | translate }}</h2>
                <form [formGroup]="checkoutForm" (ngSubmit)="onSubmit()" class="space-y-6">
                  <div>
                    <label class="block text-sm font-medium mb-2">{{ 'CHECKOUT.FULL_NAME' | translate }} *</label>
                    <input
                      type="text"
                      formControlName="customerName"
                      [placeholder]="'CHECKOUT.FULL_NAME_PLACEHOLDER' | translate"
                      class="w-full px-3 py-2 border border-border rounded-md bg-background"
                      data-testid="input-customer-name"
                    />
                    <div *ngIf="checkoutForm.get('customerName')?.invalid && checkoutForm.get('customerName')?.touched" 
                         class="text-destructive text-sm mt-1">
                      {{ 'CHECKOUT.FULL_NAME_REQUIRED' | translate }}
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-sm font-medium mb-2">{{ 'FORM.EMAIL' | translate }} *</label>
                      <input
                        type="email"
                        formControlName="email"
                        [placeholder]="'FORM.EMAIL_EXAMPLE' | translate"
                        class="w-full px-3 py-2 border border-border rounded-md bg-background"
                        data-testid="input-email"
                      />
                      <div *ngIf="checkoutForm.get('email')?.invalid && checkoutForm.get('email')?.touched" 
                           class="text-destructive text-sm mt-1">
                        {{ 'AUTH.INVALID_EMAIL' | translate }}
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium mb-2">{{ 'CHECKOUT.PHONE' | translate }} *</label>
                      <input
                        type="tel"
                        formControlName="phone"
                        [placeholder]="'CHECKOUT.PHONE_PLACEHOLDER' | translate"
                        class="w-full px-3 py-2 border border-border rounded-md bg-background"
                        data-testid="input-phone"
                      />
                      <div *ngIf="checkoutForm.get('phone')?.invalid && checkoutForm.get('phone')?.touched" 
                           class="text-destructive text-sm mt-1">
                        {{ 'CHECKOUT.PHONE_REQUIRED' | translate }}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-2">{{ 'CHECKOUT.ADDRESS' | translate }} *</label>
                    <input
                      type="text"
                      formControlName="address"
                      [placeholder]="'CHECKOUT.ADDRESS_PLACEHOLDER' | translate"
                      class="w-full px-3 py-2 border border-border rounded-md bg-background"
                      data-testid="input-address"
                    />
                    <div *ngIf="checkoutForm.get('address')?.invalid && checkoutForm.get('address')?.touched" 
                         class="text-destructive text-sm mt-1">
                      {{ 'CHECKOUT.ADDRESS_REQUIRED' | translate }}
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-sm font-medium mb-2">{{ 'CHECKOUT.CITY' | translate }} *</label>
                      <input
                        type="text"
                        formControlName="city"
                        [placeholder]="'CHECKOUT.CITY_PLACEHOLDER' | translate"
                        class="w-full px-3 py-2 border border-border rounded-md bg-background"
                        data-testid="input-city"
                      />
                      <div *ngIf="checkoutForm.get('city')?.invalid && checkoutForm.get('city')?.touched" 
                           class="text-destructive text-sm mt-1">
                        {{ 'CHECKOUT.CITY_REQUIRED' | translate }}
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium mb-2">{{ 'CHECKOUT.POSTAL_CODE' | translate }} *</label>
                      <input
                        type="text"
                        formControlName="postalCode"
                        [placeholder]="'CHECKOUT.POSTAL_CODE_PLACEHOLDER' | translate"
                        class="w-full px-3 py-2 border border-border rounded-md bg-background"
                        data-testid="input-postal-code"
                      />
                      <div *ngIf="checkoutForm.get('postalCode')?.invalid && checkoutForm.get('postalCode')?.touched" 
                           class="text-destructive text-sm mt-1">
                        {{ 'CHECKOUT.POSTAL_CODE_FORMAT' | translate }}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-2">{{ 'CHECKOUT.NOTES' | translate }}</label>
                    <textarea
                      formControlName="notes"
                      [placeholder]="'CHECKOUT.NOTES_PLACEHOLDER' | translate"
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
                    <span *ngIf="isSubmitting">{{ 'CHECKOUT.PROCESSING' | translate }}</span>
                    <span *ngIf="!isSubmitting">{{ 'CHECKOUT.PLACE_ORDER' | translate }}</span>
                  </button>
                </form>
              </div>
            </div>

            <!-- Order Summary -->
            <div>
              <div class="bg-card border border-card-border rounded-lg p-6 sticky top-24">
                <h2 class="text-xl font-semibold mb-6">{{ 'CHECKOUT.SUMMARY' | translate }}</h2>

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
                        {{ 'CART.QUANTITY' | translate }}: {{ item.quantity }}
                      </p>
                      <p class="text-sm font-semibold" data-testid="text-summary-product-price">
                        {{ (parseFloat(item.product.price) * item.quantity) | number:'1.2-2' }} PLN
                      </p>
                    </div>
                  </div>
                </div>

                <div class="border-t pt-4 space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">{{ 'CHECKOUT.PRODUCTS_VALUE' | translate }}:</span>
                    <span data-testid="text-subtotal">{{ (totalPrice$ | async) | number:'1.2-2' }} PLN</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">{{ 'CHECKOUT.DELIVERY' | translate }}:</span>
                    <span class="text-primary" data-testid="text-shipping">
                      {{ getShippingCost() === 0 ? ('CHECKOUT.FREE_DELIVERY' | translate) : (getShippingCost() | number:'1.2-2') + ' PLN' }}
                    </span>
                  </div>
                </div>

                <!-- Coupon Section -->
                <div class="border-t pt-4 mt-4">
                  <div *ngIf="!appliedCoupon" class="space-y-2">
                    <label class="block text-sm font-medium">{{ 'CHECKOUT.COUPON_CODE' | translate }}</label>
                    <div class="flex gap-2">
                      <input
                        type="text"
                        [(ngModel)]="couponCode"
                        [placeholder]="'CHECKOUT.COUPON_PLACEHOLDER' | translate"
                        class="flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm"
                        [disabled]="isValidatingCoupon"
                      />
                      <button
                        (click)="applyCoupon()"
                        [disabled]="isValidatingCoupon || !couponCode.trim()"
                        class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {{ isValidatingCoupon ? ('CHECKOUT.VALIDATING' | translate) : ('CHECKOUT.APPLY' | translate) }}
                      </button>
                    </div>
                    <p *ngIf="couponError" class="text-destructive text-sm">{{ couponError }}</p>
                  </div>

                  <div *ngIf="appliedCoupon" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div class="flex justify-between items-center mb-2">
                      <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span class="text-sm font-medium text-green-800 dark:text-green-200">{{ 'CHECKOUT.COUPON_APPLIED' | translate }}</span>
                      </div>
                      <button
                        (click)="removeCoupon()"
                        class="text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 underline"
                      >
                        {{ 'CHECKOUT.REMOVE' | translate }}
                      </button>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-green-700 dark:text-green-300">{{ appliedCoupon.code }}</span>
                      <span class="font-semibold text-green-800 dark:text-green-200">
                        -{{ appliedCoupon.discount_amount | number:'1.2-2' }} PLN
                      </span>
                    </div>
                  </div>
                </div>

                <div class="border-t pt-4 mt-4">
                  <div class="flex justify-between text-lg font-bold">
                    <span>{{ 'CART.TOTAL' | translate }}:</span>
                    <span data-testid="text-total">
                      {{ getFinalTotal() | number:'1.2-2' }} PLN
                    </span>
                  </div>
                </div>

                <div *ngIf="(totalPrice$ | async)! < 500" class="text-sm text-muted-foreground mt-4">
                  {{ 'CHECKOUT.FREE_DELIVERY_INFO' | translate:{ amount: (500 - (totalPrice$ | async)!) | number:'1.2-2' } }}
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
          <h1 class="text-2xl font-bold mb-2">{{ 'CART.EMPTY' | translate }}</h1>
          <p class="text-muted-foreground mb-6">
            {{ 'CART.EMPTY_MESSAGE' | translate }}
          </p>
          <button (click)="goHome()" class="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-colors">
            {{ 'COMMON.BACK_TO_HOME' | translate }}
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
            {{ 'CHECKOUT.SUCCESS_TITLE' | translate }}
          </h1>
          <p class="text-muted-foreground mb-6" data-testid="text-success-message">
            {{ 'CHECKOUT.SUCCESS_MESSAGE' | translate }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ 'CHECKOUT.REDIRECT_MESSAGE' | translate }}
          </p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  checkoutForm: FormGroup;
  cart$: Observable<CartItem[]>;
  totalPrice$: Observable<number>;
  isSubmitting = false;
  orderSuccess = false;
  
  couponCode = '';
  appliedCoupon: any = null;
  couponError = '';
  isValidatingCoupon = false;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private apiService: ApiService,
    private router: Router,
    private translate: TranslateService,
    private languageService: LanguageService
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      this.couponError = this.translate.instant('CHECKOUT.ENTER_COUPON');
      return;
    }

    this.isValidatingCoupon = true;
    this.couponError = '';
    
    this.totalPrice$.subscribe(cartTotal => {
      this.apiService.validateCoupon(this.couponCode, cartTotal).subscribe({
        next: (response) => {
          this.appliedCoupon = {
            code: this.couponCode,
            discount_amount: response.discount_amount,
            is_percentage: response.is_percentage,
            value: response.value
          };
          this.couponError = '';
          this.isValidatingCoupon = false;
        },
        error: (err) => {
          this.couponError = err.error?.error || this.translate.instant('CHECKOUT.INVALID_COUPON');
          this.appliedCoupon = null;
          this.isValidatingCoupon = false;
        }
      });
    }).unsubscribe();
  }

  removeCoupon(): void {
    this.appliedCoupon = null;
    this.couponCode = '';
    this.couponError = '';
  }

  getDiscountAmount(): number {
    return this.appliedCoupon ? this.appliedCoupon.discount_amount : 0;
  }

  onSubmit(): void {
    if (this.checkoutForm.valid) {
      this.isSubmitting = true;
      
      const formData = this.checkoutForm.value;
      const cartItems = this.cartService.getItems();
      
      const orderData: any = {
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
      
      if (this.appliedCoupon) {
        orderData.couponCode = this.appliedCoupon.code;
        orderData.discountAmount = this.appliedCoupon.discount_amount;
      }

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
          
          let errorMessage = this.translate.instant('CHECKOUT.ORDER_ERROR') + ' ';
          
          if (error.error?.error) {
            errorMessage += error.error.error;
            
            if (error.error.error.includes('nie istnieje') || error.error.error.includes('niedostępny')) {
              errorMessage += '\n\n' + this.translate.instant('CHECKOUT.CART_ERROR_SUGGESTION');
            }
          } else {
            errorMessage += this.translate.instant('CHECKOUT.CHECK_DATA');
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
    const subtotal = this.cartService.getTotalPrice() + this.getShippingCost();
    const discount = this.getDiscountAmount();
    return Math.max(0, subtotal - discount);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  parseFloat(value: string): number {
    return parseFloat(value);
  }
}

