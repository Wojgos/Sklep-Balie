import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { 
  Product, 
  Category, 
  Order, 
  OrderItem, 
  InsertProduct, 
  InsertOrder, 
  InsertOrderItem 
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
      createdAt: new Date('2024-01-15')
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
      createdAt: new Date('2024-02-10')
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
      email: 'jan.kowalski@email.com',
      phone: '123-456-789',
      address: 'ul. Ogrodowa 1',
      city: 'Warszawa',
      postalCode: '00-001',
      totalPrice: '449.98',
      status: 'completed',
      notes: 'Dostawa na parter',
      createdAt: new Date('2024-01-20')
    }
  ];

  private orderItems: OrderItem[] = [
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
      productId: '2',
      productName: 'Beczka na wodę deszczową',
      quantity: 1,
      price: '199.99'
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
}
