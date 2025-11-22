import { Injectable } from '@angular/core';
import { Observable, of, catchError, map, switchMap, retry } from 'rxjs';
import { HttpClient } from '@angular/common/http';
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
  TicketStatusUpdate,
  LoyaltyProgram,
  LoyaltyReward,
  UserLoyaltyPoints,
  RedeemedReward,
  InsertLoyaltyProgram,
  InsertLoyaltyReward
} from '../models';
import { MockDataService } from './mock-data.service';
import { AuthService } from './auth.service';

type CategoryVisual = {
  image: string;
  description: string;
  defaultProductCount: number;
};

interface BackendCategoryResponse {
  id: number;
  name: string;
  slug?: string;
  parent?: number | null;
  product_count?: number;
  description?: string | null;
  image?: string | null;
}

interface BackendVariantAttributeResponse {
  attribute: string;
  value: string;
}

interface BackendProductImageResponse {
  id: number;
  image: string;
  alt_text?: string | null;
  is_main: boolean;
}

interface BackendProductVariantResponse {
  id: number;
  product: number;
  sku: string;
  name: string;
  price: string;
  stock: number;
  low_stock_threshold: number;
  available: boolean;
  attributes_details: BackendVariantAttributeResponse[];
  images: BackendProductImageResponse[];
}

interface BackendProductResponse {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  available: boolean;
  category: string | null;
  category_id?: number | null;
  category_name?: string | null;
  available_attributes?: { [key: string]: string[] };
  variants: BackendProductVariantResponse[];
  images: BackendProductImageResponse[];
  created_at?: string;
  updated_at?: string;
}

interface BackendOrderItemResponse {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  price: string;
}

interface BackendOrderResponse {
  id: number;
  user?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  total_price: string;
  status: string;
  notes?: string | null;
  created_at: string;
  items?: BackendOrderItemResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = 'http://localhost:8000/api/v1'; // Django backend URL
  private readonly apiBaseUrl = 'http://localhost:8000';
  private readonly defaultCategoryVisual: CategoryVisual = {
    image: 'assets/Wooden_garden_barrel_hero_26de98c6.png',
    description: 'Odkryj produkty dostępne w tej kategorii.',
    defaultProductCount: 0
  };

  private readonly categoryVisualFallbacks: Record<string, CategoryVisual> = {
    'balie-ogrodowe': {
      image: 'assets/Wooden_garden_barrel_hero_26de98c6.png',
      description: 'Najpopularniejsze modele bali ogrodowych i premium spa.',
      defaultProductCount: 6
    },
    'balie-drewniane': {
      image: 'assets/Oak_barrel_water_tub_da291514.png',
      description: 'Tradycyjne balie wykonane z dębu i modrzewia.',
      defaultProductCount: 4
    },
    'jacuzzi-ogrodowe': {
      image: 'assets/Oval_garden_bathtub_565f5ffe.png',
      description: 'Nowoczesne jacuzzi ogrodowe z hydromasażem.',
      defaultProductCount: 3
    },
    'akcesoria': {
      image: 'assets/Decorative_barrel_planter_7afc2d20.png',
      description: 'Schodki, podesty i dedykowane akcesoria.',
      defaultProductCount: 5
    },
    'pokrywy-termiczne': {
      image: 'assets/Oak_fence_timber_product_46de4b51.png',
      description: 'Pokrywy utrzymujące temperaturę i czystość wody.',
      defaultProductCount: 2
    },
    'drewniane-beczki': {
      image: 'assets/Wooden_garden_barrel_hero_26de98c6.png',
      description: 'Tradycyjne drewniane beczki do ogrodu',
      defaultProductCount: 3
    },
    'deski-tarasowe': {
      image: 'assets/Cedar_decking_planks_product_ffc1e2e4.png',
      description: 'Wysokiej jakości deski do budowy tarasów',
      defaultProductCount: 2
    },
    'elementy-konstrukcyjne': {
      image: 'assets/Treated_construction_beams_product_afa95ad7.png',
      description: 'Belki i elementy do konstrukcji ogrodowych',
      defaultProductCount: 2
    },
    'akcesoria-wodne': {
      image: 'assets/Rain_water_barrel_6764a662.png',
      description: 'Zbiorniki i akcesoria związane z wodą w ogrodzie',
      defaultProductCount: 2
    }
  };
  private readonly categorySlugToId = new Map<string, string>();
  private readonly categoryIdToSlug = new Map<string, string>();

  constructor(
    private mockDataService: MockDataService,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private resolveMediaUrl(path?: string | null): string {
    if (!path) {
      return this.defaultCategoryVisual.image;
    }
    if (path.startsWith('http')) {
      return path;
    }
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiBaseUrl}${normalized}`;
  }

  private resolveProductImage(
    images: BackendProductImageResponse[] = [],
    categorySlug?: string | null
  ): string {
    if (images.length > 0) {
      const main = images.find(img => img.is_main) ?? images[0];
      if (main?.image) {
        return this.resolveMediaUrl(main.image);
      }
    }
    const fallback = categorySlug ? this.categoryVisualFallbacks[categorySlug] : undefined;
    return fallback?.image ?? this.defaultCategoryVisual.image;
  }

  private selectPrimaryVariant(
    variants: BackendProductVariantResponse[] = []
  ): BackendProductVariantResponse | undefined {
    return variants.find(variant => variant.available && variant.stock > 0) ?? variants[0];
  }

  private cleanProductName(name: string): string {
    if (!name) {
      return '';
    }
    return name.replace(/\s+\d+$/, '').trim();
  }

  private estimateRating(stock: number): number {
    const rating = 4.2 + Math.min(stock, 30) * 0.02;
    return Math.min(5, Number(rating.toFixed(1)));
  }

  private resolveCategoryIdFromApi(product: BackendProductResponse): string {
    if (product.category_id !== undefined && product.category_id !== null) {
      return product.category_id.toString();
    }
    if (product.category) {
      return this.categorySlugToId.get(product.category) ?? product.category;
    }
    return product.id.toString();
  }

  private resolveCategorySlug(categoryId: string): string {
    return this.categoryIdToSlug.get(categoryId) ?? categoryId;
  }

  private mapProductFromApi(product: BackendProductResponse): Product {
    const primaryVariant = this.selectPrimaryVariant(product.variants);
    const image = this.resolveProductImage(product.images, product.category);
    const variantCount = product.variants.length || (primaryVariant ? 1 : 0);
    const variantPrices = product.variants
      .map(variant => parseFloat(variant.price))
      .filter(priceValue => !isNaN(priceValue));
    const minPriceValue = variantPrices.length
      ? Math.min(...variantPrices)
      : primaryVariant?.price
      ? parseFloat(primaryVariant.price)
      : 0;
    const maxPriceValue = variantPrices.length
      ? Math.max(...variantPrices)
      : minPriceValue;
    const formattedMinPrice = minPriceValue.toFixed(2);
    const formattedMaxPrice = maxPriceValue > minPriceValue ? maxPriceValue.toFixed(2) : null;
    const variantSummary = this.buildVariantSummary(primaryVariant, variantCount);
    const slug = product.slug ?? product.id?.toString() ?? this.slugify(product.name);

    return {
      id: slug,
      numericId: product.id,
      slug,
      name: this.cleanProductName(product.name),
      description: product.description,
      price: formattedMinPrice,
      oldPrice: formattedMaxPrice,
      rating: this.estimateRating(primaryVariant?.stock ?? 0),
      categoryId: this.resolveCategoryIdFromApi(product),
      image,
      stock: primaryVariant?.stock ?? 0,
      createdAt: product.created_at ? new Date(product.created_at) : new Date(),
      attributes: undefined,
      available_attributes: product.available_attributes,
      variants: product.variants,
      variantSummary,
      variantCount,
      minPrice: formattedMinPrice,
      maxPrice: formattedMaxPrice ?? undefined
    };
  }

  private buildVariantSummary(
    variant: BackendProductVariantResponse | undefined,
    variantCount: number
  ): string {
    const parts: string[] = [];
    if (variantCount > 0) {
      const label =
        variantCount === 1
          ? '1 konfiguracja'
          : `${variantCount} ${variantCount < 5 ? 'konfiguracje' : 'konfiguracji'}`;
      parts.push(label);
    }

    if (variant?.attributes_details?.length) {
      const highlights = variant.attributes_details
        .map(attr => attr.value)
        .filter(Boolean)
        .slice(0, 2);
      if (highlights.length) {
        parts.push(highlights.join(' • '));
      }
    }

    return parts.join(' · ') || 'Konfiguracje dostępne';
  }

  private mapCategoryFromApi(category: BackendCategoryResponse): Category {
    const slug = category.slug || this.slugify(category.name);
    const fallback = this.categoryVisualFallbacks[slug] || this.defaultCategoryVisual;
    const id = category.id?.toString() ?? slug;

    this.categorySlugToId.set(slug, id);
    this.categoryIdToSlug.set(id, slug);

    return {
      id,
      name: category.name,
      description: category.description ?? fallback.description,
      image: category.image ?? fallback.image,
      productCount: category.product_count || fallback.defaultProductCount,
      slug,
      parent: category.parent !== null && category.parent !== undefined
        ? category.parent.toString()
        : null
    };
  }

  private mapOrderFromApi(order: BackendOrderResponse): Order {
    return {
      id: order.id.toString(),
      customerName: `${order.first_name} ${order.last_name}`,
      email: order.email,
      phone: order.phone,
      address: order.address,
      city: order.city,
      postalCode: order.postal_code,
      totalPrice: order.total_price,
      status: order.status,
      notes: order.notes || null,
      createdAt: new Date(order.created_at)
    };
  }

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<BackendCategoryResponse[]>(`${this.apiUrl}/shop/categories/`).pipe(
      retry({ count: 3, delay: 1000 }),
      map(categories => {
        this.categorySlugToId.clear();
        this.categoryIdToSlug.clear();
        return categories.map(category => this.mapCategoryFromApi(category));
      }),
      catchError(error => {
        console.error('Nie udało się pobrać kategorii z backendu, używam danych mock.', error);
        return this.mockDataService.getCategories();
      })
    );
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<BackendCategoryResponse>(`${this.apiUrl}/shop/categories/${id}/`).pipe(
      map(category => this.mapCategoryFromApi(category)),
      catchError(error => {
        console.error(`Nie udało się pobrać kategorii ${id} z backendu, używam danych mock.`, error);
        return this.mockDataService.getCategory(id);
      })
    );
  }

  // Products
  getProducts(): Observable<Product[]> {
    return this.http.get<BackendProductResponse[]>(`${this.apiUrl}/shop/products/`).pipe(
      retry({ count: 30, delay: 2000 }),
      map(products => {
        const uniqueProducts = new Map<string, Product>();
        products.forEach(product => {
          const mapped = this.mapProductFromApi(product);
          const key = mapped.slug || mapped.id;
          if (!uniqueProducts.has(key)) {
            uniqueProducts.set(key, mapped);
          }
        });
        return Array.from(uniqueProducts.values());
      }),
      catchError(error => {
        console.error('Nie udało się pobrać produktów z backendu, używam danych mock.', error);
        return this.mockDataService.getProducts();
      })
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<BackendProductResponse>(`${this.apiUrl}/shop/products/${id}/`).pipe(
      map(product => this.mapProductFromApi(product)),
      catchError(error => {
        console.error(`Nie udało się pobrać produktu ${id} z backendu, używam danych mock.`, error);
        return this.mockDataService.getProduct(id);
      })
    );
  }

  getProductsByCategory(categoryId: string): Observable<Product[]> {
    const slug = this.resolveCategorySlug(categoryId);
    const slugParam = encodeURIComponent(slug);

    return this.http
      .get<BackendProductResponse[]>(`${this.apiUrl}/shop/products/?category__slug=${slugParam}`)
      .pipe(
        map(products => {
          const uniqueProducts = new Map<string, Product>();
          products.forEach(product => {
            const mapped = this.mapProductFromApi(product);
            const key = mapped.slug || mapped.id;
            if (!uniqueProducts.has(key)) {
              uniqueProducts.set(key, mapped);
            }
          });
          return Array.from(uniqueProducts.values());
        }),
        catchError(error => {
          console.error(
            `Nie udało się pobrać produktów dla kategorii ${categoryId} (${slug}), używam danych mock.`,
            error
          );
          return this.mockDataService.getProductsByCategory(categoryId);
        })
      );
  }

  searchProducts(query: string): Observable<Product[]> {
    return this.http
      .get<BackendProductResponse[]>(`${this.apiUrl}/shop/search/?q=${encodeURIComponent(query)}`)
      .pipe(
        map(products => {
          const uniqueProducts = new Map<string, Product>();
          products.forEach(product => {
            const mapped = this.mapProductFromApi(product);
            const key = mapped.slug || mapped.id;
            if (!uniqueProducts.has(key)) {
              uniqueProducts.set(key, mapped);
            }
          });
          return Array.from(uniqueProducts.values());
        }),
        catchError(error => {
          console.error('Nie udało się wyszukać produktów, używam danych mock.', error);
          // Fallback to filtering local mock products if backend fails
          return this.mockDataService.getProducts().pipe(
            map(products => 
              products.filter(product => 
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(query.toLowerCase()))
              )
            )
          );
        })
      );
  }

  getSimilarProducts(productId: string, limit: number = 4): Observable<Product[]> {
    return this.getProduct(productId).pipe(
      switchMap(product =>
        this.getProducts().pipe(
          map(products =>
            products
              .filter(p => p.id !== product.id && p.categoryId === product.categoryId)
              .slice(0, limit)
          )
        )
      ),
      catchError(error => {
        console.error(`Nie udało się pobrać podobnych produktów dla ${productId}, używam danych mock.`, error);
        return this.mockDataService.getSimilarProducts(productId, limit);
      })
    );
  }

  getFrequentlyBoughtTogether(productId: string, limit: number = 4): Observable<Product[]> {
    return this.getProduct(productId).pipe(
      switchMap(product =>
        this.getProducts().pipe(
          map(products =>
            products
              .filter(p => p.id !== product.id && p.categoryId !== product.categoryId)
              .slice(0, limit)
          )
        )
      ),
      catchError(error => {
        console.error(
          `Nie udało się pobrać rekomendacji do wspólnego zakupu dla ${productId}, używam danych mock.`,
          error
        );
        return this.mockDataService.getFrequentlyBoughtTogether(productId, limit);
      })
    );
  }

  createProduct(product: any): Observable<Product> {
    const payload: any = {
      name: product.name,
      description: product.description || '',
      category_write: product.categoryId,
      attributes_config: product.attributes || [],
      price: product.price,
      stock: product.stock || 0,
      image: product.image || ''
    };
    
    console.log('Creating product with payload:', payload);
    
    return this.http.post<BackendProductResponse>(`${this.apiUrl}/shop/products/`, payload).pipe(
      map(response => this.mapProductFromApi(response)),
      catchError(error => {
        console.error('Backend createProduct failed:', error);
        return this.mockDataService.createProduct(product);
      })
    );
  }

  updateProduct(id: string, product: any): Observable<Product> {
    const payload: any = {};
    if (product.name) payload.name = product.name;
    if (product.description !== undefined) payload.description = product.description;
    if (product.categoryId) payload.category_write = product.categoryId;
    if (product.attributes !== undefined) payload.attributes_config = product.attributes;
    if (product.price !== undefined) payload.price = product.price;
    if (product.stock !== undefined) payload.stock = product.stock;
    if (product.image !== undefined) payload.image = product.image;
    
    console.log('Updating product with payload:', payload);
    
    return this.http.patch<BackendProductResponse>(`${this.apiUrl}/shop/products/${id}/`, payload).pipe(
      map(response => this.mapProductFromApi(response)),
      catchError(error => {
        console.error('Backend updateProduct failed:', error);
        return this.mockDataService.updateProduct(id, product);
      })
    );
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/shop/products/${id}/`).pipe(
      catchError(error => {
        console.error('Backend deleteProduct failed, using mock', error);
        return this.mockDataService.deleteProduct(id);
      })
    );
  }

  // Orders
  getOrders(): Observable<Order[]> {
    return this.http.get<BackendOrderResponse[]>(`${this.apiUrl}/orders/`).pipe(
      map(orders => orders.map(order => this.mapOrderFromApi(order))),
      catchError(error => {
        console.error('Nie udało się pobrać zamówień z backendu, używam danych mock.', error);
        return this.mockDataService.getOrders();
      })
    );
  }

  getOrder(id: string): Observable<Order & { items: OrderItem[] }> {
    return this.http.get<BackendOrderResponse>(`${this.apiUrl}/orders/${id}/`).pipe(
      map(order => {
        const mappedOrder = this.mapOrderFromApi(order);
        const items = (order.items || []).map(item => ({
          id: item.id.toString(),
          orderId: order.id.toString(),
          productId: item.product.toString(),
          productName: item.product_name,
          quantity: item.quantity,
          price: item.price
        }));
        return { ...mappedOrder, items };
      }),
      catchError(error => {
        console.error(`Nie udało się pobrać zamówienia ${id} z backendu, używam danych mock.`, error);
        return this.mockDataService.getOrder(id);
      })
    );
  }

  createOrder(order: InsertOrder & { items: Omit<InsertOrderItem, 'orderId'>[] }): Observable<Order> {
    // Split customer name into first_name and last_name
    const nameParts = order.customerName.trim().split(/\s+/); // Split by whitespace
    const firstName = nameParts[0] || order.customerName;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName; // Use firstName as fallback
    
    const payload = {
      first_name: firstName,
      last_name: lastName,
      email: order.email,
      address: order.address,
      city: order.city,
      postal_code: order.postalCode,
      items: order.items.map(item => ({
        variant_id: item.variantId || item.productNumericId, // Backend expects variant_id
        quantity: item.quantity
      }))
    };

    console.log('📦 Sending order to backend:', payload);

    return this.http.post<BackendOrderResponse>(`${this.apiUrl}/orders/`, payload).pipe(
      map(response => this.mapOrderFromApi(response)),
      catchError(error => {
        console.error('❌ Backend order creation failed:');
        console.error('Status:', error.status);
        console.error('Error details:', error.error);
        console.error('Full error:', error);
        return this.mockDataService.createOrder(order);
      })
    );
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.patch<BackendOrderResponse>(`${this.apiUrl}/orders/${id}/`, { status }).pipe(
      map(response => this.mapOrderFromApi(response)),
      catchError(error => {
        console.error('Backend updateOrderStatus failed, using mock', error);
        return this.mockDataService.updateOrderStatus(id, status);
      })
    );
  }

  updateOrder(id: string, updates: Partial<Order>): Observable<Order> {
    // Note: Backend currently only supports updating status, tracking_number, paid via OrderAdminUpdateSerializer.
    // Other fields might be ignored or cause 400 if strict.
    // We'll try to send what we can.
    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    // Mapping other fields if backend supports them in future
    
    return this.http.patch<BackendOrderResponse>(`${this.apiUrl}/orders/${id}/`, payload).pipe(
      map(response => this.mapOrderFromApi(response)),
      catchError(error => {
        console.error('Backend updateOrder failed, using mock', error);
        return this.mockDataService.updateOrder(id, updates);
      })
    );
  }

  // Category management
  createCategory(category: InsertCategory): Observable<Category> {
    return this.http.post<BackendCategoryResponse>(`${this.apiUrl}/shop/categories/`, category).pipe(
      map(response => this.mapCategoryFromApi(response)),
      catchError(error => {
        console.error('Backend createCategory failed, using mock', error);
        return this.mockDataService.createCategory(category);
      })
    );
  }

  updateCategory(id: string, category: Partial<InsertCategory>): Observable<Category> {
    return this.http.patch<BackendCategoryResponse>(`${this.apiUrl}/shop/categories/${id}/`, category).pipe(
      map(response => this.mapCategoryFromApi(response)),
      catchError(error => {
        console.error('Backend updateCategory failed, using mock', error);
        return this.mockDataService.updateCategory(id, category);
      })
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/shop/categories/${id}/`).pipe(
      catchError(error => {
        console.error('Backend deleteCategory failed, using mock', error);
        return this.mockDataService.deleteCategory(id);
      })
    );
  }

  // Statistics
  getSalesStatistics(startDate?: Date, endDate?: Date): Observable<SalesStatistics> {
    // Client-side calculation fetching all orders (admin view)
    return this.getOrders().pipe(
      map(orders => {
        let filtered = orders;
        if (startDate) {
          filtered = filtered.filter(o => new Date(o.createdAt) >= startDate);
        }
        if (endDate) {
          filtered = filtered.filter(o => new Date(o.createdAt) <= endDate);
        }

        const totalRevenue = filtered.reduce((sum, o) => sum + parseFloat(o.totalPrice), 0);
        const totalOrders = filtered.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Simple aggregation for top products and categories based on OrderItems if available
        // Since listing orders might not return all items details depending on serializer, 
        // we might need to fetch details or rely on what's available.
        // Assuming getOrders returns items:
        // Actually OrderResponseSerializer has 'items'.

        // This is a simplified client-side stat generation.
        return {
          period: 'custom', // Added required field
          totalRevenue,
          totalOrders,
          averageOrderValue,
          totalProducts: 0, // would need product count
          topProducts: [],
          revenueByCategory: [],
          ordersByStatus: [] 
        };
      }),
      // If getOrders fails or we want full mock stats:
      catchError(() => this.mockDataService.getSalesStatistics(startDate, endDate))
    );
  }

  // Low stock alerts
  getLowStockAlerts(threshold: number = 10): Observable<LowStockAlert[]> {
    // Client-side filtering
    return this.getProducts().pipe(
      map(products => {
        return products
          .filter(p => p.stock <= threshold)
          .map(p => ({
            product: p,
            currentStock: p.stock,
            suggestedOrder: Math.max(20, threshold * 2 - p.stock),
            threshold: threshold // Added required field
          }))
          .sort((a, b) => a.currentStock - b.currentStock);
      }),
      catchError(() => this.mockDataService.getLowStockAlerts(threshold))
    );
  }

  // Support Tickets - Client API
  getMyTickets(): Observable<Ticket[]> {
    // Using backend if authenticated, else mock or empty
    return this.http.get<Ticket[]>(`${this.apiUrl}/support/tickets/`).pipe(
      catchError(error => {
        const userId = this.authService.currentUserValue?.id || '2';
        console.error('Backend getMyTickets failed, using mock', error);
        return this.mockDataService.getMyTickets(userId);
      })
    );
  }

  getTicket(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/support/tickets/${id}/`).pipe(
      catchError(error => {
        console.error('Backend getTicket failed, using mock', error);
        return this.mockDataService.getTicket(id);
      })
    );
  }

  createTicket(ticket: InsertTicket): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/support/tickets/`, ticket).pipe(
      catchError(error => {
        const userId = this.authService.currentUserValue?.id || '2';
        console.error('Backend createTicket failed, using mock', error);
        return this.mockDataService.createTicket(ticket, userId);
      })
    );
  }

  replyToTicket(id: string, reply: TicketReply): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/support/tickets/${id}/reply/`, reply).pipe(
      catchError(error => {
         const userId = this.authService.currentUserValue?.id || '2';
         console.error('Backend replyToTicket failed, using mock', error);
         return this.mockDataService.replyToTicket(id, reply, userId);
      })
    );
  }

  // Support Tickets - Admin API
  getAllTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/support/admin/tickets/`).pipe(
      catchError(error => {
        console.error('Backend getAllTickets failed, using mock', error);
        return this.mockDataService.getAllTickets();
      })
    );
  }

  getAdminTicket(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/support/admin/tickets/${id}/`).pipe(
      catchError(error => {
        console.error('Backend getAdminTicket failed, using mock', error);
        return this.mockDataService.getTicket(id);
      })
    );
  }

  adminReplyToTicket(id: string, reply: TicketReply): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/support/admin/tickets/${id}/reply/`, reply).pipe(
      catchError(error => {
        console.error('Backend adminReplyToTicket failed, using mock', error);
        return this.mockDataService.adminReplyToTicket(id, reply);
      })
    );
  }

  updateTicketStatus(id: string, status: TicketStatusUpdate): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/support/admin/tickets/${id}/`, status).pipe(
      catchError(error => {
        console.error('Backend updateTicketStatus failed, using mock', error);
        return this.mockDataService.updateTicketStatus(id, status.status);
      })
    );
  }

  // PDF Generation (mock for now - shows alert)
  generateInvoicePdf(orderId: string): Observable<Blob> {
    // Mock: Create a simple text blob as placeholder
    const pdfContent = `Faktura #${orderId}\n\nTo jest mockowa faktura.\nBackend nie jest jeszcze uruchomiony.`;
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return of(blob);
    
    // Real API call (uncomment when backend is ready):
    // return this.http.get(`${this.apiUrl}/orders/${orderId}/invoice/`, {
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

  // Loyalty Program - Admin API
  getLoyaltyProgram(): Observable<LoyaltyProgram | null> {
    return this.mockDataService.getLoyaltyProgram();
    // Real API call (uncomment when backend is ready):
    // return this.http.get<LoyaltyProgram>(`${this.apiUrl}/loyalty/program/`);
  }

  createOrUpdateLoyaltyProgram(program: InsertLoyaltyProgram): Observable<LoyaltyProgram> {
    return this.mockDataService.createOrUpdateLoyaltyProgram(program);
    // Real API call (uncomment when backend is ready):
    // return this.http.post<LoyaltyProgram>(`${this.apiUrl}/loyalty/program/`, program);
  }

  // Loyalty Rewards - Admin API
  getLoyaltyRewards(): Observable<LoyaltyReward[]> {
    return this.mockDataService.getLoyaltyRewards();
    // Real API call (uncomment when backend is ready):
    // return this.http.get<LoyaltyReward[]>(`${this.apiUrl}/loyalty/rewards/`);
  }

  createLoyaltyReward(reward: InsertLoyaltyReward): Observable<LoyaltyReward> {
    return this.mockDataService.createLoyaltyReward(reward);
    // Real API call (uncomment when backend is ready):
    // return this.http.post<LoyaltyReward>(`${this.apiUrl}/loyalty/rewards/`, reward);
  }

  updateLoyaltyReward(id: string, reward: Partial<InsertLoyaltyReward>): Observable<LoyaltyReward> {
    return this.mockDataService.updateLoyaltyReward(id, reward);
    // Real API call (uncomment when backend is ready):
    // return this.http.patch<LoyaltyReward>(`${this.apiUrl}/loyalty/rewards/${id}/`, reward);
  }

  deleteLoyaltyReward(id: string): Observable<void> {
    return this.mockDataService.deleteLoyaltyReward(id);
    // Real API call (uncomment when backend is ready):
    // return this.http.delete<void>(`${this.apiUrl}/loyalty/rewards/${id}/`);
  }

  // Loyalty - User API
  getUserLoyaltyPoints(): Observable<UserLoyaltyPoints> {
    const userId = this.authService.currentUserValue?.id || '2';
    return this.mockDataService.getUserLoyaltyPoints(userId);
    // Real API call (uncomment when backend is ready):
    // return this.http.get<UserLoyaltyPoints>(`${this.apiUrl}/loyalty/my-points/`);
  }

  redeemReward(rewardId: string): Observable<RedeemedReward> {
    const userId = this.authService.currentUserValue?.id || '2';
    return this.mockDataService.redeemReward(userId, rewardId);
    // Real API call (uncomment when backend is ready):
    // return this.http.post<RedeemedReward>(`${this.apiUrl}/loyalty/rewards/${rewardId}/redeem/`, {});
  }

  getMyRedeemedRewards(): Observable<RedeemedReward[]> {
    const userId = this.authService.currentUserValue?.id || '2';
    return this.mockDataService.getMyRedeemedRewards(userId);
    // Real API call (uncomment when backend is ready):
    // return this.http.get<RedeemedReward[]>(`${this.apiUrl}/loyalty/my-rewards/`);
  }
}
