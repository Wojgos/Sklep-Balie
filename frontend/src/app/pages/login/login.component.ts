import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { LoginRequest, NotificationType } from '../../models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  credentials: LoginRequest = {
    username: '',
    password: ''
  };
  
  isLoading = false;
  returnUrl: string = '/';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/account']);
      return;
    }

    // Get return url from route parameters or default to home
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(): void {
    if (!this.credentials.username || !this.credentials.password) {
      this.notificationService.show('Proszę wypełnić wszystkie pola', NotificationType.WARNING);
      return;
    }

    this.isLoading = true;

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.notificationService.show(
          `Witaj ponownie, ${response.user.firstName}!`,
          NotificationType.SUCCESS
        );
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.show(
          error.message || 'Wystąpił błąd podczas logowania',
          NotificationType.ERROR
        );
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}

