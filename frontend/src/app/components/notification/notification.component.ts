import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Notification, NotificationType } from '../../models';

@Component({
  selector: 'bg-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container fixed top-4 right-4 z-50 space-y-2">
      <div
        *ngFor="let notification of notifications; trackBy: trackByNotificationId"
        class="notification-item flex items-center max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 overflow-hidden transform transition-all duration-300 ease-in-out"
        [class]="getNotificationClasses(notification.type)"
        role="alert"
        [attr.aria-live]="notification.type === notificationTypes.ERROR ? 'assertive' : 'polite'"
      >
        <div class="flex-shrink-0 p-4">
          <div class="w-6 h-6 flex items-center justify-center">
            <!-- Success Icon -->
            <svg
              *ngIf="notification.type === notificationTypes.SUCCESS"
              class="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            
            <!-- Error Icon -->
            <svg
              *ngIf="notification.type === notificationTypes.ERROR"
              class="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
            
            <!-- Warning Icon -->
            <svg
              *ngIf="notification.type === notificationTypes.WARNING"
              class="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
              ></path>
            </svg>
            
            <!-- Info Icon -->
            <svg
              *ngIf="notification.type === notificationTypes.INFO"
              class="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
        </div>
        
        <div class="flex-1 p-4 pl-0">
          <p class="text-sm text-gray-800 font-medium">{{ notification.message }}</p>
        </div>
        
        <div class="flex-shrink-0 p-2">
          <button
            type="button"
            class="inline-flex rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
            (click)="dismissNotification(notification.id)"
            [attr.aria-label]="'Dismiss notification: ' + notification.message"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      max-height: calc(100vh - 2rem);
      overflow-y: auto;
      /* Prevent horizontal scrollbar on page from slide-in animation */
      overflow-x: hidden;
    }
    
    .notification-item {
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  notificationTypes = NotificationType;
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(
      notifications => this.notifications = notifications
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  dismissNotification(id: string): void {
    this.notificationService.dismiss(id);
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }

  getNotificationClasses(type: NotificationType): string {
    const baseClasses = 'notification-item';
    
    switch (type) {
      case NotificationType.SUCCESS:
        return `${baseClasses} border-green-500`;
      case NotificationType.ERROR:
        return `${baseClasses} border-red-500`;
      case NotificationType.WARNING:
        return `${baseClasses} border-yellow-500`;
      case NotificationType.INFO:
      default:
        return `${baseClasses} border-blue-500`;
    }
  }
}