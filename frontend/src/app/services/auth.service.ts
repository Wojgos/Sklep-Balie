import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, delay } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  // Mock users database (in real app this would be backend)
  private mockUsers: (User & { password: string })[] = [
    {
      id: '1',
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+48 123 456 789',
      address: 'ul. Przykładowa 1',
      city: 'Warszawa',
      postalCode: '00-001',
      role: 'admin',
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2',
      username: 'user',
      email: 'user@example.com',
      password: 'user123',
      firstName: 'Jan',
      lastName: 'Kowalski',
      phone: '+48 987 654 321',
      address: 'ul. Testowa 10',
      city: 'Kraków',
      postalCode: '30-001',
      role: 'user',
      createdAt: new Date('2024-02-01')
    }
  ];

  constructor() {
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.currentUserValue && !!this.getToken();
  }

  public get isAdmin(): boolean {
    return this.isAuthenticated && this.currentUserValue?.role === 'admin';
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Simulate API call
    return of(null).pipe(
      delay(500), // Simulate network delay
      map(() => {
        const user = this.mockUsers.find(
          u => u.username === credentials.username && u.password === credentials.password
        );

        if (!user) {
          throw new Error('Nieprawidłowa nazwa użytkownika lub hasło');
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        
        // Generate mock token
        const token = this.generateMockToken(user.id);
        
        const response: LoginResponse = {
          user: userWithoutPassword,
          token
        };

        // Store auth data
        this.setAuthData(response);

        return response;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterRequest): Observable<LoginResponse> {
    // Simulate API call
    return of(null).pipe(
      delay(500), // Simulate network delay
      map(() => {
        // Validate passwords match
        if (userData.password !== userData.confirmPassword) {
          throw new Error('Hasła nie są zgodne');
        }

        // Check if username already exists
        if (this.mockUsers.some(u => u.username === userData.username)) {
          throw new Error('Nazwa użytkownika jest już zajęta');
        }

        // Check if email already exists
        if (this.mockUsers.some(u => u.email === userData.email)) {
          throw new Error('Adres email jest już zarejestrowany');
        }

        // Create new user
        const newUser: User & { password: string } = {
          id: (this.mockUsers.length + 1).toString(),
          username: userData.username,
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          address: userData.address,
          city: userData.city,
          postalCode: userData.postalCode,
          role: 'user',
          createdAt: new Date()
        };

        // Add to mock database
        this.mockUsers.push(newUser);

        // Remove password from response
        const { password, ...userWithoutPassword } = newUser;
        
        // Generate mock token
        const token = this.generateMockToken(newUser.id);
        
        const response: LoginResponse = {
          user: userWithoutPassword,
          token
        };

        // Store auth data
        this.setAuthData(response);

        return response;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    // Clear auth data
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  updateUserProfile(userData: Partial<User>): Observable<User> {
    // Simulate API call
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentUser = this.currentUserValue;
        if (!currentUser) {
          throw new Error('Użytkownik nie jest zalogowany');
        }

        // Update user in mock database
        const userIndex = this.mockUsers.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
          const updatedUser = { 
            ...this.mockUsers[userIndex], 
            ...userData 
          };
          this.mockUsers[userIndex] = updatedUser;
          
          // Remove password from response
          const { password, ...userWithoutPassword } = updatedUser;
          
          // Update stored user
          this.setStoredUser(userWithoutPassword);
          this.currentUserSubject.next(userWithoutPassword);
          
          return userWithoutPassword;
        }

        throw new Error('Nie znaleziono użytkownika');
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    // Simulate API call
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentUser = this.currentUserValue;
        if (!currentUser) {
          throw new Error('Użytkownik nie jest zalogowany');
        }

        // Find user and verify current password
        const userIndex = this.mockUsers.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
          if (this.mockUsers[userIndex].password !== currentPassword) {
            throw new Error('Nieprawidłowe obecne hasło');
          }
          
          // Update password
          this.mockUsers[userIndex].password = newPassword;
          return;
        }

        throw new Error('Nie znaleziono użytkownika');
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setAuthData(response: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    this.setStoredUser(response.user);
    this.currentUserSubject.next(response.user);
  }

  private setStoredUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  private generateMockToken(userId: string): string {
    return btoa(`${userId}:${Date.now()}`);
  }
}

