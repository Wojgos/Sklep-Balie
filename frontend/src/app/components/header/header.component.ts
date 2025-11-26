import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { CartDrawerComponent } from '../cart-drawer/cart-drawer.component';
import { User, NotificationType } from '../../models';

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

            <!-- User Account Menu -->
            <div class="relative user-menu-container">
              <button 
                class="p-2 hover:bg-muted rounded-md transition-colors" 
                (click)="toggleUserMenu($event)"
                data-testid="button-account"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </button>

              <!-- User Dropdown Menu -->
              <div 
                *ngIf="userMenuOpen" 
                class="absolute right-0 mt-2 w-56 bg-background border rounded-lg shadow-lg z-50 overflow-hidden"
              >
                <div *ngIf="currentUser$ | async as user; else notLoggedIn">
                  <!-- Logged In Menu -->
                  <div class="px-4 py-3 border-b bg-muted/50">
                    <p class="text-sm font-semibold">{{ user.firstName }} {{ user.lastName }}</p>
                    <p class="text-xs text-muted-foreground">{{ user.email }}</p>
                  </div>
                  <div class="py-1">
                    <a 
                      routerLink="/account" 
                      class="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                      (click)="closeUserMenu()"
                    >
                      <div class="flex items-center gap-2">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Moje konto
                      </div>
                    </a>
                    <a 
                      routerLink="/account" 
                      [queryParams]="{tab: 'orders'}"
                      class="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                      (click)="closeUserMenu()"
                    >
                      <div class="flex items-center gap-2">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                        </svg>
                        Moje zamówienia
                      </div>
                    </a>
                    <a 
                      routerLink="/support"
                      class="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                      (click)="closeUserMenu()"
                    >
                      <div class="flex items-center gap-2">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                        </svg>
                        Zgłoszenia
                      </div>
                    </a>
                    <a 
                      routerLink="/loyalty"
                      class="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                      (click)="closeUserMenu()"
                    >
                      <div class="flex items-center gap-2">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
                        </svg>
                        Program Lojalnościowy
                      </div>
                    </a>
                    <a 
                      routerLink="/account" 
                      [queryParams]="{tab: 'settings'}"
                      class="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                      (click)="closeUserMenu()"
                    >
                      <div class="flex items-center gap-2">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        Ustawienia
                      </div>
                    </a>
                    
                    <!-- Admin Panel Link - Only for admins -->
                    <a 
                      *ngIf="user.role === 'admin'"
                      routerLink="/admin" 
                      class="block px-4 py-2 text-sm hover:bg-muted transition-colors bg-green-50"
                      (click)="closeUserMenu()"
                    >
                      <div class="flex items-center gap-2 text-green-700 font-semibold">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                        Panel Admina
                      </div>
                    </a>
                    
                    <div class="border-t my-1"></div>
                    <button 
                      class="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors text-red-600"
                      (click)="logout()"
                    >
                      <div class="flex items-center gap-2">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        Wyloguj się
                      </div>
                    </button>
                  </div>
                </div>
                
                <ng-template #notLoggedIn>
                  <!-- Not Logged In Menu -->
                  <div class="py-1">
                    <a 
                      routerLink="/login" 
                      class="block px-4 py-3 text-sm hover:bg-muted transition-colors"
                      (click)="closeUserMenu()"
                    >
                      <div class="flex items-center gap-2">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                        </svg>
                        <span class="font-semibold">Zaloguj się</span>
                      </div>
                    </a>
                    <a 
                      routerLink="/register" 
                      class="block px-4 py-3 text-sm hover:bg-muted transition-colors"
                      (click)="closeUserMenu()"
                    >
                      <div class="flex items-center gap-2">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                        </svg>
                        <span class="font-semibold">Zarejestruj się</span>
                      </div>
                    </a>
                  </div>
                </ng-template>
              </div>
            </div>

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
  userMenuOpen = false;
  isDarkMode = false;
  cartPulse = false;
  
  itemCount$: Observable<number>;
  currentUser$: Observable<User | null>;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.itemCount$ = this.cartService.itemCount$;
    this.currentUser$ = this.authService.currentUser$;
    
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isClickInsideMenu = target.closest('.user-menu-container');
    
    if (!isClickInsideMenu && this.userMenuOpen) {
      this.userMenuOpen = false;
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
    this.router.navigate(['/loyalty']);
  }

  toggleCart(): void {
    this.cartOpen = !this.cartOpen;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleUserMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeUserMenu();
    this.notificationService.show('Zostałeś wylogowany', NotificationType.INFO);
    this.router.navigate(['/']);
  }
}
