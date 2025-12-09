import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Modal {
  id: string;
  type: 'success' | 'error' | 'confirm' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalsSubject = new BehaviorSubject<Modal[]>([]);
  public modals$ = this.modalsSubject.asObservable();

  private generateId(): string {
    return `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  showSuccess(message: string, title: string = 'Sukces'): void {
    const modal: Modal = {
      id: this.generateId(),
      type: 'success',
      title,
      message
    };
    this.addModal(modal);
    
    // Auto-close after 3 seconds
    setTimeout(() => this.closeModal(modal.id), 3000);
  }

  showError(message: string, title: string = 'Błąd'): void {
    const modal: Modal = {
      id: this.generateId(),
      type: 'error',
      title,
      message
    };
    this.addModal(modal);
    
    // Auto-close after 5 seconds
    setTimeout(() => this.closeModal(modal.id), 5000);
  }

  showInfo(message: string, title: string = 'Informacja'): void {
    const modal: Modal = {
      id: this.generateId(),
      type: 'info',
      title,
      message
    };
    this.addModal(modal);
    
    // Auto-close after 3 seconds
    setTimeout(() => this.closeModal(modal.id), 3000);
  }

  showConfirm(message: string, title: string = 'Potwierdź akcję'): Promise<boolean> {
    return new Promise((resolve) => {
      const modal: Modal = {
        id: this.generateId(),
        type: 'confirm',
        title,
        message,
        confirmText: 'Tak',
        cancelText: 'Nie',
        onConfirm: () => {
          this.closeModal(modal.id);
          resolve(true);
        },
        onCancel: () => {
          this.closeModal(modal.id);
          resolve(false);
        }
      };
      this.addModal(modal);
    });
  }

  private addModal(modal: Modal): void {
    const currentModals = this.modalsSubject.value;
    this.modalsSubject.next([...currentModals, modal]);
  }

  closeModal(id: string): void {
    const currentModals = this.modalsSubject.value;
    this.modalsSubject.next(currentModals.filter(m => m.id !== id));
  }
}
