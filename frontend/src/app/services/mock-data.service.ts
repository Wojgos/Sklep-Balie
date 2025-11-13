import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
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
  LowStockAlert
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  
  private categories: Category[] = [
    {
      id: '1',
      name: 'Drewniane beczki',
      description: 'Tradycyjne drewniane beczki do ogrodu',
      image: 'assets/Wooden_garden_barrel_hero_26de98c6.png',
      productCount: 3
    },
    {
      id: '2',
      name: 'Deski tarasowe',
      description: 'Wysokiej jakości deski do budowy tarasów',
      image: 'assets/Cedar_decking_planks_product_ffc1e2e4.png',
      productCount: 2
    },
    {
      id: '3',
      name: 'Elementy konstrukcyjne',
      description: 'Belki i elementy do budowy konstrukcji ogrodowych',
      image: 'assets/Treated_construction_beams_product_afa95ad7.png',
      productCount: 2
    },
    {
      id: '4',
      name: 'Akcesoria wodne',
      description: 'Zbiorniki i akcesoria do wody w ogrodzie',
      image: 'assets/Rain_water_barrel_6764a662.png',
      productCount: 2
    }
  ];

  private products: Product[] = [
    {
      id: '1',
      name: 'Drewniana beczka ogrodowa',
      description: 'Klasyczna drewniana beczka idealna do dekoracji ogrodu',
      dimensions: '60x60x80 cm',
      price: '299.99',
      oldPrice: '349.99',
      rating: 4.5,
      categoryId: '1',
      image: 'assets/Wooden_garden_barrel_hero_26de98c6.png',
      stock: 15,
      material: 'Dąb',
      createdAt: new Date('2024-01-15'),
      attributes: [
        {
          id: 'size-1',
          name: 'Rozmiar',
          type: 'size',
          variants: [
            { id: 'size-s', name: 'Mały', value: '50x50x70 cm', priceModifier: -50 },
            { id: 'size-m', name: 'Średni', value: '60x60x80 cm', priceModifier: 0 },
            { id: 'size-l', name: 'Duży', value: '70x70x90 cm', priceModifier: 50 }
          ]
        },
        {
          id: 'finish-1',
          name: 'Wykończenie',
          type: 'text',
          variants: [
            { id: 'finish-natural', name: 'Naturalne', value: 'Naturalne drewno', priceModifier: 0 },
            { id: 'finish-oiled', name: 'Olejowane', value: 'Olejowane', priceModifier: 30 },
            { id: 'finish-varnished', name: 'Lakierowane', value: 'Lakierowane', priceModifier: 50 }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Beczka na wodę deszczową',
      description: 'Praktyczna beczka do zbierania wody deszczowej',
      dimensions: '50x50x100 cm',
      price: '199.99',
      oldPrice: null,
      rating: 4.2,
      categoryId: '1',
      image: 'assets/Rain_water_barrel_6764a662.png',
      stock: 8,
      material: 'Dąb',
      createdAt: new Date('2024-01-20')
    },
    {
      id: '3',
      name: 'Dekoracyjna beczka na rośliny',
      description: 'Elegancka beczka do sadzenia roślin',
      dimensions: '40x40x50 cm',
      price: '149.99',
      oldPrice: '179.99',
      rating: 4.8,
      categoryId: '1',
      image: 'assets/Decorative_barrel_planter_7afc2d20.png',
      stock: 12,
      material: 'Sosna',
      createdAt: new Date('2024-02-01')
    },
    {
      id: '4',
      name: 'Deski cedrowe tarasowe',
      description: 'Wysokiej jakości deski cedrowe do tarasów',
      dimensions: '200x15x3 cm',
      price: '45.99',
      oldPrice: null,
      rating: 4.6,
      categoryId: '2',
      image: 'assets/Cedar_decking_planks_product_ffc1e2e4.png',
      stock: 50,
      material: 'Cedr',
      createdAt: new Date('2024-01-10')
    },
    {
      id: '5',
      name: 'Deski sosnowe ogrodowe',
      description: 'Impregnowane deski sosnowe do zastosowań ogrodowych',
      dimensions: '300x20x4 cm',
      price: '35.99',
      oldPrice: '42.99',
      rating: 4.3,
      categoryId: '2',
      image: 'assets/Pine_garden_logs_product_2d3a5573.png',
      stock: 30,
      material: 'Sosna',
      createdAt: new Date('2024-01-25')
    },
    {
      id: '6',
      name: 'Belki konstrukcyjne dębowe',
      description: 'Solidne belki dębowe do konstrukcji ogrodowych',
      dimensions: '400x15x15 cm',
      price: '89.99',
      oldPrice: null,
      rating: 4.7,
      categoryId: '3',
      image: 'assets/Treated_construction_beams_product_afa95ad7.png',
      stock: 20,
      material: 'Dąb',
      createdAt: new Date('2024-02-05')
    },
    {
      id: '7',
      name: 'Słupki ogrodzeniowe dębowe',
      description: 'Wytrzymałe słupki do ogrodzeń',
      dimensions: '250x10x10 cm',
      price: '24.99',
      oldPrice: '29.99',
      rating: 4.4,
      categoryId: '3',
      image: 'assets/Oak_fence_timber_product_46de4b51.png',
      stock: 40,
      material: 'Dąb',
      createdAt: new Date('2024-01-30')
    },
    {
      id: '8',
      name: 'Wanna ogrodowa dębowa',
      description: 'Luksusowa wanna ogrodowa z drewna dębowego',
      dimensions: '180x80x60 cm',
      price: '899.99',
      oldPrice: '1099.99',
      rating: 4.9,
      categoryId: '4',
      image: 'assets/Oak_barrel_water_tub_da291514.png',
      stock: 3,
      material: 'Dąb',
      createdAt: new Date('2024-02-10'),
      attributes: [
        {
          id: 'wood-type',
          name: 'Rodzaj drewna',
          type: 'text',
          variants: [
            { id: 'oak', name: 'Dąb', value: 'Dąb europejski', priceModifier: 0 },
            { id: 'larch', name: 'Modrzew', value: 'Modrzew syberyjski', priceModifier: 100 },
            { id: 'cedar', name: 'Cedr', value: 'Cedr kanadyjski', priceModifier: 200 }
          ]
        },
        {
          id: 'accessories',
          name: 'Wyposażenie',
          type: 'text',
          variants: [
            { id: 'basic', name: 'Podstawowe', value: 'Bez dodatków', priceModifier: 0 },
            { id: 'steps', name: 'Ze schodkami', value: 'Schodki drewniane', priceModifier: 150 },
            { id: 'full', name: 'Pełne', value: 'Schodki + ławka', priceModifier: 300 }
          ]
        }
      ]
    },
    {
      id: '9',
      name: 'Owalna wanna ogrodowa',
      description: 'Elegancka owalna wanna do ogrodu',
      dimensions: '150x100x50 cm',
      price: '699.99',
      oldPrice: null,
      rating: 4.6,
      categoryId: '4',
      image: 'assets/Oval_garden_bathtub_565f5ffe.png',
      stock: 5,
      material: 'Dąb',
      createdAt: new Date('2024-02-15')
    }
  ];

  private orders: Order[] = [
    {
      id: '1',
      customerName: 'Jan Kowalski',
      email: 'user@example.com',
      phone: '+48 987 654 321',
      address: 'ul. Testowa 10',
      city: 'Kraków',
      postalCode: '30-001',
      totalPrice: '449.98',
      status: 'delivered',
      notes: 'Dostawa na parter',
      createdAt: new Date('2024-10-15')
    },
    {
      id: '2',
      customerName: 'Jan Kowalski',
      email: 'user@example.com',
      phone: '+48 987 654 321',
      address: 'ul. Testowa 10',
      city: 'Kraków',
      postalCode: '30-001',
      totalPrice: '899.99',
      status: 'shipped',
      notes: 'Proszę zadzwonić przed dostawą',
      createdAt: new Date('2024-11-05')
    },
    {
      id: '3',
      customerName: 'Jan Kowalski',
      email: 'user@example.com',
      phone: '+48 987 654 321',
      address: 'ul. Testowa 10',
      city: 'Kraków',
      postalCode: '30-001',
      totalPrice: '258.93',
      status: 'processing',
      notes: null,
      createdAt: new Date('2024-11-10')
    },
    {
      id: '4',
      customerName: 'Jan Kowalski',
      email: 'user@example.com',
      phone: '+48 987 654 321',
      address: 'ul. Testowa 10',
      city: 'Kraków',
      postalCode: '30-001',
      totalPrice: '699.99',
      status: 'pending',
      notes: 'Zamówienie na prezent',
      createdAt: new Date('2024-11-12')
    },
    {
      id: '5',
      customerName: 'Jan Kowalski',
      email: 'user@example.com',
      phone: '+48 987 654 321',
      address: 'ul. Leśna 5',
      city: 'Warszawa',
      postalCode: '02-500',
      totalPrice: '149.99',
      status: 'delivered',
      notes: 'Dostawa pod drzwi',
      createdAt: new Date('2024-09-20')
    }
  ];

  private orderItems: OrderItem[] = [
    // Zamówienie #1 - Dostarczone (2x produkt)
    {
      id: '1',
      orderId: '1',
      productId: '1',
      productName: 'Drewniana beczka ogrodowa',
      quantity: 1,
      price: '299.99'
    },
    {
      id: '2',
      orderId: '1',
      productId: '3',
      productName: 'Dekoracyjna beczka na rośliny',
      quantity: 1,
      price: '149.99'
    },
    // Zamówienie #2 - Wysłane (1x produkt premium)
    {
      id: '3',
      orderId: '2',
      productId: '8',
      productName: 'Wanna ogrodowa dębowa',
      quantity: 1,
      price: '899.99'
    },
    // Zamówienie #3 - W realizacji (3x produkty konstrukcyjne)
    {
      id: '4',
      orderId: '3',
      productId: '7',
      productName: 'Słupki ogrodzeniowe dębowe',
      quantity: 3,
      price: '24.99'
    },
    {
      id: '5',
      orderId: '3',
      productId: '4',
      productName: 'Deski cedrowe tarasowe',
      quantity: 4,
      price: '45.99'
    },
    // Zamówienie #4 - Oczekujące (1x produkt)
    {
      id: '6',
      orderId: '4',
      productId: '9',
      productName: 'Owalna wanna ogrodowa',
      quantity: 1,
      price: '699.99'
    },
    // Zamówienie #5 - Dostarczone (1x produkt)
    {
      id: '7',
      orderId: '5',
      productId: '3',
      productName: 'Dekoracyjna beczka na rośliny',
      quantity: 1,
      price: '149.99'
    }
  ];

  // Categories methods
  getCategories(): Observable<Category[]> {
    return of(this.categories).pipe(delay(300));
  }

  getCategory(id: string): Observable<Category> {
    const category = this.categories.find(c => c.id === id);
    if (!category) {
      throw new Error(`Category with id ${id} not found`);
    }
    return of(category).pipe(delay(200));
  }

  // Products methods
  getProducts(): Observable<Product[]> {
    return of(this.products).pipe(delay(400));
  }

  getProduct(id: string): Observable<Product> {
    const product = this.products.find(p => p.id === id);
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }
    return of(product).pipe(delay(200));
  }

  getProductsByCategory(categoryId: string): Observable<Product[]> {
    const products = this.products.filter(p => p.categoryId === categoryId);
    return of(products).pipe(delay(300));
  }

  createProduct(product: InsertProduct): Observable<Product> {
    const newProduct: Product = {
      id: (this.products.length + 1).toString(),
      name: product.name,
      description: product.description || null,
      dimensions: product.dimensions,
      price: product.price,
      oldPrice: product.oldPrice || null,
      rating: product.rating || 0,
      categoryId: product.categoryId,
      image: product.image,
      stock: product.stock || 0,
      material: product.material || null,
      createdAt: new Date()
    };
    this.products.push(newProduct);
    return of(newProduct).pipe(delay(500));
  }

  updateProduct(id: string, product: Partial<InsertProduct>): Observable<Product> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Product with id ${id} not found`);
    }
    this.products[index] = { ...this.products[index], ...product };
    return of(this.products[index]).pipe(delay(400));
  }

  deleteProduct(id: string): Observable<void> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Product with id ${id} not found`);
    }
    this.products.splice(index, 1);
    return of(undefined).pipe(delay(300));
  }

  // Orders methods
  getOrders(): Observable<Order[]> {
    return of(this.orders).pipe(delay(400));
  }

  getOrder(id: string): Observable<Order & { items: OrderItem[] }> {
    const order = this.orders.find(o => o.id === id);
    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }
    const items = this.orderItems.filter(item => item.orderId === id);
    return of({ ...order, items }).pipe(delay(300));
  }

  createOrder(order: InsertOrder & { items: Omit<InsertOrderItem, 'orderId'>[] }): Observable<Order> {
    const newOrder: Order = {
      id: (this.orders.length + 1).toString(),
      customerName: order.customerName,
      email: order.email,
      phone: order.phone,
      address: order.address,
      city: order.city,
      postalCode: order.postalCode,
      totalPrice: order.totalPrice,
      notes: order.notes || null,
      status: 'pending',
      createdAt: new Date()
    };
    
    // Add order items
    const newOrderItems: OrderItem[] = order.items.map((item, index) => ({
      id: (this.orderItems.length + index + 1).toString(),
      orderId: newOrder.id,
      ...item
    }));
    
    this.orders.push(newOrder);
    this.orderItems.push(...newOrderItems);
    
    return of(newOrder).pipe(delay(600));
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    const order = this.orders.find(o => o.id === id);
    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }
    order.status = status;
    return of(order).pipe(delay(300));
  }

  updateOrder(id: string, updates: Partial<Order>): Observable<Order> {
    const order = this.orders.find(o => o.id === id);
    if (!order) {
      throw new Error(`Order with id ${id} not found`);
    }
    Object.assign(order, updates);
    return of(order).pipe(delay(300));
  }

  // Category management methods
  createCategory(category: InsertCategory): Observable<Category> {
    const newCategory: Category = {
      id: (this.categories.length + 1).toString(),
      name: category.name,
      description: category.description || null,
      image: category.image,
      productCount: category.productCount || 0
    };
    this.categories.push(newCategory);
    return of(newCategory).pipe(delay(500));
  }

  updateCategory(id: string, category: Partial<InsertCategory>): Observable<Category> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Category with id ${id} not found`);
    }
    this.categories[index] = { ...this.categories[index], ...category };
    return of(this.categories[index]).pipe(delay(400));
  }

  deleteCategory(id: string): Observable<void> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Category with id ${id} not found`);
    }
    this.categories.splice(index, 1);
    return of(undefined).pipe(delay(300));
  }

  // Statistics methods
  getSalesStatistics(startDate?: Date, endDate?: Date): Observable<SalesStatistics> {
    const filteredOrders = this.orders.filter(order => {
      if (!startDate && !endDate) return true;
      const orderDate = new Date(order.createdAt);
      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;
      return true;
    });

    const totalRevenue = filteredOrders.reduce((sum, order) => 
      sum + parseFloat(order.totalPrice), 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products
    const productSales = new Map<string, { product: Product, quantity: number, revenue: number }>();
    filteredOrders.forEach(order => {
      const items = this.orderItems.filter(item => item.orderId === order.id);
      items.forEach(item => {
        const product = this.products.find(p => p.id === item.productId);
        if (product) {
          const existing = productSales.get(item.productId);
          const itemRevenue = parseFloat(item.price) * item.quantity;
          if (existing) {
            existing.quantity += item.quantity;
            existing.revenue += itemRevenue;
          } else {
            productSales.set(item.productId, {
              product,
              quantity: item.quantity,
              revenue: itemRevenue
            });
          }
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Revenue by category
    const categoryRevenue = new Map<string, number>();
    filteredOrders.forEach(order => {
      const items = this.orderItems.filter(item => item.orderId === order.id);
      items.forEach(item => {
        const product = this.products.find(p => p.id === item.productId);
        if (product) {
          const itemRevenue = parseFloat(item.price) * item.quantity;
          categoryRevenue.set(
            product.categoryId,
            (categoryRevenue.get(product.categoryId) || 0) + itemRevenue
          );
        }
      });
    });

    const revenueByCategory = Array.from(categoryRevenue.entries())
      .map(([categoryId, revenue]) => ({
        category: this.categories.find(c => c.id === categoryId)!,
        revenue
      }))
      .filter(item => item.category);

    // Orders by status
    const statusCounts = new Map<string, number>();
    filteredOrders.forEach(order => {
      statusCounts.set(order.status, (statusCounts.get(order.status) || 0) + 1);
    });

    const ordersByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count
    }));

    const statistics: SalesStatistics = {
      period: startDate && endDate 
        ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
        : 'All time',
      totalRevenue,
      totalOrders,
      totalProducts: this.products.length,
      averageOrderValue,
      topProducts,
      revenueByCategory,
      ordersByStatus
    };

    return of(statistics).pipe(delay(600));
  }

  // Low stock alerts
  getLowStockAlerts(threshold: number = 10): Observable<LowStockAlert[]> {
    const alerts: LowStockAlert[] = this.products
      .filter(product => product.stock <= threshold)
      .map(product => ({
        product,
        currentStock: product.stock,
        threshold,
        suggestedOrder: Math.max(20 - product.stock, 10)
      }))
      .sort((a, b) => a.currentStock - b.currentStock);

    return of(alerts).pipe(delay(300));
  }
}
