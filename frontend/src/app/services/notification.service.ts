import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification, NotificationType } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private timeouts = new Map<string, number>();

  constructor() {}

  get notifications$(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  /**
   * Add a new notification
   * @param message - The notification message
   * @param type - The notification type (success, error, warning, info)
   * @param duration - Auto-dismiss duration in milliseconds (default: 5000, set to null for manual dismiss only)
   */
  show(message: string, type: NotificationType = NotificationType.INFO, duration: number | null = 5000): string {
    const id = this.generateId();
    const notification: Notification = {
      id,
      message,
      type,
      duration: duration || undefined,
      createdAt: new Date()
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    // Set auto-dismiss timer if duration is specified
    if (duration !== null && duration > 0) {
      const timeout = window.setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timeouts.set(id, timeout);
    }

    return id;
  }

  /**
   * Show a success notification
   */
  showSuccess(message: string, duration: number | null = 5000): string {
    return this.show(message, NotificationType.SUCCESS, duration);
  }

  /**
   * Show an error notification
   */
  showError(message: string, duration: number | null = 8000): string {
    return this.show(message, NotificationType.ERROR, duration);
  }

  /**
   * Show a warning notification
   */
  showWarning(message: string, duration: number | null = 6000): string {
    return this.show(message, NotificationType.WARNING, duration);
  }

  /**
   * Show an info notification
   */
  showInfo(message: string, duration: number | null = 5000): string {
    return this.show(message, NotificationType.INFO, duration);
  }

  /**
   * Dismiss a specific notification by ID
   */
  dismiss(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(notification => notification.id !== id);
    this.notificationsSubject.next(filteredNotifications);

    // Clear the timeout if it exists
    const timeout = this.timeouts.get(id);
    if (timeout) {
      window.clearTimeout(timeout);
      this.timeouts.delete(id);
    }
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    this.notificationsSubject.next([]);
    
    // Clear all timeouts
    this.timeouts.forEach((timeout) => window.clearTimeout(timeout));
    this.timeouts.clear();
  }

  /**
   * Get current notifications array
   */
  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Generate a unique ID for notifications
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}