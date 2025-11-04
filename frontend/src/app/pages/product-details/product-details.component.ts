import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'bg-product-details',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <bg-header></bg-header>
      
      <main class="flex-1 py-12 bg-background" *ngIf="product$ | async as product">
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

              <div class="border-t pt-6">
                <div class="flex items-center gap-4 mb-6">
                  <div>
                    <span *ngIf="product.oldPrice" class="text-lg text-muted-foreground line-through mr-2">
                      {{ parseFloat(product.oldPrice) | number:'1.2-2' }} PLN
                    </span>
                    <span class="text-3xl font-bold">
                      {{ parseFloat(product.price) | number:'1.2-2' }} PLN
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-4 mb-6">
                  <span class="text-sm text-muted-foreground">Stan magazynowy:</span>
                  <span [class]="product.stock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                    {{ product.stock > 0 ? product.stock + ' szt.' : 'Brak w magazynie' }}
                  </span>
                </div>

                <button 
                  *ngIf="product.stock > 0"
                  (click)="addToCart(product)"
                  class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-colors"
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
      </main>

      <bg-footer></bg-footer>
    </div>
  `,
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit {
  product$: Observable<Product>;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cartService: CartService
  ) {
    this.product$ = new Observable();
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.product$ = this.apiService.getProduct(productId);
    }
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product);
    console.log(`Dodano ${product.name} do koszyka`);
  }

  parseFloat(value: string): number {
    return parseFloat(value);
  }
}
