import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { LoginRequest, NotificationType } from '../../models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
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
    private notificationService: NotificationService,
    private translate: TranslateService
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
      this.notificationService.show(
        this.translate.instant('AUTH.FILL_ALL_FIELDS'), 
        NotificationType.WARNING
      );
      return;
    }

    this.isLoading = true;

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        const user = response.user;
        const name = user?.firstName || user?.username || this.translate.instant('AUTH.USER');
        
        this.notificationService.show(
          this.translate.instant('AUTH.WELCOME_BACK', { name }),
          NotificationType.SUCCESS
        );
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.isLoading = false;
        let message = this.translate.instant('AUTH.LOGIN_ERROR');
        if (error.message) {
          message = error.message;
        }
        
        this.notificationService.show(
          message,
          NotificationType.ERROR
        );
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
