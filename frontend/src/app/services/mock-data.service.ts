import { Injectable } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';
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
  TicketMessage,
  InsertTicket,
  TicketReply,
  User,
  LoyaltyProgram,
  LoyaltyReward,
  UserLoyaltyPoints,
  LoyaltyTransaction,
  RedeemedReward,
  InsertLoyaltyProgram,
  InsertLoyaltyReward
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
      price: '299.99',
      oldPrice: '349.99',
      rating: 4.5,
      categoryId: '1',
      image: 'assets/Wooden_garden_barrel_hero_26de98c6.png',
      stock: 15,
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
      price: '199.99',
      oldPrice: null,
      rating: 4.2,
      categoryId: '1',
      image: 'assets/Rain_water_barrel_6764a662.png',
      stock: 8,
      createdAt: new Date('2024-01-20')
    },
    {
      id: '3',
      name: 'Dekoracyjna beczka na rośliny',
      description: 'Elegancka beczka do sadzenia roślin',
      price: '149.99',
      oldPrice: '179.99',
      rating: 4.8,
      categoryId: '1',
      image: 'assets/Decorative_barrel_planter_7afc2d20.png',
      stock: 12,
      createdAt: new Date('2024-02-01')
    },
    {
      id: '4',
      name: 'Deski cedrowe tarasowe',
      description: 'Wysokiej jakości deski cedrowe do tarasów',
      price: '45.99',
      oldPrice: null,
      rating: 4.6,
      categoryId: '2',
      image: 'assets/Cedar_decking_planks_product_ffc1e2e4.png',
      stock: 50,
      createdAt: new Date('2024-01-10')
    },
    {
      id: '5',
      name: 'Deski sosnowe ogrodowe',
      description: 'Impregnowane deski sosnowe do zastosowań ogrodowych',
      price: '35.99',
      oldPrice: '42.99',
      rating: 4.3,
      categoryId: '2',
      image: 'assets/Pine_garden_logs_product_2d3a5573.png',
      stock: 30,
      createdAt: new Date('2024-01-25')
    },
    {
      id: '6',
      name: 'Belki konstrukcyjne dębowe',
      description: 'Solidne belki dębowe do konstrukcji ogrodowych',
      price: '89.99',
      oldPrice: null,
      rating: 4.7,
      categoryId: '3',
      image: 'assets/Treated_construction_beams_product_afa95ad7.png',
      stock: 20,
      createdAt: new Date('2024-02-05')
    },
    {
      id: '7',
      name: 'Słupki ogrodzeniowe dębowe',
      description: 'Wytrzymałe słupki do ogrodzeń',
      price: '24.99',
      oldPrice: '29.99',
      rating: 4.4,
      categoryId: '3',
      image: 'assets/Oak_fence_timber_product_46de4b51.png',
      stock: 40,
      createdAt: new Date('2024-01-30')
    },
    {
      id: '8',
      name: 'Wanna ogrodowa dębowa',
      description: 'Luksusowa wanna ogrodowa z drewna dębowego',
      price: '899.99',
      oldPrice: '1099.99',
      rating: 4.9,
      categoryId: '4',
      image: 'assets/Oak_barrel_water_tub_da291514.png',
      stock: 3,
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
      price: '699.99',
      oldPrice: null,
      rating: 4.6,
      categoryId: '4',
      image: 'assets/Oval_garden_bathtub_565f5ffe.png',
      stock: 5,
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

  private mockUsers: User[] = [
    {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      phone: '+48 123 456 789',
      address: 'ul. Przykładowa 1',
      city: 'Warszawa',
      postalCode: '00-001'
    },
    {
      id: '2',
      username: 'user',
      email: 'user@example.com',
      firstName: 'Jan',
      lastName: 'Kowalski',
      role: 'user',
      phone: '+48 987 654 321',
      address: 'ul. Testowa 10',
      city: 'Kraków',
      postalCode: '30-001'
    }
  ];

  private tickets: Ticket[] = [
    {
      id: '1',
      user: this.mockUsers[1], // Jan Kowalski
      subject: 'Pytanie o dostawę',
      status: 'new',
      created_at: new Date('2024-11-10T10:30:00'),
      updated_at: new Date('2024-11-10T10:30:00'),
      messages: [
        {
          id: '1',
          author_id: 2,
          body: 'Witam, chciałbym zapytać o czas dostawy dla zamówienia #123. Czy mogą Państwo podać orientacyjną datę?',
          created_at: new Date('2024-11-10T10:30:00')
        }
      ],
      participants: [this.mockUsers[1]]
    },
    {
      id: '2',
      user: this.mockUsers[1],
      subject: 'Problem z produktem',
      status: 'in_progress',
      created_at: new Date('2024-11-08T14:20:00'),
      updated_at: new Date('2024-11-09T09:15:00'),
      messages: [
        {
          id: '2',
          author_id: 2,
          body: 'Otrzymałem wadliwy produkt. Beczka ma pęknięcie na dnie. Co mogę zrobić w tej sytuacji?',
          created_at: new Date('2024-11-08T14:20:00')
        },
        {
          id: '3',
          author_id: 1,
          body: 'Dzień dobry, bardzo przepraszamy za problem. Proszę o przesłanie zdjęć uszkodzenia na nasz adres email. Przygotujemy wymianę produktu.',
          created_at: new Date('2024-11-09T09:15:00')
        },
        {
          id: '4',
          author_id: 2,
          body: 'Dziękuję za szybką odpowiedź. Zdjęcia zostały wysłane.',
          created_at: new Date('2024-11-09T10:00:00')
        }
      ],
      participants: [this.mockUsers[1], this.mockUsers[0]]
    },
    {
      id: '3',
      user: this.mockUsers[1],
      subject: 'Zapytanie o dostępność produktu',
      status: 'closed',
      created_at: new Date('2024-11-05T16:45:00'),
      updated_at: new Date('2024-11-06T11:30:00'),
      messages: [
        {
          id: '5',
          author_id: 2,
          body: 'Czy w najbliższym czasie będzie dostępna beczka 100L w kolorze ciemnym?',
          created_at: new Date('2024-11-05T16:45:00')
        },
        {
          id: '6',
          author_id: 1,
          body: 'Tak, planujemy dostawę za około 2 tygodnie. Możemy Państwa powiadomić o dostępności.',
          created_at: new Date('2024-11-06T09:00:00')
        },
        {
          id: '7',
          author_id: 2,
          body: 'Super, dziękuję za informację!',
          created_at: new Date('2024-11-06T11:30:00')
        }
      ],
      participants: [this.mockUsers[1], this.mockUsers[0]]
    }
  ];

  private ticketIdCounter = 4;
  private messageIdCounter = 8;

  private loyaltyProgram: LoyaltyProgram | null = {
    id: '1',
    name: 'Program Lojalnościowy BarrelGarden',
    description: 'Zbieraj punkty za każde zamówienie i wymieniaj je na atrakcyjne nagrody!',
    pointsPerZloty: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  private loyaltyRewards: LoyaltyReward[] = [
    {
      id: '1',
      name: 'Zniżka 5%',
      description: 'Zniżka 5% na następne zamówienie',
      pointsCost: 100,
      pointsRequired: 100,
      rewardType: 'discount_percentage',
      rewardValue: 5,
      isActive: true,
      isPercentage: true,
      image: 'assets/reward-5-percent.png',
      usageLimit: undefined,
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      name: 'Zniżka 10%',
      description: 'Zniżka 10% na następne zamówienie',
      pointsCost: 250,
      pointsRequired: 250,
      rewardType: 'discount_percentage',
      rewardValue: 10,
      isActive: true,
      isPercentage: true,
      image: 'assets/reward-10-percent.png',
      usageLimit: 1,
      createdAt: new Date('2024-01-01')
    },
    {
      id: '3',
      name: 'Zniżka 50 PLN',
      description: 'Rabat 50 PLN na następne zamówienie',
      pointsCost: 500,
      pointsRequired: 500,
      rewardType: 'discount_fixed',
      rewardValue: 50,
      isActive: true,
      isPercentage: false,
      image: 'assets/reward-50-pln.png',
      usageLimit: undefined,
      createdAt: new Date('2024-01-01')
    },
    {
      id: '4',
      name: 'Darmowa dostawa',
      description: 'Darmowa dostawa na następne zamówienie',
      pointsCost: 150,
      pointsRequired: 150,
      rewardType: 'free_shipping',
      rewardValue: 0,
      isActive: true,
      isPercentage: false,
      image: 'assets/reward-free-shipping.png',
      usageLimit: undefined,
      createdAt: new Date('2024-01-01')
    },
    {
      id: '5',
      name: 'Zniżka 20%',
      description: 'Zniżka 20% na następne zamówienie - limitowana oferta!',
      pointsCost: 800,
      pointsRequired: 800,
      rewardType: 'discount_percentage',
      rewardValue: 20,
      isActive: true,
      isPercentage: true,
      image: 'assets/reward-20-percent.png',
      validUntil: new Date('2025-12-31'),
      usageLimit: 1,
      createdAt: new Date('2024-01-01')
    }
  ];

  private userLoyaltyData: Map<string, UserLoyaltyPoints> = new Map([
    ['2', { // Jan Kowalski
      userId: '2',
      totalPoints: 2308,
      availablePoints: 1558,
      usedPoints: 750,
      currentTier: 'Silver',
      tierProgress: 62,
      history: [
        {
          id: '1',
          userId: '2',
          type: 'earned',
          points: 450,
          description: 'Punkty za zamówienie #1',
          orderId: '1',
          createdAt: new Date('2024-10-15')
        },
        {
          id: '2',
          userId: '2',
          type: 'earned',
          points: 900,
          description: 'Punkty za zamówienie #2',
          orderId: '2',
          createdAt: new Date('2024-11-05')
        },
        {
          id: '3',
          userId: '2',
          type: 'spent',
          points: -250,
          description: 'Wymiana na: Zniżka 10%',
          rewardId: '2',
          createdAt: new Date('2024-11-07')
        },
        {
          id: '4',
          userId: '2',
          type: 'earned',
          points: 258,
          description: 'Punkty za zamówienie #3',
          orderId: '3',
          createdAt: new Date('2024-11-10')
        },
        {
          id: '5',
          userId: '2',
          type: 'earned',
          points: 700,
          description: 'Punkty za zamówienie #4',
          orderId: '4',
          createdAt: new Date('2024-11-12')
        },
        {
          id: '6',
          userId: '2',
          type: 'spent',
          points: -500,
          description: 'Wymiana na: Zniżka 50 PLN',
          rewardId: '3',
          createdAt: new Date('2024-11-13')
        }
      ]
    }]
  ]);

  private redeemedRewards: RedeemedReward[] = [
    {
      id: '1',
      userId: '2',
      rewardId: '2',
      reward: this.loyaltyRewards[1],
      pointsSpent: 250,
      code: 'LOYALTY10-ABCD1234',
      isUsed: false,
      expiresAt: new Date('2025-01-31'),
      createdAt: new Date('2024-11-07')
    },
    {
      id: '2',
      userId: '2',
      rewardId: '3',
      reward: this.loyaltyRewards[2],
      pointsSpent: 500,
      code: 'LOYALTY50-EFGH5678',
      isUsed: false,
      expiresAt: new Date('2025-01-31'),
      createdAt: new Date('2024-11-13')
    }
  ];

  private rewardIdCounter = 6;
  private transactionIdCounter = 7;
  private redeemedRewardIdCounter = 3;

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

  getSimilarProducts(productId: string, limit: number = 4): Observable<Product[]> {
    const targetProduct = this.products.find(p => p.id === productId);
    if (!targetProduct) {
      return of([]).pipe(delay(200));
    }

    const similarProducts = this.products
      .filter(p => p.id !== productId && p.categoryId === targetProduct.categoryId)
      .sort((a, b) => b.rating - a.rating || b.stock - a.stock)
      .slice(0, limit);

    return of(similarProducts).pipe(delay(250));
  }

  getFrequentlyBoughtTogether(productId: string, limit: number = 4): Observable<Product[]> {
    const orderIds = new Set(
      this.orderItems
        .filter(item => item.productId === productId)
        .map(item => item.orderId)
    );

    if (orderIds.size === 0) {
      return of([]).pipe(delay(200));
    }

    const productFrequency = new Map<string, number>();

    this.orderItems.forEach(item => {
      if (orderIds.has(item.orderId) && item.productId !== productId) {
        productFrequency.set(
          item.productId,
          (productFrequency.get(item.productId) || 0) + item.quantity
        );
      }
    });

    const rankedProducts = Array.from(productFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => this.products.find(product => product.id === id))
      .filter((product): product is Product => Boolean(product))
      .slice(0, limit);

    return of(rankedProducts).pipe(delay(250));
  }

  createProduct(product: any): Observable<Product> {
    const newProduct: Product = {
      id: (this.products.length + 1).toString(),
      name: product.name,
      description: product.description || null,
      price: product.price,
      oldPrice: product.oldPrice || null,
      rating: product.rating || 0,
      categoryId: product.categoryId,
      image: product.image,
      stock: product.stock || 0,
      createdAt: new Date(),
      attributes: product.attributes || []
    };
    this.products.push(newProduct);
    return of(newProduct).pipe(delay(500));
  }

  updateProduct(id: string, product: any): Observable<Product> {
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

  getMyTickets(userId: string = '2'): Observable<Ticket[]> {
    const userTickets = this.tickets.filter(t => t.user.id === userId);
    return of(userTickets).pipe(delay(400));
  }

  getAllTickets(): Observable<Ticket[]> {
    return of(this.tickets).pipe(delay(400));
  }

  getTicket(id: string): Observable<Ticket> {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket) {
      throw new Error(`Ticket with id ${id} not found`);
    }
    return of(ticket).pipe(delay(300));
  }

  createTicket(ticketData: InsertTicket, userId: string = '2'): Observable<Ticket> {
    const user = this.mockUsers.find(u => u.id === userId) || this.mockUsers[1];
    
    const newTicket: Ticket = {
      id: this.ticketIdCounter.toString(),
      user: user,
      subject: ticketData.subject,
      status: 'new',
      created_at: new Date(),
      updated_at: new Date(),
      messages: [
        {
          id: this.messageIdCounter.toString(),
          author_id: parseInt(userId),
          body: ticketData.body,
          created_at: new Date()
        }
      ],
      participants: [user]
    };

    this.ticketIdCounter++;
    this.messageIdCounter++;
    this.tickets.push(newTicket);

    return of(newTicket).pipe(delay(500));
  }

  replyToTicket(ticketId: string, reply: TicketReply, userId: string = '2'): Observable<void> {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) {
      throw new Error(`Ticket with id ${ticketId} not found`);
    }

    const newMessage: TicketMessage = {
      id: this.messageIdCounter.toString(),
      author_id: parseInt(userId),
      body: reply.body,
      created_at: new Date()
    };

    this.messageIdCounter++;
    ticket.messages = ticket.messages || [];
    ticket.messages.push(newMessage);
    ticket.updated_at = new Date();
    ticket.status = 'new';

    const user = this.mockUsers.find(u => u.id === userId);
    if (user && !ticket.participants?.some(p => p.id === userId)) {
      ticket.participants = ticket.participants || [];
      ticket.participants.push(user);
    }

    return of(undefined).pipe(delay(500));
  }

  adminReplyToTicket(ticketId: string, reply: TicketReply): Observable<void> {
    return this.replyToTicket(ticketId, reply, '1');
  }

  updateTicketStatus(ticketId: string, status: 'new' | 'in_progress' | 'closed'): Observable<Ticket> {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) {
      throw new Error(`Ticket with id ${ticketId} not found`);
    }

    ticket.status = status;
    ticket.updated_at = new Date();

    return of(ticket).pipe(delay(400));
  }

  getLoyaltyProgram(): Observable<LoyaltyProgram | null> {
    return of(this.loyaltyProgram).pipe(delay(300));
  }

  createOrUpdateLoyaltyProgram(program: InsertLoyaltyProgram): Observable<LoyaltyProgram> {
    if (this.loyaltyProgram) {
      this.loyaltyProgram = {
        ...this.loyaltyProgram,
        ...program,
        updatedAt: new Date()
      };
    } else {
      this.loyaltyProgram = {
        id: '1',
        ...program,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    return of(this.loyaltyProgram).pipe(delay(500));
  }

  getLoyaltyRewards(): Observable<LoyaltyReward[]> {
    return of(this.loyaltyRewards).pipe(delay(300));
  }

  createLoyaltyReward(reward: InsertLoyaltyReward): Observable<LoyaltyReward> {
    const isPercentage = reward.rewardType === 'discount_percentage';
    const newReward: LoyaltyReward = {
      id: this.rewardIdCounter.toString(),
      ...reward,
      pointsRequired: reward.pointsCost,
      isPercentage: isPercentage,
      createdAt: new Date()
    };
    this.rewardIdCounter++;
    this.loyaltyRewards.push(newReward);
    return of(newReward).pipe(delay(500));
  }

  updateLoyaltyReward(id: string, reward: Partial<InsertLoyaltyReward>): Observable<LoyaltyReward> {
    const index = this.loyaltyRewards.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Reward with id ${id} not found`);
    }
    this.loyaltyRewards[index] = { ...this.loyaltyRewards[index], ...reward };
    return of(this.loyaltyRewards[index]).pipe(delay(400));
  }

  deleteLoyaltyReward(id: string): Observable<void> {
    const index = this.loyaltyRewards.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Reward with id ${id} not found`);
    }
    this.loyaltyRewards.splice(index, 1);
    return of(undefined).pipe(delay(300));
  }

  getUserLoyaltyPoints(userId: string): Observable<UserLoyaltyPoints> {
    let userPoints = this.userLoyaltyData.get(userId);
    
    if (!userPoints) {
      userPoints = {
        userId,
        totalPoints: 0,
        availablePoints: 0,
        usedPoints: 0,
        currentTier: 'Bronze',
        tierProgress: 0,
        history: []
      };
      this.userLoyaltyData.set(userId, userPoints);
    }

    return of(userPoints).pipe(delay(300));
  }

  redeemReward(userId: string, rewardId: string): Observable<RedeemedReward> {
    const reward = this.loyaltyRewards.find(r => r.id === rewardId);
    if (!reward) {
      throw new Error(`Reward with id ${rewardId} not found`);
    }

    if (!reward.isActive) {
      throw new Error('This reward is no longer active');
    }

    let userPoints = this.userLoyaltyData.get(userId);
    if (!userPoints) {
      throw new Error('User loyalty data not found');
    }

    const pointsCost = reward.pointsCost || 0;
    if (userPoints.availablePoints < pointsCost) {
      throw new Error('Insufficient points');
    }

    userPoints.availablePoints -= pointsCost;
    userPoints.usedPoints += pointsCost;

    const transaction: LoyaltyTransaction = {
      id: this.transactionIdCounter.toString(),
      userId,
      type: 'spent',
      points: -pointsCost,
      description: `Wymiana na: ${reward.name}`,
      rewardId,
      createdAt: new Date()
    };
    this.transactionIdCounter++;
    userPoints.history.push(transaction);

    const code = `LOYALTY${reward.rewardValue}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const redeemedReward: RedeemedReward = {
      id: this.redeemedRewardIdCounter.toString(),
      userId,
      rewardId,
      reward,
      pointsSpent: pointsCost,
      code,
      isUsed: false,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      createdAt: new Date()
    };
    this.redeemedRewardIdCounter++;
    this.redeemedRewards.push(redeemedReward);

    return of(redeemedReward).pipe(delay(500));
  }

  getMyRedeemedRewards(userId: string): Observable<RedeemedReward[]> {
    const userRewards = this.redeemedRewards.filter(r => r.userId === userId);
    return of(userRewards).pipe(delay(300));
  }

  private addLoyaltyPointsForOrder(userId: string, orderId: string, totalPrice: number): void {
    if (!this.loyaltyProgram || !this.loyaltyProgram.isActive) {
      return;
    }

    const points = Math.floor(totalPrice * this.loyaltyProgram.pointsPerZloty);
    
    let userPoints = this.userLoyaltyData.get(userId);
    if (!userPoints) {
      userPoints = {
        userId,
        totalPoints: 0,
        availablePoints: 0,
        usedPoints: 0,
        currentTier: 'Bronze',
        tierProgress: 0,
        history: []
      };
      this.userLoyaltyData.set(userId, userPoints);
    }

    userPoints.totalPoints += points;
    userPoints.availablePoints += points;

    const transaction: LoyaltyTransaction = {
      id: this.transactionIdCounter.toString(),
      userId,
      type: 'earned',
      points,
      description: `Punkty za zamówienie #${orderId}`,
      orderId,
      createdAt: new Date()
    };
    this.transactionIdCounter++;
    userPoints.history.push(transaction);

    if (userPoints.totalPoints >= 3000) {
      userPoints.currentTier = 'Gold';
      userPoints.tierProgress = Math.min(100, ((userPoints.totalPoints - 3000) / 2000) * 100);
    } else if (userPoints.totalPoints >= 1000) {
      userPoints.currentTier = 'Silver';
      userPoints.tierProgress = ((userPoints.totalPoints - 1000) / 2000) * 100;
    } else {
      userPoints.currentTier = 'Bronze';
      userPoints.tierProgress = (userPoints.totalPoints / 1000) * 100;
    }
  }
}
