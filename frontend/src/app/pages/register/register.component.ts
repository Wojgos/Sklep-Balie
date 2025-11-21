import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { RegisterRequest, NotificationType } from '../../models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  userData: RegisterRequest = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  };
  
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private Router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated) {
      this.Router.navigate(['/account']);
    }
  }

  onSubmit(): void {
    // Validate required fields
    if (!this.userData.username || !this.userData.email || 
        !this.userData.password || !this.userData.confirmPassword ||
        !this.userData.firstName || !this.userData.lastName) {
      this.notificationService.show('Proszę wypełnić wszystkie wymagane pola', NotificationType.WARNING);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.userData.email)) {
      this.notificationService.show('Proszę podać prawidłowy adres email', NotificationType.WARNING);
      return;
    }

    // Validate password length
    if (this.userData.password.length < 6) {
      this.notificationService.show('Hasło musi mieć co najmniej 6 znaków', NotificationType.WARNING);
      return;
    }

    // Validate passwords match
    if (this.userData.password !== this.userData.confirmPassword) {
      this.notificationService.show('Hasła nie są zgodne', NotificationType.WARNING);
      return;
    }

    this.isLoading = true;

    this.authService.register(this.userData).subscribe({
      next: (response) => {
        // If we got a user object back, use it for greeting
        const name = response.user?.firstName || this.userData.firstName;
        
        this.notificationService.show(
          `Witaj ${name}! Twoje konto zostało utworzone. Sprawdź email aby je aktywować.`,
          NotificationType.SUCCESS
        );
        // Navigate to login instead of account since email verification is likely needed
        this.Router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        
        // Try to extract meaningful error message
        let errorMessage = 'Wystąpił błąd podczas rejestracji';
        if (error.error) {
            if (typeof error.error === 'string') {
                errorMessage = error.error;
            } else if (error.error.detail) {
                errorMessage = error.error.detail;
            } else {
                // Handle field-specific errors (e.g. { email: ["Invalid"] })
                const firstKey = Object.keys(error.error)[0];
                if (firstKey && Array.isArray(error.error[firstKey])) {
                    errorMessage = `${firstKey}: ${error.error[firstKey][0]}`;
                }
            }
        }

        this.notificationService.show(
          errorMessage,
          NotificationType.ERROR
        );
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
