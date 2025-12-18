import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, map, Subject, takeUntil, switchMap } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { LanguageService } from '../../services/language.service';
import { Product, Category, NotificationType } from '../../models';
import { ProductCardComponent } from '../../components/product-card/product-card.component';


type CategoryCardData = Category & {
  childCategories: Category[];
  totalProductCount: number;
};

@Component({
  selector: 'bg-home',
  standalone: true,
  imports: [
    CommonModule, 
    ProductCardComponent,
    TranslateModule
  ],
  template: `
    <div class="flex-1">
        <!-- Hero Section -->
        <section class="relative h-[80vh] flex items-center justify-center">
          <div class="absolute inset-0 bg-[url('/assets/Wooden_garden_barrel_hero_26de98c6.png')] bg-cover bg-center filter saturate-125 contrast-110 brightness-95"></div>
          <div class="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/35"></div>
          <div class="relative z-10 text-center max-w-4xl mx-auto px-4 text-white">
            <h1 class="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl mb-6 tracking-tight drop-shadow-lg" data-testid="text-hero-title">
              {{ 'HOME.HERO.TITLE' | translate }}<br>
              <span>{{ 'HOME.HERO.SUBTITLE_SPAN' | translate }}</span>
            </h1>
            <p class="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow" data-testid="text-hero-subtitle">
              {{ 'HOME.HERO.DESCRIPTION' | translate }}
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                (click)="navigateToProducts()"
                class="inline-flex items-center justify-center gap-3 bg-[#266741] text-white hover:bg-[#1f5635] px-10 py-4 rounded-full text-lg font-semibold transition-all shadow-lg shadow-black/30">
                {{ 'HOME.HERO.BROWSE_PRODUCTS' | translate }}
                <span class="text-2xl leading-none">→</span>
              </button>
              <button class="inline-flex items-center justify-center bg-white/80 text-[#3a3a3a] hover:bg-white px-10 py-4 rounded-full text-lg font-semibold transition-all shadow-md">
                {{ 'HOME.HERO.VIEW_PROJECTS' | translate }}
              </button>
            </div>
            <p class="text-sm text-white/80 mt-6 tracking-wide">
              {{ 'HOME.HERO.QUALITY_SINCE' | translate }}
            </p>
          </div>
        </section>

        <!-- Categories Section -->
        <section id="kategorie" class="py-16 bg-background">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12 space-y-4">
              <p class="text-sm uppercase tracking-[0.3em] text-primary/80">
                {{ 'HOME.CATEGORIES.PREMIUM_OFFER' | translate }}
              </p>
              <h2 class="font-heading font-bold text-3xl sm:text-4xl" data-testid="text-categories-title">
                {{ 'HOME.CATEGORIES.TITLE' | translate }}
              </h2>
              <p class="text-muted-foreground max-w-2xl mx-auto" data-testid="text-categories-subtitle">
                {{ 'HOME.CATEGORIES.SUBTITLE' | translate }}
              </p>
            </div>

            <ng-container *ngIf="categoryCards$ | async as categoryCards">
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                <div 
                  *ngFor="let category of categoryCards" 
                  class="group cursor-pointer flex flex-col items-center"
                  (click)="navigateToCategory(category)"
                >
                  <div class="w-full aspect-square relative overflow-hidden rounded-2xl bg-muted mb-4 shadow-sm group-hover:shadow-md transition-all">
                    <img 
                      [src]="category.image" 
                      [alt]="category.name"
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                  </div>
                  <h3 class="font-semibold text-lg text-center group-hover:text-primary transition-colors">
                    {{ category.name }}
                  </h3>
                  <p class="text-sm text-muted-foreground text-center mt-1">
                    {{ category.totalProductCount }} {{ category.totalProductCount === 1 ? ('HOME.CATEGORIES.PRODUCT_SINGULAR' | translate) : ('HOME.CATEGORIES.PRODUCT_PLURAL' | translate) }}
                  </p>
                </div>
              </div>
            </ng-container>
          </div>
        </section>

        <!-- Featured Products Section -->
        <section id="produkty" class="py-16 bg-muted/30">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
              <h2 class="font-heading font-bold text-3xl sm:text-4xl mb-4" data-testid="text-featured-title">
                {{ 'HOME.FEATURED.TITLE' | translate }}
              </h2>
              <p class="text-muted-foreground max-w-2xl mx-auto" data-testid="text-featured-subtitle">
                {{ 'HOME.FEATURED.SUBTITLE' | translate }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <bg-product-card 
                *ngFor="let product of featuredProducts" 
                [product]="product"
              ></bg-product-card>
            </div>

            <div class="text-center">
              <button 
                (click)="navigateToProducts()"
                class="text-primary font-medium hover:underline"
                data-testid="link-view-all"
              >
                {{ 'HOME.FEATURED.VIEW_ALL' | translate }} →
              </button>
            </div>
          </div>
        </section>

        <!-- Features Section -->
        <section class="py-16 bg-background">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
              <h2 class="font-heading font-bold text-3xl sm:text-4xl mb-4" data-testid="text-features-title">
                {{ 'HOME.FEATURES.TITLE' | translate }}
              </h2>
              <p class="text-muted-foreground max-w-2xl mx-auto" data-testid="text-features-subtitle">
                {{ 'HOME.FEATURES.SUBTITLE' | translate }}
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div *ngFor="let feature of features" class="text-center p-6 bg-card border border-card-border rounded-lg">
                <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path [attr.d]="feature.iconPath" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                  </svg>
                </div>
                <h3 class="font-semibold text-lg mb-2">{{ feature.titleKey | translate }}</h3>
                <p class="text-muted-foreground text-sm">{{ feature.descriptionKey | translate }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Testimonials Section -->
        <section class="py-16 bg-muted/30">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
              <h2 class="font-heading font-bold text-3xl sm:text-4xl mb-4" data-testid="text-testimonials-title">
                {{ 'HOME.TESTIMONIALS.TITLE' | translate }}
              </h2>
              <p class="text-muted-foreground max-w-2xl mx-auto" data-testid="text-testimonials-subtitle">
                {{ 'HOME.TESTIMONIALS.SUBTITLE' | translate }}
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
                  "{{ testimonial.quoteKey | translate }}"
                </blockquote>
                <div class="font-semibold">{{ testimonial.nameKey | translate }}</div>
                <div class="text-sm text-muted-foreground">{{ testimonial.locationKey | translate }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Newsletter Section -->
        <section class="py-16 bg-primary text-primary-foreground">
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="font-heading font-bold text-3xl sm:text-4xl mb-4">
              {{ 'HOME.NEWSLETTER.TITLE' | translate }}
            </h2>
            <p class="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              {{ 'HOME.NEWSLETTER.DESCRIPTION' | translate }}
            </p>
            <div class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                [placeholder]="'HOME.NEWSLETTER.EMAIL_PLACEHOLDER' | translate"
                class="flex-1 px-4 py-3 rounded-lg text-foreground bg-background border border-border"
              />
              <button class="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-3 rounded-lg font-semibold transition-colors">
                {{ 'HOME.NEWSLETTER.SUBSCRIBE' | translate }}
              </button>
            </div>
          </div>
        </section>
    </div>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  categoryCards$: Observable<CategoryCardData[]>;
  products$: Observable<Product[]>;
  featuredProducts: Product[] = [];
  private destroy$ = new Subject<void>();

  features = [
    {
      titleKey: 'HOME.FEATURES.NATURAL_WOOD_TITLE',
      descriptionKey: 'HOME.FEATURES.NATURAL_WOOD_DESC',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      titleKey: 'HOME.FEATURES.FAST_DELIVERY_TITLE',
      descriptionKey: 'HOME.FEATURES.FAST_DELIVERY_DESC',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      titleKey: 'HOME.FEATURES.EXPERT_ADVICE_TITLE',
      descriptionKey: 'HOME.FEATURES.EXPERT_ADVICE_DESC',
      iconPath: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  ];

  testimonials = [
    {
      nameKey: 'HOME.TESTIMONIALS.CUSTOMER_1_NAME',
      locationKey: 'HOME.TESTIMONIALS.CUSTOMER_1_LOCATION',
      rating: 5,
      quoteKey: 'HOME.TESTIMONIALS.CUSTOMER_1_QUOTE'
    },
    {
      nameKey: 'HOME.TESTIMONIALS.CUSTOMER_2_NAME',
      locationKey: 'HOME.TESTIMONIALS.CUSTOMER_2_LOCATION',
      rating: 5,
      quoteKey: 'HOME.TESTIMONIALS.CUSTOMER_2_QUOTE'
    },
    {
      nameKey: 'HOME.TESTIMONIALS.CUSTOMER_3_NAME',
      locationKey: 'HOME.TESTIMONIALS.CUSTOMER_3_LOCATION',
      rating: 5,
      quoteKey: 'HOME.TESTIMONIALS.CUSTOMER_3_QUOTE'
    }
  ];

  constructor(
    private apiService: ApiService, 
    private notificationService: NotificationService,
    private languageService: LanguageService,
    private router: Router
  ) {
    this.categoryCards$ = this.languageService.currentLanguage$.pipe(
      switchMap(() => this.apiService.getAllCategories()),
      map(categories => this.buildCategoryCards(categories))
    );
    
    this.products$ = this.languageService.currentLanguage$.pipe(
      switchMap(() => this.apiService.getAllProducts())
    );
  }

  ngOnInit(): void {
    this.products$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(products => {
      this.featuredProducts = products.slice(0, 4);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  navigateToCategory(category: Category): void {
    this.router.navigate(['/products'], { 
      queryParams: { category: category.id } 
    });
  }

  private buildCategoryCards(categories: Category[]): CategoryCardData[] {
    const childrenMap = categories.reduce<Map<string, Category[]>>((acc, category) => {
      if (category.parent) {
        const siblings = acc.get(category.parent) ?? [];
        siblings.push(category);
        acc.set(category.parent, siblings);
      }
      return acc;
    }, new Map());

    const totalsCache = new Map<string, number>();
    const getChildren = (id: string): Category[] => childrenMap.get(id) ?? [];

    const calculateTotal = (category: Category): number => {
      if (totalsCache.has(category.id)) {
        return totalsCache.get(category.id)!;
      }
      const children = getChildren(category.id);
      const total = (category.productCount ?? 0) + children.reduce((sum, child) => sum + calculateTotal(child), 0);
      totalsCache.set(category.id, total);
      return total;
    };

    return categories
      //.filter(category => !category.parent)
      .map(category => ({
        ...category,
        childCategories: getChildren(category.id),
        totalProductCount: calculateTotal(category)
      }))
      .sort((a, b) => b.totalProductCount - a.totalProductCount);
  }

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

