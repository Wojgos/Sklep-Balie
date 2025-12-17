import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { MockDataService } from './mock-data.service';
import { AuthService } from './auth.service';
import { Product, Category, Order, PaginatedResponse } from '../models';
import { of } from 'rxjs';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let mockDataService: jasmine.SpyObj<MockDataService>;
  let authService: jasmine.SpyObj<AuthService>;

  const apiUrl = 'http://localhost:8000/api/v1';

  const mockBackendProduct = {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test description',
    available: true,
    category: 'electronics',
    category_id: 1,
    category_name: 'Electronics',
    variants: [
      {
        id: 1,
        product: 1,
        sku: 'TEST-001',
        name: 'Test Variant',
        price: '99.99',
        stock: 10,
        low_stock_threshold: 5,
        available: true,
        attributes_details: [],
        images: []
      }
    ],
    images: [
      {
        id: 1,
        image: '/media/products/test.jpg',
        alt_text: 'Test',
        is_main: true
      }
    ],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  };

  const mockBackendCategory = {
    id: 1,
    name: 'Electronics',
    slug: 'electronics',
    parent: null,
    product_count: 10,
    description: 'Electronic devices',
    image: '/media/categories/electronics.jpg'
  };

  const mockBackendOrder = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '123456789',
    address: 'Test Street 1',
    city: 'Test City',
    postal_code: '12-345',
    total_price: '99.99',
    status: 'pending',
    paid: false,
    tracking_number: null,
    notes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    items: []
  };

  beforeEach(() => {
    const mockDataServiceSpy = jasmine.createSpyObj('MockDataService', [
      'getProducts',
      'getCategories',
      'getCategory',
      'getProduct',
      'getProductsByCategory'
    ]);

    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken',
      'isAuthenticated'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        { provide: MockDataService, useValue: mockDataServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    mockDataService = TestBed.inject(MockDataService) as jasmine.SpyObj<MockDataService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Inicjalizacja', () => {
    it('powinien zostać utworzony', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('Pobieranie produktów - getProducts()', () => {
    it('powinien wykonać GET request na poprawny URL', (done) => {
      const mockResponse: PaginatedResponse<any> = {
        count: 1,
        next: null,
        previous: null,
        results: [mockBackendProduct]
      };

      service.getProducts(1, 10).subscribe(response => {
        expect(response.results.length).toBe(1);
        expect(response.results[0].name).toBe('Test Product');
        done();
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/shop/products/') && req.method === 'GET'
      );
      
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('page_size')).toBe('10');
      
      req.flush(mockResponse);
    });

    it('powinien przekazać parametry paginacji do URL', (done) => {
      const mockResponse: PaginatedResponse<any> = {
        count: 0,
        next: null,
        previous: null,
        results: []
      };

      service.getProducts(3, 25).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/shop/products/')
      );
      
      expect(req.request.params.get('page')).toBe('3');
      expect(req.request.params.get('page_size')).toBe('25');
      
      req.flush(mockResponse);
    });

    it('powinien zmapować produkt z backendu na format frontendowy', (done) => {
      const mockResponse: PaginatedResponse<any> = {
        count: 1,
        next: null,
        previous: null,
        results: [mockBackendProduct]
      };

      service.getProducts().subscribe(response => {
        const product = response.results[0];
        expect(product.id).toBe('test-product');
        expect(product.numericId).toBe(1);
        expect(product.name).toBe('Test Product');
        expect(product.price).toBe('99.99');
        expect(product.stock).toBe(10);
        done();
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/shop/products/')
      );
      req.flush(mockResponse);
    });

    it('powinien usunąć duplikaty produktów', (done) => {
      const mockResponse: PaginatedResponse<any> = {
        count: 2,
        next: null,
        previous: null,
        results: [
          mockBackendProduct,
          mockBackendProduct 
        ]
      };

      service.getProducts().subscribe(response => {
        expect(response.results.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/shop/products/')
      );
      req.flush(mockResponse);
    });
  });

  describe('Pobieranie kategorii - getCategories()', () => {
    it('powinien wykonać GET request dla kategorii', (done) => {
      const mockResponse: PaginatedResponse<any> = {
        count: 1,
        next: null,
        previous: null,
        results: [mockBackendCategory]
      };

      service.getCategories().subscribe(response => {
        expect(response.results.length).toBe(1);
        expect(response.results[0].name).toBe('Electronics');
        done();
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/shop/categories/')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('powinien zmapować kategorię z backendu na format frontendowy', (done) => {
      const mockResponse: PaginatedResponse<any> = {
        count: 1,
        next: null,
        previous: null,
        results: [mockBackendCategory]
      };

      service.getCategories().subscribe(response => {
        const category = response.results[0];
        expect(category.id).toBe('1');
        expect(category.name).toBe('Electronics');
        expect(category.slug).toBe('electronics');
        expect(category.productCount).toBe(10);
        done();
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/shop/categories/')
      );
      req.flush(mockResponse);
    });
  });

  describe('Pobieranie pojedynczego produktu - getProduct()', () => {
    it('powinien pobrać produkt po slug', (done) => {
      service.getProduct('test-product').subscribe(product => {
        expect(product.name).toBe('Test Product');
        expect(product.slug).toBe('test-product');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/shop/products/test-product/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBackendProduct);
    });

    it('powinien obsłużyć błąd 404 przez fallback do mock data', (done) => {
      mockDataService.getProduct.and.returnValue(of({
        id: 'non-existent',
        name: 'Mock Product',
        price: '99.99',
        stock: 10
      } as Product));

      service.getProduct('non-existent').subscribe({
        next: (product) => {
          expect(product).toBeDefined();
          expect(product.name).toBe('Mock Product');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/shop/products/non-existent/`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Tworzenie zamówienia - createOrder()', () => {
    it('powinien wysłać POST request z danymi zamówienia', (done) => {
      const orderData = {
        customerName: 'John Doe',
        email: 'john@example.com',
        phone: '123456789',
        address: 'Test Street 1',
        city: 'Test City',
        postalCode: '12-345',
        totalPrice: '99.99',
        notes: 'Test note',
        items: [
          {
            productId: '1',
            productName: 'Test Product',
            quantity: 1,
            price: '99.99',
            variantId: 1
          }
        ]
      };

      service.createOrder(orderData).subscribe(order => {
        expect(order.customerName).toBe('John Doe');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.first_name).toBe('John');
      expect(req.request.body.last_name).toBe('Doe');
      expect(req.request.body.email).toBe('john@example.com');
      req.flush(mockBackendOrder);
    });
  });

  describe('Wyszukiwanie produktów - searchProducts()', () => {
    it('powinien wysłać zapytanie z parametrem search', (done) => {
      const mockSearchResponse: PaginatedResponse<any> = {
        count: 1,
        next: null,
        previous: null,
        results: [mockBackendProduct]
      };

      service.searchProducts('laptop').subscribe(products => {
        expect(products.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/shop/search/') && req.url.includes('q=laptop')
      );
      req.flush(mockSearchResponse);
    });

    it('powinien obsłużyć puste wyniki wyszukiwania', (done) => {
      const mockSearchResponse: PaginatedResponse<any> = {
        count: 0,
        next: null,
        previous: null,
        results: []
      };

      service.searchProducts('nonexistent').subscribe(products => {
        expect(products.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/shop/search/')
      );
      req.flush(mockSearchResponse);
    });
  });

  describe('Filtrowanie produktów - getProductsByCategory()', () => {
    it('powinien filtrować produkty po kategorii', (done) => {
      const mockResponse: PaginatedResponse<any> = {
        count: 1,
        next: null,
        previous: null,
        results: [mockBackendProduct]
      };

      mockDataService.getProductsByCategory.and.returnValue(of([{
        id: '1',
        name: 'Electronics Product',
        price: '99.99',
        stock: 10,
        categoryId: 'electronics'
      } as Product]));

      service.getProductsByCategory('electronics').subscribe(products => {
        expect(products).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/shop/products/')
      );
      req.flush(mockResponse);
    });
  });

  describe('Obsługa błędów HTTP', () => {
    it('powinien obsłużyć błąd serwera 500 przez fallback do mock data', (done) => {
      mockDataService.getProduct.and.returnValue(of({
        id: 'test',
        name: 'Mock Product',
        price: '99.99',
        stock: 10
      } as Product));

      service.getProduct('test').subscribe({
        next: (product) => {
          expect(product).toBeDefined();
          expect(product.name).toBe('Mock Product');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/shop/products/test/`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('powinien obsłużyć błąd sieci przez fallback do mock data', (done) => {
      mockDataService.getProduct.and.returnValue(of({
        id: 'test',
        name: 'Mock Product',
        price: '99.99',
        stock: 10
      } as Product));

      service.getProduct('test').subscribe({
        next: (product) => {
          expect(product).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/shop/products/test/`);
      req.error(new ProgressEvent('network'), { status: 0, statusText: 'Unknown Error' });
    });
  });

  describe('Metody pomocnicze', () => {
    it('powinien zamienić obrazy na absolutne URL', (done) => {
      const mockResponse: PaginatedResponse<any> = {
        count: 1,
        next: null,
        previous: null,
        results: [mockBackendProduct]
      };

      service.getProducts().subscribe(response => {
        const product = response.results[0];
        expect(product.image).toContain('http://localhost:8000');
        done();
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/shop/products/')
      );
      req.flush(mockResponse);
    });

    it('powinien obsłużyć brak zdjęć produktu', (done) => {
      const productWithoutImages = {
        ...mockBackendProduct,
        images: []
      };

      const mockResponse: PaginatedResponse<any> = {
        count: 1,
        next: null,
        previous: null,
        results: [productWithoutImages]
      };

      service.getProducts().subscribe(response => {
        const product = response.results[0];
        expect(product.image).toBeDefined();
        expect(product.image.length).toBeGreaterThan(0);
        done();
      });

      const req = httpMock.expectOne(
        req => req.url.includes('/shop/products/')
      );
      req.flush(mockResponse);
    });
  });

  describe('Retry mechanism', () => {
    it('powinien ponowić żądanie w przypadku błędu', (done) => {
      let attemptCount = 0;

      service.getProducts().subscribe({
        next: (response) => {
          expect(attemptCount).toBeGreaterThan(1);
          expect(response.results.length).toBe(1);
          done();
        }
      });

      const req1 = httpMock.expectOne(req => req.url.includes('/shop/products/'));
      attemptCount++;
      req1.flush('Error', { status: 500, statusText: 'Server Error' });

      setTimeout(() => {
        const req2 = httpMock.expectOne(req => req.url.includes('/shop/products/'));
        attemptCount++;
        req2.flush({
          count: 1,
          next: null,
          previous: null,
          results: [mockBackendProduct]
        });
      }, 2100);
    }, 10000); 
  });
});
