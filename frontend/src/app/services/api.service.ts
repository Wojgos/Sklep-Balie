import { Injectable } from '@angular/core';
import { Observable, of, catchError, map, switchMap, retry, forkJoin } from 'rxjs';
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
  LowStockVariantAlert,
  LowStockStatistics,
  GroupedLowStockAlert,
  ProductSkuVariant,
  Ticket,
  InsertTicket,
  TicketReply,
  TicketStatusUpdate,
  LoyaltyProgram,
  LoyaltyReward,
  UserLoyaltyPoints,
  RedeemedReward,
  InsertLoyaltyProgram,
  InsertLoyaltyReward,
  MonthlyStatistics,
  QuarterlyStatistics,
  YearlyStatistics,
  PeriodComparison,
  TopProductsReport,
  CategoryPerformanceReport,
  DashboardOverview
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
  attributes_config?: any[];
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
  customer_username?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  address: string;
  city: string;
  postal_code: string;
  total_price: string;
  status: string;
  paid: boolean;
  tracking_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
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
      variantId: primaryVariant?.id, // ID wariantu potrzebne do zamówienia
      createdAt: product.created_at ? new Date(product.created_at) : new Date(),
      attributes: (product as any).attributes_config || undefined,
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
      description: category.description !== undefined && category.description !== null 
        ? category.description 
        : fallback.description,
      image: category.image !== undefined && category.image !== null && category.image !== ''
        ? category.image 
        : fallback.image,
      productCount: category.product_count || fallback.defaultProductCount,
      slug,
      parent: category.parent !== null && category.parent !== undefined
        ? category.parent.toString()
        : null
    };
  }

  private mapOrderFromApi(order: BackendOrderResponse): Order {
    const mappedOrder: Order = {
      id: order.id ? order.id.toString() : '',
      customerName: `${order.first_name} ${order.last_name}`,
      email: order.email,
      phone: order.phone || '',
      address: order.address,
      city: order.city,
      postalCode: order.postal_code,
      totalPrice: order.total_price,
      status: order.status,
      paid: order.paid ?? false,
      trackingNumber: order.tracking_number || null,
      notes: order.notes || null,
      createdAt: new Date(order.created_at),
      updatedAt: order.updated_at ? new Date(order.updated_at) : undefined
    };

    // Map items if they exist in the response (from list endpoint)
    if (order.items && order.items.length > 0) {
      mappedOrder.items = order.items.map(item => ({
        id: item.id.toString(),
        orderId: order.id.toString(),
        productId: item.product.toString(),
        productName: item.product_name,
        quantity: item.quantity,
        price: item.price
      }));
    }

    return mappedOrder;
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
          // Fallback na mocka
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
    // Check if we have a file to upload
    if (product.imageFile && product.imageFile instanceof File) {
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('description', product.description || '');
      formData.append('category_write', product.categoryId);
      formData.append('attributes_config', JSON.stringify(product.attributes || []));
      formData.append('price', product.price);
      formData.append('stock', product.stock || 0);
      formData.append('image', product.imageFile);
      
      console.log('Creating product with FormData (file upload)');
      
      return this.http.post<BackendProductResponse>(`${this.apiUrl}/shop/products/`, formData).pipe(
        map(response => this.mapProductFromApi(response)),
        catchError(error => {
          console.error('Backend createProduct failed:', error);
          return this.mockDataService.createProduct(product);
        })
      );
    } else {
      // Fallback to JSON payload if no file
      const payload: any = {
        name: product.name,
        description: product.description || '',
        category_write: product.categoryId,
        attributes_config: product.attributes || [],
        price: product.price,
        stock: product.stock || 0,
        image: product.image || ''
      };
      
      console.log('Creating product with JSON payload:', payload);
      
      return this.http.post<BackendProductResponse>(`${this.apiUrl}/shop/products/`, payload).pipe(
        map(response => this.mapProductFromApi(response)),
        catchError(error => {
          console.error('Backend createProduct failed:', error);
          return this.mockDataService.createProduct(product);
        })
      );
    }
  }

  updateProduct(id: string, product: any): Observable<Product> {
    // Check if we have a file to upload
    if (product.imageFile && product.imageFile instanceof File) {
      const formData = new FormData();
      if (product.name) formData.append('name', product.name);
      if (product.description !== undefined) formData.append('description', product.description);
      if (product.categoryId) formData.append('category_write', product.categoryId);
      if (product.attributes !== undefined) formData.append('attributes_config', JSON.stringify(product.attributes));
      if (product.price !== undefined) formData.append('price', product.price);
      if (product.stock !== undefined) formData.append('stock', product.stock.toString());
      formData.append('image', product.imageFile);
      
      console.log('Updating product with FormData (file upload)');
      
      return this.http.patch<BackendProductResponse>(`${this.apiUrl}/shop/products/${id}/`, formData).pipe(
        map(response => this.mapProductFromApi(response)),
        catchError(error => {
          console.error('Backend updateProduct failed:', error);
          return this.mockDataService.updateProduct(id, product);
        })
      );
    } else {
      // Fallback to JSON payload if no file
      const payload: any = {};
      if (product.name) payload.name = product.name;
      if (product.description !== undefined) payload.description = product.description;
      if (product.categoryId) payload.category_write = product.categoryId;
      if (product.attributes !== undefined) payload.attributes_config = product.attributes;
      if (product.price !== undefined) payload.price = product.price;
      if (product.stock !== undefined) payload.stock = product.stock;
      if (product.image !== undefined) payload.image = product.image;
      
      console.log('Updating product with JSON payload:', payload);
      
      return this.http.patch<BackendProductResponse>(`${this.apiUrl}/shop/products/${id}/`, payload).pipe(
        map(response => this.mapProductFromApi(response)),
        catchError(error => {
          console.error('Backend updateProduct failed:', error);
          return this.mockDataService.updateProduct(id, product);
        })
      );
    }
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
        console.error('Błąd pobierania zamówień:', error);
        // Return empty array instead of mock data
        return of([]);
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
        console.error(`Błąd pobierania zamówienia ${id}:`, error);
        throw error;
      })
    );
  }

  createOrder(order: InsertOrder & { items: Omit<InsertOrderItem, 'orderId'>[] }): Observable<Order> {
    // Split customer name into first_name and last_name
    const nameParts = order.customerName.trim().split(/\s+/); // Split by whitespace
    const firstName = nameParts[0] || order.customerName;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName; // Use firstName as fallback
    
    const payload: any = {
      first_name: firstName,
      last_name: lastName,
      email: order.email,
      phone: order.phone || '',
      address: order.address,
      city: order.city,
      postal_code: order.postalCode,
      notes: order.notes || '',
      items: order.items.map(item => ({
        variant_id: item.variantId || item.productNumericId, // Backend expects variant_id
        quantity: item.quantity
      }))
    };

    if (order.couponCode?.trim()) {
      payload.coupon_code = order.couponCode.trim();
    }

    console.log('📦 Sending order to backend:', payload);

    return this.http.post<BackendOrderResponse>(`${this.apiUrl}/orders/`, payload).pipe(
      map(response => this.mapOrderFromApi(response)),
      catchError(error => {
        console.error('❌ Błąd tworzenia zamówienia:');
        console.error('Status:', error.status);
        console.error('Szczegóły błędu:', error.error);
        
        // Provide helpful error message
        if (error.error?.error) {
          console.error('💡 Komunikat:', error.error.error);
        }
        
        throw error;
      })
    );
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.patch<BackendOrderResponse>(`${this.apiUrl}/orders/${id}/`, { status }).pipe(
      map(response => this.mapOrderFromApi(response)),
      catchError(error => {
        console.error('Błąd aktualizacji statusu zamówienia:', error);
        throw error;
      })
    );
  }

  updateOrder(id: string, updates: Partial<Order>): Observable<Order> {
    const payload: any = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.paid !== undefined) payload.paid = updates.paid;
    if (updates.trackingNumber !== undefined) payload.tracking_number = updates.trackingNumber;
    
    // Map frontend Order fields to backend fields
    if (updates.customerName) {
      const [first_name, ...lastNameParts] = updates.customerName.split(' ');
      payload.first_name = first_name;
      payload.last_name = lastNameParts.join(' ');
    }
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.postalCode !== undefined) payload.postal_code = updates.postalCode;
    
    console.log('📝 Aktualizacja zamówienia ID:', id, 'Payload:', payload);
    
    return this.http.patch<BackendOrderResponse>(`${this.apiUrl}/orders/${id}/`, payload).pipe(
      map(response => {
        console.log('✅ Odpowiedź z backendu:', response);
        return this.mapOrderFromApi(response);
      }),
      catchError(error => {
        console.error('Błąd aktualizacji zamówienia:', error);
        throw error;
      })
    );
  }

  // Category management
  createCategory(category: any): Observable<Category> {
    // Check if we have a file to upload
    if (category.imageFile && category.imageFile instanceof File) {
      const formData = new FormData();
      formData.append('name', category.name);
      if (category.description) formData.append('description', category.description);
      formData.append('image', category.imageFile);
      
      console.log('Creating category with FormData (file upload)');
      
      return this.http.post<BackendCategoryResponse>(`${this.apiUrl}/shop/categories/`, formData).pipe(
        map(response => this.mapCategoryFromApi(response)),
        catchError(error => {
          console.error('Backend createCategory failed, using mock', error);
          return this.mockDataService.createCategory(category);
        })
      );
    } else {
      // Fallback to JSON payload if no file
      console.log('Creating category with JSON payload');
      
      return this.http.post<BackendCategoryResponse>(`${this.apiUrl}/shop/categories/`, category).pipe(
        map(response => this.mapCategoryFromApi(response)),
        catchError(error => {
          console.error('Backend createCategory failed, using mock', error);
          return this.mockDataService.createCategory(category);
        })
      );
    }
  }

  updateCategory(id: string, category: any): Observable<Category> {
    // Check if we have a file to upload
    if (category.imageFile && category.imageFile instanceof File) {
      const formData = new FormData();
      if (category.name) formData.append('name', category.name);
      if (category.description !== undefined) formData.append('description', category.description);
      formData.append('image', category.imageFile);
      
      console.log('Updating category with FormData (file upload)');
      
      return this.http.patch<BackendCategoryResponse>(`${this.apiUrl}/shop/categories/${id}/`, formData).pipe(
        map(response => this.mapCategoryFromApi(response)),
        catchError(error => {
          console.error('Backend updateCategory failed, using mock', error);
          return this.mockDataService.updateCategory(id, category);
        })
      );
    } else {
      // Fallback to JSON payload if no file
      console.log('Updating category with JSON payload');
      
      return this.http.patch<BackendCategoryResponse>(`${this.apiUrl}/shop/categories/${id}/`, category).pipe(
        map(response => this.mapCategoryFromApi(response)),
        catchError(error => {
          console.error('Backend updateCategory failed, using mock', error);
          return this.mockDataService.updateCategory(id, category);
        })
      );
    }
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/shop/categories/${id}/`).pipe(
      catchError(error => {
        console.error('Błąd usuwania kategorii:', error);
        throw error;
      })
    );
  }

  // Statistics
  getSalesStatistics(startDate?: Date, endDate?: Date): Observable<SalesStatistics> {
    // Format dates to YYYY-MM-DD format for backend
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Set default dates if not provided (last 30 days)
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startDateStr = formatDate(start);
    const endDateStr = formatDate(end);

    // Call backend endpoint with query parameters
    const url = `${this.apiUrl}/reports/sales/?start_date=${startDateStr}&end_date=${endDateStr}`;
    
    return forkJoin({
      salesStats: this.http.get<{
        period: { start_date: string; end_date: string };
        summary: { total_revenue: number; total_orders: number };
        by_day: Array<{ day: string; daily_revenue: number; orders_count: number }>;
      }>(url),
      orders: this.getOrders(),
      products: this.getProducts(),
      categories: this.getCategories()
    }).pipe(
      map(({ salesStats, orders, products, categories }) => {
        const totalRevenue = salesStats.summary.total_revenue;
        const totalOrders = salesStats.summary.total_orders;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Format period for display
        const periodText = `${salesStats.period.start_date} - ${salesStats.period.end_date}`;

        // Filter orders by date range for detailed stats
        const filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= start && orderDate <= end && order.paid;
        });

        // Calculate top products (client-side for now)
        const productStats = new Map<string, { product: Product; quantity: number; revenue: number }>();
        filteredOrders.forEach(order => {
          if (order.items) {
            order.items.forEach((item: OrderItem) => {
              const existing = productStats.get(item.productId);
              const itemRevenue = parseFloat(item.price) * item.quantity;
              if (existing) {
                existing.quantity += item.quantity;
                existing.revenue += itemRevenue;
              } else {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                  productStats.set(item.productId, {
                    product,
                    quantity: item.quantity,
                    revenue: itemRevenue
                  });
                }
              }
            });
          }
        });
        const topProducts = Array.from(productStats.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        // Calculate revenue by category (client-side for now)
        const categoryStats = new Map<string, { category: Category; revenue: number }>();
        filteredOrders.forEach(order => {
          if (order.items) {
            order.items.forEach((item: OrderItem) => {
              const product = products.find(p => p.id === item.productId);
              if (product) {
                const existing = categoryStats.get(product.categoryId);
                const itemRevenue = parseFloat(item.price) * item.quantity;
                if (existing) {
                  existing.revenue += itemRevenue;
                } else {
                  const category = categories.find(c => c.id === product.categoryId);
                  if (category) {
                    categoryStats.set(product.categoryId, {
                      category,
                      revenue: itemRevenue
                    });
                  }
                }
              }
            });
          }
        });
        const revenueByCategory = Array.from(categoryStats.values())
          .sort((a, b) => b.revenue - a.revenue);

        // Calculate orders by status (client-side for now)
        const statusCounts = new Map<string, number>();
        filteredOrders.forEach(order => {
          statusCounts.set(order.status, (statusCounts.get(order.status) || 0) + 1);
        });
        const ordersByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
          status,
          count
        }));

        return {
          period: periodText,
          totalRevenue,
          totalOrders,
          averageOrderValue,
          totalProducts: products.length,
          topProducts,
          revenueByCategory,
          ordersByStatus
        } as SalesStatistics;
      }),
      catchError((error) => {
        console.error('Błąd pobierania statystyk sprzedażowych:', error);
        // Return empty statistics on error
        return of({
          period: 'brak danych',
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          totalProducts: 0,
          topProducts: [],
          revenueByCategory: [],
          ordersByStatus: []
        });
      })
    );
  }

  downloadStatisticsPDF(startDate?: Date, endDate?: Date): void {
    // Format dates to YYYY-MM-DD format for backend
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Set default dates if not provided (last 30 days)
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startDateStr = formatDate(start);
    const endDateStr = formatDate(end);

    // Build URL for PDF endpoint
    const url = `${this.apiUrl}/reports/sales/pdf/?start_date=${startDateStr}&end_date=${endDateStr}`;

    // Use blob response type to download PDF
    this.http.get(url, { 
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        // Create blob from response
        const blob = new Blob([response.body as Blob], { type: 'application/pdf' });
        
        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `raport_statystyk_${startDateStr}_${endDateStr}.pdf`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (error) => {
        console.error('Błąd pobierania raportu PDF:', error);
        alert('Wystąpił błąd podczas pobierania raportu PDF.');
      }
    });
  }

  // Advanced Analytics Methods
  
  // Get monthly statistics
  getMonthlyStatistics(startDate?: Date, endDate?: Date): Observable<MonthlyStatistics> {
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000); // 12 months

    const startDateStr = formatDate(start);
    const endDateStr = formatDate(end);

    const url = `${this.apiUrl}/reports/monthly/?start_date=${startDateStr}&end_date=${endDateStr}`;
    
    return this.http.get<MonthlyStatistics>(url).pipe(
      catchError((error) => {
        console.error('Błąd pobierania statystyk miesięcznych:', error);
        return of({
          period: { start_date: startDateStr, end_date: endDateStr },
          summary: { total_revenue: 0, total_orders: 0, avg_monthly_revenue: 0, months_count: 0 },
          best_month: null,
          worst_month: null,
          monthly_data: []
        });
      })
    );
  }

  // Get quarterly statistics
  getQuarterlyStatistics(year?: number): Observable<QuarterlyStatistics> {
    const selectedYear = year || new Date().getFullYear();
    const url = `${this.apiUrl}/reports/quarterly/?year=${selectedYear}`;
    
    return this.http.get<QuarterlyStatistics>(url).pipe(
      catchError((error) => {
        console.error('Błąd pobierania statystyk kwartalnych:', error);
        return of({
          year: selectedYear,
          quarterly_data: []
        });
      })
    );
  }

  // Get yearly statistics (last 5 years)
  getYearlyStatistics(): Observable<YearlyStatistics> {
    const url = `${this.apiUrl}/reports/yearly/`;
    
    return this.http.get<YearlyStatistics>(url).pipe(
      catchError((error) => {
        console.error('Błąd pobierania statystyk rocznych:', error);
        return of({
          yearly_data: []
        });
      })
    );
  }

  // Compare two periods
  comparePeriods(
    period1Start: Date, 
    period1End: Date, 
    period2Start: Date, 
    period2End: Date
  ): Observable<PeriodComparison> {
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const url = `${this.apiUrl}/reports/comparison/?` +
      `period1_start=${formatDate(period1Start)}&` +
      `period1_end=${formatDate(period1End)}&` +
      `period2_start=${formatDate(period2Start)}&` +
      `period2_end=${formatDate(period2End)}`;
    
    return this.http.get<PeriodComparison>(url).pipe(
      catchError((error) => {
        console.error('Błąd porównywania okresów:', error);
        throw error;
      })
    );
  }

  // Get top products for a period
  getTopProducts(startDate?: Date, endDate?: Date, limit: number = 10): Observable<TopProductsReport> {
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const url = `${this.apiUrl}/reports/top-products/?` +
      `start_date=${formatDate(start)}&` +
      `end_date=${formatDate(end)}&` +
      `limit=${limit}`;
    
    return this.http.get<TopProductsReport>(url).pipe(
      catchError((error) => {
        console.error('Błąd pobierania top produktów:', error);
        return of({
          period: {
            start_date: formatDate(start),
            end_date: formatDate(end)
          },
          top_products: []
        });
      })
    );
  }

  // Get category performance
  getCategoryPerformance(startDate?: Date, endDate?: Date): Observable<CategoryPerformanceReport> {
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const url = `${this.apiUrl}/reports/categories/?` +
      `start_date=${formatDate(start)}&` +
      `end_date=${formatDate(end)}`;
    
    return this.http.get<CategoryPerformanceReport>(url).pipe(
      catchError((error) => {
        console.error('Błąd pobierania wydajności kategorii:', error);
        return of({
          period: {
            start_date: formatDate(start),
            end_date: formatDate(end)
          },
          total_revenue: 0,
          categories: []
        });
      })
    );
  }

  // Get dashboard overview
  getDashboardOverview(): Observable<DashboardOverview> {
    const url = `${this.apiUrl}/reports/dashboard/`;
    
    return this.http.get<DashboardOverview>(url).pipe(
      catchError((error) => {
        console.error('Błąd pobierania przeglądu dashboard:', error);
        return of({
          today: { revenue: 0, orders_count: 0 },
          current_month: { revenue: 0, orders_count: 0, growth_rate: 0 },
          current_year: { revenue: 0, orders_count: 0 },
          previous_month: { revenue: 0, orders_count: 0 }
        });
      })
    );
  }

  // Low stock alerts (legacy - simple product-based)
  getLowStockAlerts(threshold: number = 10): Observable<LowStockAlert[]> {
    // Client-side filtering based on products from backend
    return this.getProducts().pipe(
      map(products => {
        return products
          .filter(p => p.stock <= threshold)
          .map(p => ({
            product: p,
            currentStock: p.stock,
            suggestedOrder: Math.max(20, threshold * 2 - p.stock),
            threshold: threshold
          }))
          .sort((a, b) => a.currentStock - b.currentStock);
      }),
      catchError((error) => {
        console.error('Błąd pobierania alertów o niskim stanie:', error);
        return of([]);
      })
    );
  }

  // Enhanced Low Stock Alerts - Variant-based from backend
  getLowStockVariants(severity?: 'critical' | 'warning' | 'all'): Observable<LowStockVariantAlert[]> {
    const params = severity && severity !== 'all' ? `?severity=${severity}` : '';
    return this.http.get<ProductSkuVariant[]>(`${this.apiUrl}/shop/low-stock-variants/${params}`).pipe(
      map(variants => {
        return variants.map(variant => {
          const difference = variant.low_stock_threshold - variant.stock;
          const suggestedOrder = Math.max(20, difference + 10);
          
          // Determine severity
          let severityLevel: 'critical' | 'warning' | 'info';
          if (variant.stock === 0) {
            severityLevel = 'critical';
          } else if (variant.stock < variant.low_stock_threshold / 2) {
            severityLevel = 'warning';
          } else {
            severityLevel = 'info';
          }

          return {
            variant: variant,
            productName: variant.name || 'Nieznany produkt',
            productSlug: '',
            categoryName: '',
            currentStock: variant.stock,
            threshold: variant.low_stock_threshold,
            difference: difference,
            suggestedOrder: suggestedOrder,
            severity: severityLevel
          } as LowStockVariantAlert;
        });
      }),
      catchError((error) => {
        console.error('Błąd pobierania alertów wariantów:', error);
        return of([]);
      })
    );
  }

  // Get low stock statistics
  getLowStockStatistics(): Observable<LowStockStatistics> {
    return this.http.get<LowStockStatistics>(`${this.apiUrl}/shop/low-stock-variants/statistics/`).pipe(
      catchError((error) => {
        console.error('Błąd pobierania statystyk niskich stanów:', error);
        return of({
          total_variants: 0,
          low_stock_count: 0,
          critical_count: 0,
          warning_count: 0,
          ok_count: 0
        });
      })
    );
  }

  // Trigger manual low stock alert email
  triggerLowStockAlert(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/shop/low-stock-variants/trigger_alert/`,
      {}
    ).pipe(
      catchError((error) => {
        console.error('Błąd wyzwalania alertu:', error);
        return of({
          success: false,
          message: 'Błąd podczas wyzwalania alertu'
        });
      })
    );
  }

  // Group low stock variants by product
  getGroupedLowStockAlerts(severity?: 'critical' | 'warning' | 'all'): Observable<GroupedLowStockAlert[]> {
    return this.getLowStockVariants(severity).pipe(
      map(alerts => {
        const grouped = new Map<number, GroupedLowStockAlert>();
        
        alerts.forEach(alert => {
          const productId = alert.variant.product;
          
          if (!grouped.has(productId)) {
            grouped.set(productId, {
              productId: productId,
              productName: alert.productName,
              productSlug: alert.productSlug,
              categoryName: alert.categoryName,
              variants: [],
              totalVariantsAffected: 0,
              hasCritical: false
            });
          }
          
          const group = grouped.get(productId)!;
          group.variants.push(alert);
          group.totalVariantsAffected++;
          
          if (alert.severity === 'critical') {
            group.hasCritical = true;
          }
        });
        
        return Array.from(grouped.values()).sort((a, b) => {
          // Critical first, then by number of affected variants
          if (a.hasCritical && !b.hasCritical) return -1;
          if (!a.hasCritical && b.hasCritical) return 1;
          return b.totalVariantsAffected - a.totalVariantsAffected;
        });
      })
    );
  }

  // Update variant stock and threshold
  updateVariant(variantId: number, updates: Partial<ProductSkuVariant>): Observable<ProductSkuVariant> {
    return this.http.patch<ProductSkuVariant>(
      `${this.apiUrl}/shop/variants/${variantId}/`,
      updates
    ).pipe(
      catchError((error) => {
        console.error('Błąd aktualizacji wariantu:', error);
        throw error;
      })
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
    return this.http.get<Blob>(`${this.apiUrl}/orders/${orderId}/invoice/`, {
      responseType: 'blob' as 'json'
    });
  }

  downloadInvoice(orderId: string, filename?: string): void {
    this.http.get(`${this.apiUrl}/orders/${orderId}/invoice/`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `faktura_${orderId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Błąd pobierania faktury:', error);
        alert('Nie udało się pobrać faktury. Sprawdź czy zamówienie istnieje.');
      }
    });
  }

  // Loyalty Program - Admin API
  getLoyaltyProgram(): Observable<LoyaltyProgram | null> {
    // Backend doesn't have this endpoint yet, using mock data
    return this.mockDataService.getLoyaltyProgram();
  }

  createOrUpdateLoyaltyProgram(program: InsertLoyaltyProgram): Observable<LoyaltyProgram> {
    // Backend doesn't have this endpoint yet, using mock data
    return this.mockDataService.createOrUpdateLoyaltyProgram(program);
  }

  // Loyalty Rewards - Admin API
  getLoyaltyRewards(): Observable<LoyaltyReward[]> {
    return this.http.get<any[]>(`${this.apiUrl}/promotions/rewards/`).pipe(
      map(rewards => rewards.map(reward => {
        const pointsRequired = reward.points_required || 0;
        const rewardValue = parseFloat(reward.reward_value || '0');
        const isPercentage = reward.is_percentage || false;
        
        return {
          id: reward.id.toString(),
          name: reward.name,
          description: reward.description,
          pointsCost: pointsRequired,
          pointsRequired: pointsRequired,
          rewardType: isPercentage ? 'discount_percentage' : 'discount_fixed',
          rewardValue: rewardValue,
          isActive: reward.active || false,
          isPercentage: isPercentage,
          active: reward.active,
          createdAt: reward.created_at ? new Date(reward.created_at) : undefined
        } as LoyaltyReward;
      }))
    );
  }

  createLoyaltyReward(reward: InsertLoyaltyReward): Observable<LoyaltyReward> {
    const payload = {
      name: reward.name,
      description: reward.description,
      points_required: reward.pointsCost,
      reward_value: reward.rewardValue.toString(),
      is_percentage: reward.rewardType === 'discount_percentage',
      active: reward.isActive
    };
    
    return this.http.post<any>(`${this.apiUrl}/promotions/rewards/`, payload).pipe(
      map(response => ({
        id: response.id.toString(),
        name: response.name,
        description: response.description,
        pointsCost: response.points_required,
        pointsRequired: response.points_required,
        rewardType: response.is_percentage ? 'discount_percentage' : 'discount_fixed',
        rewardValue: parseFloat(response.reward_value),
        isActive: response.active,
        isPercentage: response.is_percentage,
        createdAt: new Date(response.created_at)
      } as LoyaltyReward))
    );
  }

  updateLoyaltyReward(id: string, reward: Partial<InsertLoyaltyReward>): Observable<LoyaltyReward> {
    const payload: any = {};
    
    if (reward.name !== undefined) payload.name = reward.name;
    if (reward.description !== undefined) payload.description = reward.description;
    if (reward.pointsCost !== undefined) payload.points_required = reward.pointsCost;
    if (reward.rewardValue !== undefined) payload.reward_value = reward.rewardValue.toString();
    if (reward.rewardType !== undefined) payload.is_percentage = reward.rewardType === 'discount_percentage';
    if (reward.isActive !== undefined) payload.active = reward.isActive;
    
    return this.http.patch<any>(`${this.apiUrl}/promotions/rewards/${id}/`, payload).pipe(
      map(response => ({
        id: response.id.toString(),
        name: response.name,
        description: response.description,
        pointsCost: response.points_required,
        pointsRequired: response.points_required,
        rewardType: response.is_percentage ? 'discount_percentage' : 'discount_fixed',
        rewardValue: parseFloat(response.reward_value),
        isActive: response.active,
        isPercentage: response.is_percentage,
        createdAt: new Date(response.created_at)
      } as LoyaltyReward))
    );
  }

  deleteLoyaltyReward(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/promotions/rewards/${id}/`);
  }

  // Loyalty - User API
  getUserLoyaltyPoints(): Observable<UserLoyaltyPoints> {
    return this.http.get<any>(`${this.apiUrl}/users/loyalty-points/`).pipe(
      switchMap(response => {
        // Pobierz historię realizacji aby obliczyć wykorzystane punkty
        return this.http.get<any[]>(`${this.apiUrl}/promotions/loyalty/my-rewards/`).pipe(
          map(rewards => {
            const totalSpent = rewards.reduce((sum, r) => sum + (r.points_spent || 0), 0);
            const availablePoints = response.available_points || 0;
            
            return {
              userId: response.user_id?.toString() || '',
              totalPoints: availablePoints + totalSpent,
              availablePoints: availablePoints,
              usedPoints: totalSpent,
              history: []
            } as UserLoyaltyPoints;
          })
        );
      })
    );
  }

  getLoyaltyOffers(): Observable<LoyaltyReward[]> {
    return this.http.get<any[]>(`${this.apiUrl}/promotions/loyalty/offers/`).pipe(
      map(rewards => rewards.map(reward => {
        const pointsRequired = reward.points_required || 0;
        const rewardValue = parseFloat(reward.reward_value || '0');
        const isPercentage = reward.is_percentage || false;
        
        return {
          id: reward.id.toString(),
          name: reward.name,
          description: reward.description,
          pointsCost: pointsRequired, // Unified field for frontend
          pointsRequired: pointsRequired,
          rewardType: isPercentage ? 'discount_percentage' : 'discount_fixed',
          rewardValue: rewardValue,
          isActive: reward.active || false,
          isPercentage: isPercentage,
          active: reward.active
        } as LoyaltyReward;
      }))
    );
  }

  redeemReward(rewardId: string): Observable<RedeemedReward> {
    return this.http.post<any>(`${this.apiUrl}/promotions/loyalty/redeem/`, { 
      reward_id: rewardId 
    }).pipe(
      map(response => ({
        id: response.coupon_code,
        userId: this.authService.currentUserValue?.id || '',
        rewardId: rewardId,
        rewardName: response.reward_name,
        reward: {} as LoyaltyReward,
        pointsSpent: response.points_spent || 0,
        code: response.coupon_code,
        isUsed: false,
        createdAt: new Date(),
        couponCode: response.coupon_code,
        redeemedAt: new Date().toISOString(),
        couponDetails: {
          code: response.coupon_code,
          validFrom: response.coupon_details.valid_from,
          validTo: response.coupon_details.valid_to,
          value: parseFloat(response.coupon_details.value),
          isPercentage: response.coupon_details.is_percentage,
          active: response.coupon_details.active
        }
      } as any))
    );
  }

  getMyRedeemedRewards(): Observable<RedeemedReward[]> {
    return this.http.get<any[]>(`${this.apiUrl}/promotions/loyalty/my-rewards/`).pipe(
      map(rewards => rewards.map(r => ({
        id: r.id?.toString() || '',
        userId: this.authService.currentUserValue?.id || '',
        rewardId: r.reward?.toString() || '',
        rewardName: r.reward_name,
        reward: {} as LoyaltyReward,
        pointsSpent: r.points_spent,
        code: r.coupon_code,
        couponCode: r.coupon_code,
        isUsed: !!r.is_used,
        createdAt: new Date(r.redeemed_at),
        redeemedAt: r.redeemed_at
      } as RedeemedReward)))
    );
  }

  validateCoupon(code: string, cartTotal: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/promotions/coupons/validate/`, {
      code: code,
      cart_total: cartTotal
    });
  }
}
