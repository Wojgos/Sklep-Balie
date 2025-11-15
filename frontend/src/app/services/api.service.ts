import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { 
  Product, 
  Category, 
  Order, 
  OrderItem, 
  InsertProduct, 
  InsertOrder, 
  InsertOrderItem,
  InsertCategory,
  SalesStatistics,
  LowStockAlert,
  Ticket,
  InsertTicket,
  TicketReply,
  TicketStatusUpdate
} from '../models';
import { MockDataService } from './mock-data.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = 'http://localhost:8000/api/v1'; // Django backend URL

  constructor(
    private mockDataService: MockDataService,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

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

  updateOrder(id: string, updates: Partial<Order>): Observable<Order> {
    return this.mockDataService.updateOrder(id, updates);
  }

  // Category management
  createCategory(category: InsertCategory): Observable<Category> {
    return this.mockDataService.createCategory(category);
  }

  updateCategory(id: string, category: Partial<InsertCategory>): Observable<Category> {
    return this.mockDataService.updateCategory(id, category);
  }

  deleteCategory(id: string): Observable<void> {
    return this.mockDataService.deleteCategory(id);
  }

  // Statistics
  getSalesStatistics(startDate?: Date, endDate?: Date): Observable<SalesStatistics> {
    return this.mockDataService.getSalesStatistics(startDate, endDate);
  }

  // Low stock alerts
  getLowStockAlerts(threshold?: number): Observable<LowStockAlert[]> {
    return this.mockDataService.getLowStockAlerts(threshold);
  }

  // Support Tickets - Client API (using mocks for now)
  getMyTickets(): Observable<Ticket[]> {
    const userId = this.authService.currentUserValue?.id || '2';
    return this.mockDataService.getMyTickets(userId);
    // Real API call (uncomment when backend is ready):
    // return this.http.get<Ticket[]>(`${this.apiUrl}/support/tickets/`, {
    //   headers: this.getAuthHeaders()
    // });
  }

  getTicket(id: string): Observable<Ticket> {
    return this.mockDataService.getTicket(id);
    // Real API call (uncomment when backend is ready):
    // return this.http.get<Ticket>(`${this.apiUrl}/support/tickets/${id}/`, {
    //   headers: this.getAuthHeaders()
    // });
  }

  createTicket(ticket: InsertTicket): Observable<Ticket> {
    const userId = this.authService.currentUserValue?.id || '2';
    return this.mockDataService.createTicket(ticket, userId);
    // Real API call (uncomment when backend is ready):
    // return this.http.post<Ticket>(`${this.apiUrl}/support/tickets/`, ticket, {
    //   headers: this.getAuthHeaders()
    // });
  }

  replyToTicket(id: string, reply: TicketReply): Observable<void> {
    const userId = this.authService.currentUserValue?.id || '2';
    return this.mockDataService.replyToTicket(id, reply, userId);
    // Real API call (uncomment when backend is ready):
    // return this.http.post<void>(`${this.apiUrl}/support/tickets/${id}/reply/`, reply, {
    //   headers: this.getAuthHeaders()
    // });
  }

  // Support Tickets - Admin API (using mocks for now)
  getAllTickets(): Observable<Ticket[]> {
    return this.mockDataService.getAllTickets();
    // Real API call (uncomment when backend is ready):
    // return this.http.get<Ticket[]>(`${this.apiUrl}/support/admin/tickets/`, {
    //   headers: this.getAuthHeaders()
    // });
  }

  getAdminTicket(id: string): Observable<Ticket> {
    return this.mockDataService.getTicket(id);
    // Real API call (uncomment when backend is ready):
    // return this.http.get<Ticket>(`${this.apiUrl}/support/admin/tickets/${id}/`, {
    //   headers: this.getAuthHeaders()
    // });
  }

  adminReplyToTicket(id: string, reply: TicketReply): Observable<void> {
    return this.mockDataService.adminReplyToTicket(id, reply);
    // Real API call (uncomment when backend is ready):
    // return this.http.post<void>(`${this.apiUrl}/support/admin/tickets/${id}/reply/`, reply, {
    //   headers: this.getAuthHeaders()
    // });
  }

  updateTicketStatus(id: string, status: TicketStatusUpdate): Observable<Ticket> {
    return this.mockDataService.updateTicketStatus(id, status.status);
    // Real API call (uncomment when backend is ready):
    // return this.http.patch<Ticket>(`${this.apiUrl}/support/admin/tickets/${id}/`, status, {
    //   headers: this.getAuthHeaders()
    // });
  }

  // PDF Generation (mock for now - shows alert)
  generateInvoicePdf(orderId: string): Observable<Blob> {
    // Mock: Create a simple text blob as placeholder
    const pdfContent = `Faktura #${orderId}\n\nTo jest mockowa faktura.\nBackend nie jest jeszcze uruchomiony.`;
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return of(blob);
    
    // Real API call (uncomment when backend is ready):
    // return this.http.get(`${this.apiUrl}/orders/${orderId}/invoice/`, {
    //   headers: this.getAuthHeaders(),
    //   responseType: 'blob'
    // });
  }

  downloadInvoice(orderId: string, filename?: string): void {
    // For now, show alert that this is a mock
    alert(`Mock: Pobieranie faktury dla zamówienia #${orderId}\n\nBackend nie jest jeszcze uruchomiony, więc to jest placeholder.\n\nGdy backend będzie gotowy, tutaj pobierze się prawdziwa faktura PDF.`);
    
    // Uncomment when backend is ready:
    // this.generateInvoicePdf(orderId).subscribe({
    //   next: (blob) => {
    //     const url = window.URL.createObjectURL(blob);
    //     const link = document.createElement('a');
    //     link.href = url;
    //     link.download = filename || `faktura_${orderId}.pdf`;
    //     link.click();
    //     window.URL.revokeObjectURL(url);
    //   },
    //   error: (error) => {
    //     console.error('Error downloading invoice:', error);
    //   }
    // });
  }
}

