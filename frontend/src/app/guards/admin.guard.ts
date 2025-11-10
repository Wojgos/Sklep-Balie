import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../models';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  if (!authService.isAuthenticated) {
    // Not logged in - redirect to login page
    notificationService.show('Musisz być zalogowany, aby uzyskać dostęp do panelu administracyjnego', NotificationType.WARNING);
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (!authService.isAdmin) {
    // Logged in but not admin - show error and redirect to home
    notificationService.show('Nie masz uprawnień do dostępu do panelu administracyjnego', NotificationType.ERROR);
    router.navigate(['/']);
    return false;
  }

  // User is admin - allow access
  return true;
};

