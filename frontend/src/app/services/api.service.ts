import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { 
  Product, 
  Category, 
  Order, 
  OrderItem, 
  InsertProduct, 
  InsertOrder, 
  InsertOrderItem 
} from '../models';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private mockDataService: MockDataService) {}

  // Categories
  getCategories(): Observable<Category[]> {
    return this.mockDataService.getCategories();
  }

  getCategory(id: string): Observable<Category> {
    return this.mockDataService.getCategory(id);
  }

  // Products
  getProducts(): Observable<Product[]> {
    return this.mockDataService.getProducts();
  }

  getProduct(id: string): Observable<Product> {
    return this.mockDataService.getProduct(id);
  }

  getProductsByCategory(categoryId: string): Observable<Product[]> {
    return this.mockDataService.getProductsByCategory(categoryId);
  }

  createProduct(product: InsertProduct): Observable<Product> {
    return this.mockDataService.createProduct(product);
  }

  updateProduct(id: string, product: Partial<InsertProduct>): Observable<Product> {
    return this.mockDataService.updateProduct(id, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.mockDataService.deleteProduct(id);
  }

  // Orders
  getOrders(): Observable<Order[]> {
    return this.mockDataService.getOrders();
  }

  getOrder(id: string): Observable<Order & { items: OrderItem[] }> {
    return this.mockDataService.getOrder(id);
  }

  createOrder(order: InsertOrder & { items: Omit<InsertOrderItem, 'orderId'>[] }): Observable<Order> {
    return this.mockDataService.createOrder(order);
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.mockDataService.updateOrderStatus(id, status);
  }
}

