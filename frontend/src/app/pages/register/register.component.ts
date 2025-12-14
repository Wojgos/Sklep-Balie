import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { RegisterRequest, NotificationType } from '../../models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
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
    private notificationService: NotificationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.Router.navigate(['/account']);
    }
  }

  onSubmit(): void {
    if (!this.userData.username || !this.userData.email || 
        !this.userData.password || !this.userData.confirmPassword ||
        !this.userData.firstName || !this.userData.lastName) {
      this.notificationService.show(
        this.translate.instant('AUTH.FILL_REQUIRED_FIELDS'), 
        NotificationType.WARNING
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.userData.email)) {
      this.notificationService.show(
        this.translate.instant('AUTH.INVALID_EMAIL'), 
        NotificationType.WARNING
      );
      return;
    }

    if (this.userData.password.length < 6) {
      this.notificationService.show(
        this.translate.instant('AUTH.PASSWORD_MIN_LENGTH'), 
        NotificationType.WARNING
      );
      return;
    }

    if (this.userData.password !== this.userData.confirmPassword) {
      this.notificationService.show(
        this.translate.instant('AUTH.PASSWORDS_NOT_MATCH'), 
        NotificationType.WARNING
      );
      return;
    }

    this.isLoading = true;

    this.authService.register(this.userData).subscribe({
      next: (response) => {
        const name = response.user?.firstName || this.userData.firstName;
        
        this.notificationService.show(
          this.translate.instant('AUTH.REGISTER_SUCCESS', { name }),
          NotificationType.SUCCESS
        );
        this.Router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        
        let errorMessage = this.translate.instant('AUTH.REGISTER_ERROR');
        if (error.error) {
            if (typeof error.error === 'string') {
                errorMessage = error.error;
            } else if (error.error.detail) {
                errorMessage = error.error.detail;
            } else {
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
