import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ModalService, Modal } from '../../services/modal.service';

@Component({
  selector: 'app-modal-container',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] space-y-3 max-w-md">
      @for (modal of modals$ | async; track modal.id) {
        <div 
          class="bg-white border rounded-lg shadow-2xl p-4 animate-slide-in-right"
          [class.border-green-500]="modal.type === 'success'"
          [class.border-red-500]="modal.type === 'error'"
          [class.border-blue-500]="modal.type === 'info'"
          [class.border-yellow-500]="modal.type === 'confirm'"
        >
          <!-- Header -->
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <!-- Icon based on type -->
              @if (modal.type === 'success') {
                <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              }
              @if (modal.type === 'error') {
                <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              }
              @if (modal.type === 'info') {
                <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              }
              @if (modal.type === 'confirm') {
                <svg class="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              }
              <h3 class="font-semibold text-gray-900">{{ modal.title }}</h3>
            </div>
            @if (modal.type !== 'confirm') {
              <button 
                (click)="closeModal(modal.id)"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            }
          </div>

          <!-- Message -->
          <p class="text-gray-600 text-sm whitespace-pre-line mb-3">{{ modal.message }}</p>

          <!-- Buttons for confirm type -->
          @if (modal.type === 'confirm') {
            <div class="flex gap-2 justify-end">
              <button
                (click)="modal.onCancel?.()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {{ modal.cancelText || ('COMMON.CANCEL' | translate) }}
              </button>
              <button
                (click)="modal.onConfirm?.()"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {{ modal.confirmText || ('COMMON.CONFIRM' | translate) }}
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in-right {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .animate-slide-in-right {
      animation: slide-in-right 0.3s ease-out;
    }
  `]
})
export class ModalContainerComponent {
  modals$ = this.modalService.modals$;

  constructor(private modalService: ModalService) {}

  closeModal(id: string): void {
    this.modalService.closeModal(id);
  }
}
