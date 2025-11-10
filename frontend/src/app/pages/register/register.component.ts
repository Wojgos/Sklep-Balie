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
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/account']);
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
        this.notificationService.show(
          `Witaj ${response.user.firstName}! Twoje konto zostało utworzone.`,
          NotificationType.SUCCESS
        );
        this.router.navigate(['/account']);
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.show(
          error.message || 'Wystąpił błąd podczas rejestracji',
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

