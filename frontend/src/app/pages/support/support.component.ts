import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { Ticket, InsertTicket, TicketReply } from '../../models';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-muted/30 py-8">
      <div class="container mx-auto px-4 max-w-6xl">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-foreground">Moje zgłoszenia</h1>
            <p class="text-muted-foreground mt-2">Zarządzaj swoimi zgłoszeniami do obsługi klienta</p>
          </div>
          <button
            (click)="showCreateForm = true"
            class="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Nowe zgłoszenie
          </button>
        </div>

        <!-- Create Ticket Form Modal -->
        <div 
          *ngIf="showCreateForm"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          (click)="showCreateForm = false"
        >
          <div 
            class="bg-background rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            (click)="$event.stopPropagation()"
          >
            <div class="p-6">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-foreground">Nowe zgłoszenie</h2>
                <button
                  (click)="showCreateForm = false"
                  class="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <form (ngSubmit)="createTicket()" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-2">
                    Temat zgłoszenia
                  </label>
                  <input
                    [(ngModel)]="newTicket.subject"
                    name="subject"
                    type="text"
                    required
                    class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Krótki opis problemu"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-foreground mb-2">
                    Szczegółowy opis
                  </label>
                  <textarea
                    [(ngModel)]="newTicket.body"
                    name="body"
                    required
                    rows="6"
                    class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Opisz szczegółowo swój problem lub pytanie..."
                  ></textarea>
                </div>

                <div class="flex gap-3 justify-end">
                  <button
                    type="button"
                    (click)="showCreateForm = false"
                    class="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    [disabled]="isLoading"
                    class="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {{ isLoading ? 'Tworzenie...' : 'Wyślij zgłoszenie' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Tickets List -->
        <div *ngIf="!isLoading && tickets.length === 0" class="text-center py-16">
          <svg class="w-24 h-24 mx-auto text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
          <h3 class="text-xl font-semibold text-foreground mb-2">Brak zgłoszeń</h3>
          <p class="text-muted-foreground mb-6">Nie masz jeszcze żadnych zgłoszeń do obsługi klienta</p>
          <button
            (click)="showCreateForm = true"
            class="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Utwórz pierwsze zgłoszenie
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center py-16">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>

        <!-- Tickets Grid -->
        <div *ngIf="!isLoading && tickets.length > 0" class="grid gap-4">
          <div
            *ngFor="let ticket of tickets"
            (click)="viewTicket(ticket)"
            class="bg-background border border-border rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-lg font-semibold text-foreground">{{ ticket.subject }}</h3>
                  <span 
                    class="px-3 py-1 rounded-full text-xs font-medium"
                    [ngClass]="{
                      'bg-blue-100 text-blue-800': ticket.status === 'new',
                      'bg-yellow-100 text-yellow-800': ticket.status === 'in_progress',
                      'bg-green-100 text-green-800': ticket.status === 'closed'
                    }"
                  >
                    {{ getStatusLabel(ticket.status) }}
                  </span>
                </div>
                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                    </svg>
                    {{ ticket.messages?.length || 0 }} wiadomości
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ ticket.updated_at | date:'dd.MM.yyyy HH:mm' }}
                  </span>
                </div>
              </div>
              <svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Ticket Details Modal -->
        <div 
          *ngIf="selectedTicket"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          (click)="selectedTicket = null"
        >
          <div 
            class="bg-background rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            (click)="$event.stopPropagation()"
          >
            <div class="p-6">
              <!-- Header -->
              <div class="flex items-start justify-between mb-6 pb-4 border-b border-border">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h2 class="text-2xl font-bold text-foreground">{{ selectedTicket.subject }}</h2>
                    <span 
                      class="px-3 py-1 rounded-full text-xs font-medium"
                      [ngClass]="{
                        'bg-blue-100 text-blue-800': selectedTicket.status === 'new',
                        'bg-yellow-100 text-yellow-800': selectedTicket.status === 'in_progress',
                        'bg-green-100 text-green-800': selectedTicket.status === 'closed'
                      }"
                    >
                      {{ getStatusLabel(selectedTicket.status) }}
                    </span>
                  </div>
                  <p class="text-sm text-muted-foreground">
                    Utworzono: {{ selectedTicket.created_at | date:'dd.MM.yyyy HH:mm' }}
                  </p>
                </div>
                <button
                  (click)="selectedTicket = null"
                  class="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <!-- Messages -->
              <div class="space-y-4 mb-6 max-h-96 overflow-y-auto">
                <div
                  *ngFor="let message of selectedTicket.messages"
                  class="flex"
                  [ngClass]="{'justify-end': isCurrentUser(message.author_id)}"
                >
                  <div 
                    class="max-w-[80%] rounded-lg p-4"
                    [ngClass]="{
                      'bg-primary text-primary-foreground': isCurrentUser(message.author_id),
                      'bg-muted': !isCurrentUser(message.author_id)
                    }"
                  >
                    <p class="text-sm font-medium mb-1">
                      {{ getAuthorName(message.author_id) }}
                    </p>
                    <p class="whitespace-pre-line">{{ message.body }}</p>
                    <p class="text-xs mt-2 opacity-70">
                      {{ message.created_at | date:'dd.MM.yyyy HH:mm' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Reply Form -->
              <div *ngIf="selectedTicket.status !== 'closed'" class="border-t border-border pt-4">
                <form (ngSubmit)="replyToTicket()" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-foreground mb-2">
                      Twoja odpowiedź
                    </label>
                    <textarea
                      [(ngModel)]="replyText"
                      name="reply"
                      required
                      rows="4"
                      class="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Napisz swoją odpowiedź..."
                    ></textarea>
                  </div>
                  <div class="flex justify-end">
                    <button
                      type="submit"
                      [disabled]="isLoading || !replyText.trim()"
                      class="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {{ isLoading ? 'Wysyłanie...' : 'Wyślij odpowiedź' }}
                    </button>
                  </div>
                </form>
              </div>

              <div *ngIf="selectedTicket.status === 'closed'" class="border-t border-border pt-4">
                <p class="text-center text-muted-foreground">
                  To zgłoszenie zostało zamknięte i nie można już wysyłać odpowiedzi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SupportComponent implements OnInit {
  tickets: Ticket[] = [];
  selectedTicket: Ticket | null = null;
  showCreateForm = false;
  isLoading = false;
  replyText = '';
  
  newTicket: InsertTicket = {
    subject: '',
    body: ''
  };

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.apiService.getMyTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.notificationService.showError('Nie udało się załadować zgłoszeń');
        this.isLoading = false;
      }
    });
  }

  createTicket(): void {
    if (!this.newTicket.subject.trim() || !this.newTicket.body.trim()) {
      this.notificationService.showWarning('Uzupełnij wszystkie pola');
      return;
    }

    this.isLoading = true;
    this.apiService.createTicket(this.newTicket).subscribe({
      next: (ticket) => {
        this.notificationService.showSuccess('Zgłoszenie zostało utworzone');
        this.showCreateForm = false;
        this.newTicket = { subject: '', body: '' };
        this.loadTickets();
      },
      error: (error) => {
        console.error('Error creating ticket:', error);
        this.notificationService.showError('Nie udało się utworzyć zgłoszenia');
        this.isLoading = false;
      }
    });
  }

  viewTicket(ticket: Ticket): void {
    this.isLoading = true;
    this.apiService.getTicket(ticket.id).subscribe({
      next: (fullTicket) => {
        this.selectedTicket = fullTicket;
        this.replyText = '';
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading ticket details:', error);
        this.notificationService.showError('Nie udało się załadować szczegółów zgłoszenia');
        this.isLoading = false;
      }
    });
  }

  replyToTicket(): void {
    if (!this.selectedTicket || !this.replyText.trim()) return;

    this.isLoading = true;
    const reply: TicketReply = { body: this.replyText };

    this.apiService.replyToTicket(this.selectedTicket.id, reply).subscribe({
      next: () => {
        this.notificationService.showSuccess('Odpowiedź została wysłana');
        this.replyText = '';
        this.viewTicket(this.selectedTicket!);
      },
      error: (error) => {
        console.error('Error replying to ticket:', error);
        this.notificationService.showError('Nie udało się wysłać odpowiedzi');
        this.isLoading = false;
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'new': 'Nowe',
      'in_progress': 'W trakcie',
      'closed': 'Zamknięte'
    };
    return labels[status] || status;
  }

  isCurrentUser(authorId: number): boolean {
    // Assume the current user's messages are from them
    // You may need to implement proper user ID checking
    return this.selectedTicket?.user.id === authorId.toString();
  }

  getAuthorName(authorId: number): string {
    if (!this.selectedTicket) return 'Nieznany';
    
    const participant = this.selectedTicket.participants?.find(p => p.id === authorId.toString());
    if (participant) {
      return `${participant.firstName} ${participant.lastName}`;
    }
    
    return this.isCurrentUser(authorId) ? 'Ty' : 'Obsługa klienta';
  }
}

