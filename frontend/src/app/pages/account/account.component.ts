import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { User, Order, NotificationType } from '../../models';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
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
    private notificationService: NotificationService
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

  loadOrders(): void {
    this.isLoadingOrders = true;
    this.apiService.getOrders().subscribe({
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
      this.notificationService.show('Proszę wypełnić wszystkie wymagane pola', NotificationType.WARNING);
      return;
    }

    this.isSavingProfile = true;

    this.authService.updateUserProfile(this.editedUser).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.editedUser = { ...user };
        this.isEditingProfile = false;
        this.isSavingProfile = false;
        this.notificationService.show('Profil został zaktualizowany', NotificationType.SUCCESS);
      },
      error: (error) => {
        this.isSavingProfile = false;
        this.notificationService.show(
          error.message || 'Wystąpił błąd podczas aktualizacji profilu',
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
      this.notificationService.show('Proszę wypełnić wszystkie pola', NotificationType.WARNING);
      return;
    }

    if (this.passwordData.newPassword.length < 6) {
      this.notificationService.show('Nowe hasło musi mieć co najmniej 6 znaków', NotificationType.WARNING);
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.notificationService.show('Nowe hasła nie są zgodne', NotificationType.WARNING);
      return;
    }

    this.authService.changePassword(
      this.passwordData.currentPassword,
      this.passwordData.newPassword
    ).subscribe({
      next: () => {
        this.notificationService.show('Hasło zostało zmienione', NotificationType.SUCCESS);
        this.togglePasswordChange();
      },
      error: (error) => {
        this.notificationService.show(
          error.message || 'Wystąpił błąd podczas zmiany hasła',
          NotificationType.ERROR
        );
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.notificationService.show('Zostałeś wylogowany', NotificationType.INFO);
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
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Oczekujące';
      case 'processing':
        return 'Przetwarzane';
      case 'shipped':
        return 'Wysłane';
      case 'completed':
        return 'Dostarczone';
      case 'cancelled':
        return 'Anulowane';
      default:
        return status;
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) {
      return 'Brak danych';
    }
    const d = new Date(date);
    return d.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

