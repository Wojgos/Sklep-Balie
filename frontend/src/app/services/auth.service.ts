import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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

    // Attempt to load user profile on startup if token exists
    if (this.getToken()) {
      this.loadCurrentUser().subscribe({
        error: () => this.logout() // Logout if token is invalid
      });
    }
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
    // Map username to email if the backend requires email
    const loginData = {
      email: credentials.username, // Assuming username field contains email
      password: credentials.password
    };

    return this.http.post<any>(`${this.AUTH_URL}/login/`, loginData).pipe(
      tap(response => {
        // Store tokens
        const accessToken = response.access || response.token;
        const refreshToken = response.refresh;
        
        if (accessToken) {
          this.setTokens(accessToken, refreshToken);
        }
      }),
      switchMap(response => {
        // If backend returns user object, use it. Otherwise fetch it.
        if (response.user) {
          this.setStoredUser(response.user);
          this.currentUserSubject.next(response.user);
          return of(response);
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
        // If we get a 400 Bad Request, it might be "Unable to log in with provided credentials."
        // or "E-mail is not verified."
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
    // Map frontend model to backend expectations
    const registerData = {
      username: userData.username,
      email: userData.email,
      password1: userData.password, // Changed from 'password' to 'password1' as per error message
      password2: userData.confirmPassword, // dj-rest-auth expects password2 for confirmation
      first_name: userData.firstName,
      last_name: userData.lastName
      // Note: phone, address etc. are not currently supported by backend registration serializer
    };

    return this.http.post<any>(`${this.AUTH_URL}/registration/`, registerData).pipe(
      tap(response => {
        // Store tokens if returned immediately (usually not for email verification flow)
        const accessToken = response.access || response.token;
        const refreshToken = response.refresh;
        
        if (accessToken) {
          this.setTokens(accessToken, refreshToken);
        }
      }),
      switchMap(response => {
         // If backend returns user object, use it. 
         if (response.user) {
            this.setStoredUser(response.user);
            this.currentUserSubject.next(response.user);
            return of(response);
         } else if (this.getToken()) {
            // If we somehow got a token but no user, try to fetch user
            return this.loadCurrentUser().pipe(
              map(user => ({
                token: this.getToken() || '',
                user: user,
                ...response // Keep original response data
              }))
            );
         } else {
            // If no token returned (email verification needed), just return the response
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
    // Using USERS_URL/profile/ to get loyalty points and full profile
    return this.http.get<User>(`${this.USERS_URL}/profile/`).pipe(
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
    // Using AUTH_URL/user/ for updates as profile view is read-only
    return this.http.patch<User>(`${this.AUTH_URL}/user/`, userData).pipe(
      tap(updatedUser => {
        this.setStoredUser(updatedUser);
        this.currentUserSubject.next(updatedUser);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.AUTH_URL}/password/change/`, {
      old_password: currentPassword,
      new_password: newPassword
    });
  }

  getToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private setTokens(accessToken: string, refreshToken?: string): void {
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
}
