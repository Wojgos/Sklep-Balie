import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { Product } from '../models';

describe('CartService', () => {
  let service: CartService;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  // Mock product data
  const mockProduct1: Product = {
    id: '1',
    numericId: 1,
    slug: 'test-product-1',
    name: 'Test Product 1',
    description: 'Test description 1',
    price: '99.99',
    oldPrice: null,
    rating: 4.5,
    categoryId: 'cat1',
    category: 'electronics',
    image: 'test1.jpg',
    stock: 10,
    createdAt: new Date(),
    available: true
  };

  const mockProduct2: Product = {
    id: '2',
    numericId: 2,
    slug: 'test-product-2',
    name: 'Test Product 2',
    description: 'Test description 2',
    price: '49.99',
    oldPrice: null,
    rating: 4.0,
    categoryId: 'cat2',
    category: 'clothing',
    image: 'test2.jpg',
    stock: 5,
    createdAt: new Date(),
    available: true
  };

  beforeEach(() => {
    // Mock localStorage
    let store: { [key: string]: string } = {};
    
    const mockLocalStorage = {
      getItem: (key: string): string | null => {
        return key in store ? store[key] : null;
      },
      setItem: (key: string, value: string): void => {
        store[key] = value;
      },
      removeItem: (key: string): void => {
        delete store[key];
      },
      clear: (): void => {
        store = {};
      }
    };

    spyOn(localStorage, 'getItem').and.callFake(mockLocalStorage.getItem);
    spyOn(localStorage, 'setItem').and.callFake(mockLocalStorage.setItem);
    spyOn(localStorage, 'removeItem').and.callFake(mockLocalStorage.removeItem);
    spyOn(localStorage, 'clear').and.callFake(mockLocalStorage.clear);

    TestBed.configureTestingModule({
      providers: [CartService]
    });
    
    service = TestBed.inject(CartService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Inicjalizacja', () => {
    it('powinien zostać utworzony', () => {
      expect(service).toBeTruthy();
    });

    it('powinien załadować pusty koszyk gdy localStorage jest pusty', (done) => {
      service.cart$.subscribe(items => {
        expect(items).toEqual([]);
        done();
      });
    });

    it('powinien załadować koszyk z localStorage', () => {
      // Setup: Pre-populate localStorage
      const savedCart = JSON.stringify([
        { product: mockProduct1, quantity: 2 }
      ]);
      localStorage.setItem('cart', savedCart);

      // Create new service instance to trigger loading from storage
      const newService = new CartService();
      
      newService.cart$.subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].product.id).toBe('1');
        expect(items[0].quantity).toBe(2);
      });
    });

    it('powinien obsłużyć nieprawidłowe dane w localStorage', (done) => {
      localStorage.setItem('cart', 'invalid json data');
      
      // Create new service instance
      const newService = new CartService();
      
      newService.cart$.subscribe(items => {
        expect(items).toEqual([]);
        done();
      });
    });
  });

  describe('Dodawanie produktów', () => {
    it('powinien dodać nowy produkt z ilością 1', (done) => {
      service.addItem(mockProduct1);
      
      service.cart$.subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].product.id).toBe('1');
        expect(items[0].quantity).toBe(1);
        done();
      });
    });

    it('powinien dodać nowy produkt z określoną ilością', (done) => {
      service.addItem(mockProduct1, 3);
      
      service.cart$.subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].quantity).toBe(3);
        done();
      });
    });

    it('powinien zwiększyć ilość istniejącego produktu', (done) => {
      service.addItem(mockProduct1, 2);
      service.addItem(mockProduct1, 3);
      
      service.cart$.subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].quantity).toBe(5);
        done();
      });
    });

    it('powinien dodać różne produkty do koszyka', (done) => {
      service.addItem(mockProduct1);
      service.addItem(mockProduct2);
      
      service.cart$.subscribe(items => {
        expect(items.length).toBe(2);
        expect(items[0].product.id).toBe('1');
        expect(items[1].product.id).toBe('2');
        done();
      });
    });

    it('powinien emitować event po dodaniu produktu', (done) => {
      service.itemAdded$.subscribe(product => {
        expect(product.id).toBe('1');
        done();
      });
      
      service.addItem(mockProduct1);
    });

    it('powinien zapisać do localStorage po dodaniu', () => {
      service.addItem(mockProduct1);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'cart',
        jasmine.any(String)
      );
    });
  });

  describe('Usuwanie produktów', () => {
    beforeEach(() => {
      service.addItem(mockProduct1);
      service.addItem(mockProduct2);
    });

    it('powinien usunąć produkt z koszyka', (done) => {
      service.removeItem('1');
      
      service.cart$.subscribe(items => {
        expect(items.length).toBe(1);
        expect(items[0].product.id).toBe('2');
        done();
      });
    });

    it('nie powinien zmienić koszyka gdy produkt nie istnieje', (done) => {
      service.removeItem('999');
      
      service.cart$.subscribe(items => {
        expect(items.length).toBe(2);
        done();
      });
    });

    it('powinien zapisać zmiany do localStorage po usunięciu', () => {
      const setItemCalls = (localStorage.setItem as jasmine.Spy).calls.count();
      service.removeItem('1');
      
      expect((localStorage.setItem as jasmine.Spy).calls.count()).toBeGreaterThan(setItemCalls);
    });
  });

  describe('Aktualizacja ilości', () => {
    beforeEach(() => {
      service.addItem(mockProduct1, 1);
    });

    it('powinien zaktualizować ilość produktu', (done) => {
      service.updateQuantity('1', 5);
      
      service.cart$.subscribe(items => {
        expect(items[0].quantity).toBe(5);
        done();
      });
    });

    it('powinien usunąć produkt gdy ilość wynosi 0', (done) => {
      service.updateQuantity('1', 0);
      
      service.cart$.subscribe(items => {
        expect(items.length).toBe(0);
        done();
      });
    });

    it('powinien usunąć produkt gdy ilość jest ujemna', (done) => {
      service.updateQuantity('1', -5);
      
      service.cart$.subscribe(items => {
        expect(items.length).toBe(0);
        done();
      });
    });

    it('nie powinien zmienić koszyka gdy produkt nie istnieje', (done) => {
      const initialLength = service.getItems().length;
      service.updateQuantity('999', 10);
      
      service.cart$.subscribe(items => {
        expect(items.length).toBe(initialLength);
        done();
      });
    });
  });

  describe('Obliczenia - itemCount$', () => {
    it('powinien zwrócić 0 dla pustego koszyka', (done) => {
      service.itemCount$.subscribe(count => {
        expect(count).toBe(0);
        done();
      });
    });

    it('powinien policzyć sumę wszystkich sztuk', (done) => {
      service.addItem(mockProduct1, 2);
      service.addItem(mockProduct2, 3);
      
      service.itemCount$.subscribe(count => {
        expect(count).toBe(5);
        done();
      });
    });

    it('powinien zaktualizować licznik po zmianie ilości', (done) => {
      service.addItem(mockProduct1, 2);
      service.updateQuantity('1', 10);
      
      service.itemCount$.subscribe(count => {
        expect(count).toBe(10);
        done();
      });
    });
  });

  describe('Obliczenia - totalPrice$', () => {
    it('powinien zwrócić 0 dla pustego koszyka', (done) => {
      service.totalPrice$.subscribe(total => {
        expect(total).toBe(0);
        done();
      });
    });

    it('powinien obliczyć całkowitą cenę dla jednego produktu', (done) => {
      service.addItem(mockProduct1, 2); // 99.99 * 2 = 199.98
      
      service.totalPrice$.subscribe(total => {
        expect(total).toBeCloseTo(199.98, 2);
        done();
      });
    });

    it('powinien obliczyć całkowitą cenę dla wielu produktów', (done) => {
      service.addItem(mockProduct1, 2); // 99.99 * 2 = 199.98
      service.addItem(mockProduct2, 3); // 49.99 * 3 = 149.97
      // Total: 349.95
      
      service.totalPrice$.subscribe(total => {
        expect(total).toBeCloseTo(349.95, 2);
        done();
      });
    });

    it('powinien zaktualizować cenę po zmianie ilości', (done) => {
      service.addItem(mockProduct1, 1);
      service.updateQuantity('1', 5);
      
      service.totalPrice$.subscribe(total => {
        expect(total).toBeCloseTo(499.95, 2);
        done();
      });
    });
  });

  describe('Czyszczenie koszyka', () => {
    beforeEach(() => {
      service.addItem(mockProduct1);
      service.addItem(mockProduct2);
    });

    it('powinien wyczyścić cały koszyk', (done) => {
      service.clearCart();
      
      service.cart$.subscribe(items => {
        expect(items.length).toBe(0);
        done();
      });
    });

    it('powinien zapisać pusty koszyk do localStorage', () => {
      service.clearCart();
      
      expect(localStorage.setItem).toHaveBeenCalledWith('cart', '[]');
    });

    it('itemCount$ powinien zwrócić 0 po wyczyszczeniu', (done) => {
      service.clearCart();
      
      service.itemCount$.subscribe(count => {
        expect(count).toBe(0);
        done();
      });
    });

    it('totalPrice$ powinien zwrócić 0 po wyczyszczeniu', (done) => {
      service.clearCart();
      
      service.totalPrice$.subscribe(total => {
        expect(total).toBe(0);
        done();
      });
    });
  });

  describe('Metody synchroniczne', () => {
    beforeEach(() => {
      service.addItem(mockProduct1, 2);
      service.addItem(mockProduct2, 3);
    });

    it('getItems() powinien zwrócić aktualną zawartość koszyka', () => {
      const items = service.getItems();
      expect(items.length).toBe(2);
      expect(items[0].product.id).toBe('1');
      expect(items[1].product.id).toBe('2');
    });

    it('getItemCount() powinien zwrócić całkowitą liczbę sztuk', () => {
      const count = service.getItemCount();
      expect(count).toBe(5);
    });

    it('getTotalPrice() powinien zwrócić całkowitą cenę', () => {
      const total = service.getTotalPrice();
      expect(total).toBeCloseTo(349.95, 2);
    });
  });
});
