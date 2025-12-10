import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { LanguageService } from '../../services/language.service';
import { User, Order, NotificationType } from '../../models';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentUser: User | null = null;
  activeTab: 'profile' | 'orders' | 'settings' = 'profile';
  
  // Profile edit
  isEditingProfile = false;
  editedUser: Partial<User> = {};
  isSavingProfile = false;

  // Password change
  isChangingPassword = false;
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Orders
  orders: Order[] = [];
  isLoadingOrders = false;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.editedUser = { ...user };
      }
    });

    // Check for tab query parameter
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && (tab === 'profile' || tab === 'orders' || tab === 'settings')) {
        this.activeTab = tab;
      }
    });

    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.isLoadingOrders = true;
    this.apiService.getAllOrders().subscribe({
      next: (orders) => {
        // Backend already filters orders for current user based on auth token
        this.orders = orders;
        console.log('📦 Loaded user orders:', orders.length);
        this.isLoadingOrders = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.isLoadingOrders = false;
      }
    });
  }

  setActiveTab(tab: 'profile' | 'orders' | 'settings'): void {
    this.activeTab = tab;
    if (tab === 'orders') {
      this.loadOrders();
    }
  }

  toggleEditProfile(): void {
    if (this.isEditingProfile) {
      // Cancel editing - reset to current user data
      this.editedUser = { ...this.currentUser };
    }
    this.isEditingProfile = !this.isEditingProfile;
  }

  saveProfile(): void {
    if (!this.editedUser.firstName || !this.editedUser.lastName || !this.editedUser.email) {
      this.notificationService.show(
        this.translate.instant('ACCOUNT.FILL_REQUIRED_FIELDS'), 
        NotificationType.WARNING
      );
      return;
    }

    this.isSavingProfile = true;

    this.authService.updateUserProfile(this.editedUser).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.editedUser = { ...user };
        this.isEditingProfile = false;
        this.isSavingProfile = false;
        this.notificationService.show(
          this.translate.instant('ACCOUNT.PROFILE_UPDATED'), 
          NotificationType.SUCCESS
        );
      },
      error: (error) => {
        this.isSavingProfile = false;
        this.notificationService.show(
          error.message || this.translate.instant('ACCOUNT.UPDATE_ERROR'),
          NotificationType.ERROR
        );
      }
    });
  }

  togglePasswordChange(): void {
    this.isChangingPassword = !this.isChangingPassword;
    if (!this.isChangingPassword) {
      this.passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    }
  }

  changePassword(): void {
    if (!this.passwordData.currentPassword || !this.passwordData.newPassword || !this.passwordData.confirmPassword) {
      this.notificationService.show(
        this.translate.instant('ACCOUNT.FILL_ALL_FIELDS'), 
        NotificationType.WARNING
      );
      return;
    }

    if (this.passwordData.newPassword.length < 6) {
      this.notificationService.show(
        this.translate.instant('ACCOUNT.PASSWORD_MIN_LENGTH'), 
        NotificationType.WARNING
      );
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.notificationService.show(
        this.translate.instant('ACCOUNT.PASSWORD_MISMATCH'), 
        NotificationType.WARNING
      );
      return;
    }

    this.authService.changePassword(
      this.passwordData.currentPassword,
      this.passwordData.newPassword
    ).subscribe({
      next: () => {
        this.notificationService.show(
          this.translate.instant('ACCOUNT.PASSWORD_CHANGED'), 
          NotificationType.SUCCESS
        );
        this.togglePasswordChange();
      },
      error: (error) => {
        this.notificationService.show(
          error.message || this.translate.instant('ACCOUNT.PASSWORD_CHANGE_ERROR'),
          NotificationType.ERROR
        );
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.notificationService.show(
      this.translate.instant('ACCOUNT.LOGGED_OUT'), 
      NotificationType.INFO
    );
    this.router.navigate(['/']);
  }

  getOrderStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'completed':
        return 'status-delivered'; // Keep CSS class name for styling
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getOrderStatusText(status: string): string {
    const statusKey = `ACCOUNT.ORDER_STATUS_${status.toUpperCase()}`;
    return this.translate.instant(statusKey);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) {
      return this.translate.instant('ACCOUNT.NO_DATA');
    }
    const d = new Date(date);
    const currentLang = this.languageService.getCurrentLanguage();
    return d.toLocaleDateString(currentLang === 'pl' ? 'pl-PL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

