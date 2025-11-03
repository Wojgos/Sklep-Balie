import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { Product, Category, NotificationType } from '../../models';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { CategoryCardComponent } from '../../components/category-card/category-card.component';

@Component({
  selector: 'bg-home',
  standalone: true,
  imports: [
    CommonModule, 
    HeaderComponent, 
    FooterComponent, 
    ProductCardComponent, 
    CategoryCardComponent
  ],
  template: `
    <div class="min-h-screen flex flex-col">
      <bg-header></bg-header>
      
      <main class="flex-1">
        <!-- Hero Section -->
        <section class="relative h-[80vh] flex items-center justify-center">
          <div class="absolute inset-0 bg-[url('/assets/Wooden_garden_barrel_hero_26de98c6.png')] bg-cover bg-center filter saturate-125 contrast-110 brightness-95"></div>
          <div class="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/35"></div>
          <div class="relative z-10 text-center max-w-4xl mx-auto px-4 text-white">
            <h1 class="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 tracking-tight drop-shadow-lg" data-testid="text-hero-title">
              Drewniane Bale Ogrodowe<br>
              <span>Naturalny Relaks</span>
            </h1>
            <p class="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow" data-testid="text-hero-subtitle">
              Odkryj naszą kolekcję drewnianych bali, kadzi i beczek na wodę. Idealne do ogrodu, tarasu i kąpieli. 
              Profesjonalne doradztwo i szybka dostawa.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button class="inline-flex items-center justify-center gap-3 bg-[#266741] text-white hover:bg-[#1f5635] px-10 py-4 rounded-full text-lg font-semibold transition-all shadow-lg shadow-black/30">
                Przeglądaj Produkty
                <span class="text-2xl leading-none">→</span>
              </button>
              <button class="inline-flex items-center justify-center bg-white/80 text-[#3a3a3a] hover:bg-white px-10 py-4 rounded-full text-lg font-semibold transition-all shadow-md">
                Zobacz Realizacje
              </button>
            </div>
            <!-- Notification Test Buttons (for testing purposes) -->
            <div class="flex flex-wrap gap-2 justify-center mt-4">
              <button 
                (click)="testSuccessNotification()"
                class="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded text-sm transition-colors">
                Test Success
              </button>
              <button 
                (click)="testErrorNotification()"
                class="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors">
                Test Error
              </button>
              <button 
                (click)="testWarningNotification()"
                class="bg-yellow-600 text-white hover:bg-yellow-700 px-4 py-2 rounded text-sm transition-colors">
                Test Warning
              </button>
              <button 
                (click)="testInfoNotification()"
                class="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded text-sm transition-colors">
                Test Info
              </button>
            </div>
            <p class="text-sm text-white/80 mt-6 tracking-wide">
              ⭐ Premium Jakość od 2015 · 10,000+ Zadowolonych Klientów
            </p>
          </div>
        </section>

        <!-- Categories Section -->
        <section id="kategorie" class="py-16 bg-background">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
              <h2 class="font-heading font-bold text-3xl sm:text-4xl mb-4" data-testid="text-categories-title">
                Kategorie Produktów
              </h2>
              <p class="text-muted-foreground max-w-2xl mx-auto" data-testid="text-categories-subtitle">
                Odkryj naszą szeroką gamę drewnianych bali i kadzi dla Twojego ogrodu
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <bg-category-card 
                *ngFor="let category of categories$ | async" 
                [category]="category"
              ></bg-category-card>
            </div>
          </div>
        </section>

        <!-- Featured Products Section -->
        <section id="produkty" class="py-16 bg-muted/30">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
              <h2 class="font-heading font-bold text-3xl sm:text-4xl mb-4" data-testid="text-featured-title">
                Wyróżnione Produkty
              </h2>
              <p class="text-muted-foreground max-w-2xl mx-auto" data-testid="text-featured-subtitle">
                Nasze najlepiej sprzedające się produkty
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <bg-product-card 
                *ngFor="let product of featuredProducts" 
                [product]="product"
              ></bg-product-card>
            </div>

            <div class="text-center">
              <a 
                href="#wszystkie" 
                class="text-primary font-medium hover:underline"
                data-testid="link-view-all"
              >
                Zobacz wszystkie produkty →
              </a>
            </div>
          </div>
        </section>

        <!-- Features Section -->
        <section class="py-16 bg-background">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
              <h2 class="font-heading font-bold text-3xl sm:text-4xl mb-4" data-testid="text-features-title">
                Dlaczego My?
              </h2>
              <p class="text-muted-foreground max-w-2xl mx-auto" data-testid="text-features-subtitle">
                Jesteśmy ekspertami w produkcji drewnianych bali ogrodowych
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div *ngFor="let feature of features" class="text-center p-6 bg-card border border-card-border rounded-lg">
                <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path [attr.d]="feature.iconPath" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                </div>
                <h3 class="font-semibold text-lg mb-2">{{ feature.title }}</h3>
                <p class="text-muted-foreground text-sm">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Testimonials Section -->
        <section class="py-16 bg-muted/30">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
              <h2 class="font-heading font-bold text-3xl sm:text-4xl mb-4" data-testid="text-testimonials-title">
                Opinie Klientów
              </h2>
              <p class="text-muted-foreground max-w-2xl mx-auto" data-testid="text-testimonials-subtitle">
                Zobacz co mówią o nas nasi zadowoleni klienci
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div *ngFor="let testimonial of testimonials" class="bg-card border border-card-border rounded-lg p-6">
                <div class="flex items-center gap-1 mb-4">
                  <ng-container *ngFor="let star of [1,2,3,4,5]; let i = index">
                    <svg 
                      class="h-4 w-4"
                      [class]="i < testimonial.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'"
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </ng-container>
                </div>
                <blockquote class="text-muted-foreground mb-4">
                  "{{ testimonial.quote }}"
                </blockquote>
                <div class="font-semibold">{{ testimonial.name }}</div>
                <div class="text-sm text-muted-foreground">{{ testimonial.location }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Newsletter Section -->
        <section class="py-16 bg-primary text-primary-foreground">
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="font-heading font-bold text-3xl sm:text-4xl mb-4">
              Bądź na bieżąco
            </h2>
            <p class="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Zapisz się do naszego newslettera i otrzymuj najnowsze informacje o produktach, 
              promocjach i poradach ogrodniczych.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Twój adres email"
                class="flex-1 px-4 py-3 rounded-lg text-foreground bg-background border border-border"
              />
              <button class="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-3 rounded-lg font-semibold transition-colors">
                Zapisz się
              </button>
            </div>
          </div>
        </section>
      </main>

      <bg-footer></bg-footer>
    </div>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  categories$: Observable<Category[]>;
  products$: Observable<Product[]>;
  featuredProducts: Product[] = [];

  features = [
    {
      title: 'Naturalne Drewno',
      description: 'Wykonane z najwyższej jakości drewna dębowego i sosnowego',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: 'Szybka Dostawa',
      description: 'Dostarczamy Twoje zamówienie w ciągu 3-5 dni roboczych',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: 'Fachowe Doradztwo',
      description: 'Nasi eksperci pomogą Ci wybrać odpowiednią balię',
      iconPath: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  ];

  testimonials = [
    {
      name: 'Jan Kowalski',
      location: 'Warszawa',
      rating: 5,
      quote: 'Wspaniała balia! Doskonała jakość drewna i szybka dostawa. Polecam!'
    },
    {
      name: 'Anna Nowak',
      location: 'Kraków',
      rating: 5,
      quote: 'Moja kadź ogrodowa to teraz ulubione miejsce relaksu. Profesjonalna obsługa!'
    },
    {
      name: 'Piotr Wiśniewski',
      location: 'Gdańsk',
      rating: 5,
      quote: 'Beczka ozdobna pięknie wygląda w ogrodzie. Świetne wykonanie!'
    }
  ];

  constructor(private apiService: ApiService, private notificationService: NotificationService) {
    this.categories$ = this.apiService.getCategories();
    this.products$ = this.apiService.getProducts();
  }

  ngOnInit(): void {
    this.products$.subscribe(products => {
      this.featuredProducts = products.slice(0, 4);
    });
  }

  // Test methods for notification service
  testSuccessNotification(): void {
    this.notificationService.showSuccess('Produkt został dodany do koszyka!');
  }

  testErrorNotification(): void {
    this.notificationService.showError('Wystąpił błąd podczas przetwarzania zamówienia.');
  }

  testWarningNotification(): void {
    this.notificationService.showWarning('Mało produktów w magazynie - zostało tylko 3 sztuki.');
  }

  testInfoNotification(): void {
    this.notificationService.showInfo('Nowe produkty zostały dodane do naszej oferty!');
  }
}

