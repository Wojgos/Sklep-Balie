import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { CartDrawerComponent } from '../cart-drawer/cart-drawer.component';

@Component({
  selector: 'bg-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SearchBarComponent, CartDrawerComponent],
  template: `
    <header class="sticky top-0 z-50 bg-background border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 gap-4">
          <div class="flex items-center gap-8">
            <button 
              class="lg:hidden p-2 hover:bg-muted rounded-md"
              (click)="toggleMobileMenu()"
              data-testid="button-menu"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            
            <a routerLink="/" class="flex items-center gap-2" data-testid="link-home">
              <div class="w-8 h-8 bg-primary rounded-md"></div>
              <span class="font-heading font-bold text-xl hidden sm:block">BarrelGarden</span>
            </a>

            <nav class="hidden lg:flex items-center gap-6">
              <a 
                routerLink="/products"
                class="text-sm font-medium hover:bg-muted px-3 py-2 rounded-md transition-colors" 
                data-testid="link-produkty"
              >
                Produkty
              </a>
              <a 
                href="#kategorie" 
                class="text-sm font-medium hover:bg-muted px-3 py-2 rounded-md transition-colors" 
                data-testid="link-kategorie"
              >
                Kategorie
              </a>
              <a 
                href="#o-nas" 
                class="text-sm font-medium hover:bg-muted px-3 py-2 rounded-md transition-colors" 
                data-testid="link-o-nas"
              >
                O nas
              </a>
              <a 
                href="#kontakt" 
                class="text-sm font-medium hover:bg-muted px-3 py-2 rounded-md transition-colors" 
                data-testid="link-kontakt"
              >
                Kontakt
              </a>
            </nav>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="p-2 hover:bg-muted rounded-md transition-colors"
              (click)="toggleTheme()"
              [attr.aria-label]="isDarkMode ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw'"
              data-testid="button-theme"
            >
              <!-- Sun/Moon icon -->
              <svg *ngIf="isDarkMode; else sun" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
              </svg>
              <ng-template #sun>
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0-1.414 1.414M7.05 16.95l-1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z"></path>
                </svg>
              </ng-template>
            </button>
            <button
              class="p-2 hover:bg-muted rounded-md transition-colors"
              (click)="toggleSearch()"
              data-testid="button-search"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>

            <button 
              class="p-2 hover:bg-muted rounded-md transition-colors"
              (click)="toggleLoyalty()"
              data-testid="button-loyalty"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13l4-4 4 4V8a4 4 0 00-4-4H8a4 4 0 00-4 4z"></path>
              </svg>
            </button>

            <button 
              class="p-2 hover:bg-muted rounded-md transition-colors" 
              data-testid="button-account"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </button>

            <button 
              class="relative p-2 hover:bg-muted rounded-md transition-all" 
              [class.animate-bounce]="cartPulse"
              (click)="toggleCart()"
              data-testid="button-cart"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293A1 1 0 005 16h12M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6"></path>
              </svg>
              <span 
                *ngIf="(itemCount$ | async)! > 0" 
                class="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center transition-all" 
                [class.scale-125]="cartPulse"
                data-testid="text-cart-count"
              >
                {{ itemCount$ | async }}
              </span>
            </button>
          </div>
        </div>

        <div *ngIf="searchOpen" class="border-t bg-background/95 backdrop-blur-sm py-4">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
            <bg-search-bar (close)="toggleSearch()"></bg-search-bar>
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Menu Overlay -->
    <div 
      *ngIf="mobileMenuOpen" 
      class="fixed inset-0 z-40 lg:hidden"
      (click)="toggleMobileMenu()"
    >
      <div class="fixed inset-y-0 left-0 w-64 bg-background border-r shadow-lg">
        <div class="p-4">
          <div class="flex items-center justify-between mb-6">
            <span class="font-heading font-bold text-xl">Menu</span>
            <button (click)="toggleMobileMenu()" class="p-2 hover:bg-muted rounded-md">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <nav class="space-y-2">
            <a routerLink="/products" class="block px-3 py-2 rounded-md hover:bg-muted">Produkty</a>
            <a href="#kategorie" class="block px-3 py-2 rounded-md hover:bg-muted">Kategorie</a>
            <a href="#o-nas" class="block px-3 py-2 rounded-md hover:bg-muted">O nas</a>
            <a href="#kontakt" class="block px-3 py-2 rounded-md hover:bg-muted">Kontakt</a>
          </nav>
        </div>
      </div>
    </div>

    <!-- Cart Drawer -->
    <ng-container *ngIf="cartOpen">
      <bg-cart-drawer (close)="toggleCart()"></bg-cart-drawer>
    </ng-container>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  searchOpen = false;
  loyaltyOpen = false;
  cartOpen = false;
  mobileMenuOpen = false;
  isDarkMode = false;
  cartPulse = false;
  
  itemCount$: Observable<number>;

  constructor(private cartService: CartService) {
    this.itemCount$ = this.cartService.itemCount$;
    
    // Subscribe to item added events to trigger animation
    this.cartService.itemAdded$.subscribe(() => {
      this.cartPulse = true;
      setTimeout(() => {
        this.cartPulse = false;
      }, 600);
    });
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('theme');
    const root = document.documentElement;
    if (saved === 'dark') {
      root.classList.add('dark');
      this.isDarkMode = true;
    } else if (saved === 'light') {
      root.classList.remove('dark');
      this.isDarkMode = false;
    } else {
      this.isDarkMode = root.classList.contains('dark');
    }
  }

  toggleTheme(): void {
    const root = document.documentElement;
    root.classList.toggle('dark');
    this.isDarkMode = root.classList.contains('dark');
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
  }

  toggleLoyalty(): void {
    this.loyaltyOpen = !this.loyaltyOpen;
  }

  toggleCart(): void {
    this.cartOpen = !this.cartOpen;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}
