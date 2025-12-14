import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_URL = 'http://localhost:8000/api/v1/auth';
  private readonly USERS_URL = 'http://localhost:8000/api/v1/users';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  constructor(private http: HttpClient) {
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public initializeSession(): void {
    this.restoreSessionFromStorage();
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
    const loginData = {
      email: credentials.username,
      password: credentials.password
    };

    return this.http.post<any>(`${this.AUTH_URL}/login/`, loginData).pipe(
      tap(response => {
        const accessToken = this.extractAccessToken(response);
        const refreshToken = this.extractRefreshToken(response);
        
        if (accessToken) {
          this.setTokens(accessToken, refreshToken);
        }
      }),
      switchMap(response => {
        if (response.user) {
          const transformedUser = this.transformBackendUser(response.user);
          this.setStoredUser(transformedUser);
          this.currentUserSubject.next(transformedUser);
          return of({
            ...response,
            user: transformedUser
          });
        } else {
          return this.loadCurrentUser().pipe(
            map(user => ({
              token: this.getToken() || '',
              user: user
            }))
          );
        }
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 400) {
            if (error.error?.non_field_errors) {
                 return throwError(() => new Error(error.error.non_field_errors[0]));
            }
             if (error.error?.email) {
                 return throwError(() => new Error(`Email: ${error.error.email[0]}`));
            }
        }
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterRequest): Observable<any> {
    const registerData = {
      username: userData.username,
      email: userData.email,
      password1: userData.password, 
      password2: userData.confirmPassword, 
      first_name: userData.firstName,
      last_name: userData.lastName
    };

    return this.http.post<any>(`${this.AUTH_URL}/registration/`, registerData).pipe(
      tap(response => {
        const accessToken = this.extractAccessToken(response);
        const refreshToken = this.extractRefreshToken(response);
        
        if (accessToken) {
          this.setTokens(accessToken, refreshToken);
        }
      }),
      switchMap(response => {
         if (response.user) {
            const transformedUser = this.transformBackendUser(response.user);
            this.setStoredUser(transformedUser);
            this.currentUserSubject.next(transformedUser);
            return of({
              ...response,
              user: transformedUser
            });
         } else if (this.getToken()) {
            return this.loadCurrentUser().pipe(
              map(user => ({
                token: this.getToken() || '',
                user: user,
                ...response 
              }))
            );
         } else {
            return of(response);
         }
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  verifyEmail(key: string): Observable<any> {
    return this.http.post<any>(`${this.AUTH_URL}/registration/verify-email/`, { key });
  }

  loadCurrentUser(): Observable<User> {
    return this.http.get<any>(`${this.USERS_URL}/profile/`, this.buildAuthHeaders()).pipe(
      map(backendUser => this.transformBackendUser(backendUser)),
      tap(user => {
        this.setStoredUser(user);
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  updateUserProfile(userData: Partial<User>): Observable<User> {
    const backendData = this.transformFrontendUser(userData);
    
    return this.http.patch<any>(`${this.AUTH_URL}/user/`, backendData, this.buildAuthHeaders()).pipe(
      map(backendUser => this.transformBackendUser(backendUser)),
      tap(updatedUser => {
        this.setStoredUser(updatedUser);
        this.currentUserSubject.next(updatedUser);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.AUTH_URL}/password/change/`, {
      old_password: currentPassword,
      new_password1: newPassword,
      new_password2: newPassword
    }, this.buildAuthHeaders());
  }

  getToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private setTokens(accessToken?: string | null, refreshToken?: string | null): void {
    if (!accessToken) {
      console.warn('AuthService: skipping empty access token from response.');
      return;
    }
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
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

  private extractAccessToken(response: any): string | null {
    return this.extractToken(response, ['access', 'access_token', 'token']);
  }

  private extractRefreshToken(response: any): string | null {
    return this.extractToken(response, ['refresh', 'refresh_token']);
  }

  private extractToken(response: any, keys: string[]): string | null {
    if (!response) {
      return null;
    }
    for (const key of keys) {
      const value = response[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
    return null;
  }

  private refreshTokens(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Brak tokenu odświeżania.'));
    }

    return this.http.post<any>(`${this.AUTH_URL}/token/refresh/`, { refresh: refreshToken }).pipe(
      tap(response => {
        const newAccessToken = this.extractAccessToken(response);
        const newRefreshToken = this.extractRefreshToken(response) || refreshToken;

        if (!newAccessToken) {
          throw new Error('Brak access tokenu w odpowiedzi refresh.');
        }

        this.setTokens(newAccessToken, newRefreshToken);
      }),
      map(() => void 0)
    );
  }

  private restoreSessionFromStorage(): void {
    if (!this.getToken()) {
      return;
    }

    this.loadCurrentUser().subscribe({
      error: (error) => this.handleSessionRestoreError(error)
    });
  }

  private handleSessionRestoreError(error: any): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.refreshTokens().subscribe({
        next: () => {
          this.loadCurrentUser().subscribe({
            error: () => this.logout()
          });
        },
        error: () => this.logout()
      });
      return;
    }

    console.warn('AuthService: nie udało się odświeżyć sesji, ale pozostawiamy lokalne dane.', error);
  }

  private buildAuthHeaders(): { headers?: HttpHeaders } {
    const token = this.getToken();
    if (!token) {
      return {};
    }

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }


  private transformBackendUser(backendUser: any): User {
    return {
      id: backendUser.id?.toString() || '',
      username: backendUser.username || '',
      email: backendUser.email || '',
      firstName: backendUser.first_name || '',
      lastName: backendUser.last_name || '',
      phone: backendUser.phone,
      address: backendUser.address,
      city: backendUser.city,
      postalCode: backendUser.postal_code,
      role: backendUser.is_staff ? 'admin' : 'user',
      createdAt: backendUser.date_joined ? new Date(backendUser.date_joined) : undefined
    };
  }
  
  private transformFrontendUser(frontendUser: Partial<User>): any {
    const backendData: any = {};
    
    if (frontendUser.firstName !== undefined) {
      backendData.first_name = frontendUser.firstName;
    }
    if (frontendUser.lastName !== undefined) {
      backendData.last_name = frontendUser.lastName;
    }
    if (frontendUser.email !== undefined) {
      backendData.email = frontendUser.email;
    }
    if (frontendUser.phone !== undefined) {
      backendData.phone = frontendUser.phone;
    }
    if (frontendUser.address !== undefined) {
      backendData.address = frontendUser.address;
    }
    if (frontendUser.city !== undefined) {
      backendData.city = frontendUser.city;
    }
    if (frontendUser.postalCode !== undefined) {
      backendData.postal_code = frontendUser.postalCode;
    }
    
    return backendData;
  }
}
