import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem, Product } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'cart';
  private cartSubject = new BehaviorSubject<CartItem[]>(this.loadCartFromStorage());
  private itemAddedSubject = new Subject<Product>();

  constructor() {
    // Subscribe to cart changes and save to localStorage
    this.cartSubject.subscribe(items => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    });
  }

  get itemAdded$(): Observable<Product> {
    return this.itemAddedSubject.asObservable();
  }

  get cart$(): Observable<CartItem[]> {
    return this.cartSubject.asObservable();
  }

  get itemCount$(): Observable<number> {
    return this.cart$.pipe(
      map(items => items.reduce((total, item) => total + item.quantity, 0))
    );
  }

  get totalPrice$(): Observable<number> {
    return this.cart$.pipe(
      map(items => items.reduce((total, item) => 
        total + (parseFloat(item.product.price) * item.quantity), 0
      ))
    );
  }

  addItem(product: Product, quantity: number = 1): void {
    const currentItems = this.cartSubject.value;
    const existingItem = currentItems.find(item => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
      this.cartSubject.next([...currentItems]);
    } else {
      this.cartSubject.next([...currentItems, { product, quantity }]);
    }
    
    // Emit event that item was added
    this.itemAddedSubject.next(product);
  }

  removeItem(productId: string): void {
    const currentItems = this.cartSubject.value;
    const filteredItems = currentItems.filter(item => item.product.id !== productId);
    this.cartSubject.next(filteredItems);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const currentItems = this.cartSubject.value;
    const item = currentItems.find(item => item.product.id === productId);
    
    if (item) {
      item.quantity = quantity;
      this.cartSubject.next([...currentItems]);
    }
  }

  clearCart(): void {
    this.cartSubject.next([]);
  }

  getItems(): CartItem[] {
    return this.cartSubject.value;
  }

  getTotalPrice(): number {
    return this.cartSubject.value.reduce((total, item) => 
      total + (parseFloat(item.product.price) * item.quantity), 0
    );
  }

  getItemCount(): number {
    return this.cartSubject.value.reduce((total, item) => total + item.quantity, 0);
  }

  private loadCartFromStorage(): CartItem[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to parse cart from localStorage:', error);
      return [];
    }
  }
}

