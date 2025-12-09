import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

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
  private translate?: TranslateService;

  constructor(private injector: Injector) {}
  
  private initTranslate(): void {
    if (!this.translate) {
      this.translate = this.injector.get(TranslateService);
    }
  }

  private generateId(): string {
    return `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  showSuccess(message: string, title?: string): void {
    this.initTranslate();
    const modal: Modal = {
      id: this.generateId(),
      type: 'success',
      title: title || (this.translate ? this.translate.instant('MODAL.SUCCESS_TITLE') : 'Sukces'),
      message
    };
    this.addModal(modal);
    
    // Auto-close after 3 seconds
    setTimeout(() => this.closeModal(modal.id), 3000);
  }

  showError(message: string, title?: string): void {
    this.initTranslate();
    const modal: Modal = {
      id: this.generateId(),
      type: 'error',
      title: title || (this.translate ? this.translate.instant('MODAL.ERROR_TITLE') : 'Błąd'),
      message
    };
    this.addModal(modal);
    
    // Auto-close after 5 seconds
    setTimeout(() => this.closeModal(modal.id), 5000);
  }

  showInfo(message: string, title?: string): void {
    this.initTranslate();
    const modal: Modal = {
      id: this.generateId(),
      type: 'info',
      title: title || (this.translate ? this.translate.instant('MODAL.INFO_TITLE') : 'Informacja'),
      message
    };
    this.addModal(modal);
    
    // Auto-close after 3 seconds
    setTimeout(() => this.closeModal(modal.id), 3000);
  }

  showConfirm(message: string, title?: string): Promise<boolean> {
    this.initTranslate();
    return new Promise((resolve) => {
      const modal: Modal = {
        id: this.generateId(),
        type: 'confirm',
        title: title || (this.translate ? this.translate.instant('MODAL.CONFIRM_TITLE') : 'Potwierdź akcję'),
        message,
        confirmText: this.translate ? this.translate.instant('MODAL.DEFAULT_CONFIRM') : 'Tak',
        cancelText: this.translate ? this.translate.instant('MODAL.DEFAULT_CANCEL') : 'Nie',
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
