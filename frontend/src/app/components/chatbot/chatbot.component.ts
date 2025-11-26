import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatbotService } from '../../services/chatbot.service';
import { ChatMessage, ChatResponse, ChatAction } from '../../models';

@Component({
  selector: 'bg-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Chat Toggle Button -->
    <button 
      *ngIf="!isOpen"
      (click)="toggleChat()"
      class="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
      aria-label="Otwórz chat"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
      </svg>
      <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
    </button>

    <!-- Chat Window -->
    <div 
      *ngIf="isOpen"
      class="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-background border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden"
    >
      <!-- Header -->
      <div class="bg-primary text-primary-foreground p-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-sm">Wirtualny Asystent</h3>
            <p class="text-xs text-primary-foreground/80">Odpowiadam natychmiast</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button 
            (click)="toggleSupport()"
            class="p-1 hover:bg-primary-foreground/20 rounded"
            [class.bg-primary-foreground]="showSupport"
            title="Menu wsparcia"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </button>
          <button 
            (click)="clearChat()"
            class="p-1 hover:bg-primary-foreground/20 rounded"
            title="Wyczyść chat"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
          <button 
            (click)="toggleChat()"
            class="p-1 hover:bg-primary-foreground/20 rounded"
            title="Zamknij chat"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Support Menu -->
      <div 
        *ngIf="showSupport"
        class="bg-background border-b border-border p-4 shadow-sm"
      >
        <h4 class="text-sm font-semibold text-foreground mb-3">Menu wsparcia</h4>
        <div class="space-y-2">
          <button
            (click)="navigateAndClose('/support')"
            class="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-3 group"
          >
            <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-foreground">Zgłoszenia</p>
              <p class="text-xs text-muted-foreground">Utwórz nowe zgłoszenie lub sprawdź status</p>
            </div>
          </button>
          
          <button
            (click)="navigateAndClose('/contact')"
            class="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-3 group"
          >
            <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-foreground">Kontakt</p>
              <p class="text-xs text-muted-foreground">Dane kontaktowe i formularz</p>
            </div>
          </button>

          <button
            (click)="navigateAndClose('/faq')"
            class="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-3 group"
          >
            <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-foreground">FAQ</p>
              <p class="text-xs text-muted-foreground">Najczęściej zadawane pytania</p>
            </div>
          </button>
        </div>
      </div>

      <!-- Messages Container -->
      <div 
        #messagesContainer
        class="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30"
      >
        <div 
          *ngFor="let message of messages; trackBy: trackByMessageId"
          class="flex"
          [class.justify-end]="message.isUser"
        >
          <!-- Bot Message -->
          <div 
            *ngIf="!message.isUser"
            class="flex items-start gap-2 max-w-[85%]"
          >
            <div class="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg class="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div>
              <div 
                *ngIf="!message.isTyping"
                class="bg-muted/50 border border-border rounded-lg p-3 shadow-sm"
              >
                <p class="text-sm whitespace-pre-line text-foreground">{{ message.content }}</p>
              </div>
              <!-- Typing Indicator -->
              <div 
                *ngIf="message.isTyping"
                class="bg-background border border-border rounded-lg p-3 shadow-sm"
              >
                <div class="flex items-center gap-1">
                  <div class="flex gap-1">
                    <div class="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                  <span class="text-xs text-muted-foreground ml-2">Pisze...</span>
                </div>
              </div>
              <p class="text-xs text-muted-foreground mt-1">{{ message.timestamp | date:'HH:mm' }}</p>
            </div>
          </div>

          <!-- User Message -->
          <div 
            *ngIf="message.isUser"
            class="flex items-start gap-2 max-w-[85%]"
          >
            <div>
              <div class="bg-primary text-primary-foreground rounded-lg p-3 shadow-sm">
                <p class="text-sm">{{ message.content }}</p>
              </div>
              <p class="text-xs text-muted-foreground mt-1 text-right">{{ message.timestamp | date:'HH:mm' }}</p>
            </div>
            <div class="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions (shown when there are suggestions) -->
      <div 
        *ngIf="quickActions.length > 0"
        class="px-4 py-2 border-t border-border bg-background"
      >
        <p class="text-xs text-muted-foreground mb-2">Sugestie:</p>
        <div class="flex flex-wrap gap-2">
          <button
            *ngFor="let action of quickActions"
            (click)="handleQuickAction(action)"
            class="text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-full transition-colors"
          >
            {{ action }}
          </button>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 border-t border-border bg-muted/30">
        <div class="flex gap-2 items-end">
          <input
            #messageInput
            [(ngModel)]="currentMessage"
            (keydown.enter)="sendMessage()"
            (keydown)="handleKeyDown($event)"
            placeholder="Wpisz swoją wiadomość..."
            class="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            [disabled]="isLoading"
          />
          <button
            (click)="sendMessage()"
            [disabled]="!currentMessage.trim() || isLoading"
            class="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground px-5 py-3 rounded-lg transition-colors flex-shrink-0"
            title="Wyślij wiadomość"
          >
            <svg 
              *ngIf="!isLoading"
              class="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
            <svg 
              *ngIf="isLoading"
              class="w-4 h-4 animate-spin" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  quickActions: string[] = [];
  showSupport = false;

  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;

  constructor(
    private chatbotService: ChatbotService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to chat state
    this.subscriptions.push(
      this.chatbotService.isOpen$.subscribe(isOpen => {
        this.isOpen = isOpen;
        if (isOpen) {
          setTimeout(() => this.focusInput(), 100);
        }
      })
    );

    // Subscribe to messages
    this.subscriptions.push(
      this.chatbotService.messages$.subscribe(messages => {
        this.messages = messages;
        this.shouldScrollToBottom = true;
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleChat(): void {
    this.chatbotService.toggleChat();
  }

  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isLoading) return;

    const message = this.currentMessage.trim();
    this.currentMessage = '';
    this.isLoading = true;
    this.quickActions = [];

    this.chatbotService.sendMessage(message, 'home').subscribe({
      next: (response: ChatResponse) => {
        this.chatbotService.addBotResponse(response);
        if (response.suggestions) {
          this.quickActions = response.suggestions;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Chat error:', error);
        const errorResponse: ChatResponse = {
          message: 'Przepraszam, wystąpił błąd. Spróbuj ponownie za chwilę.'
        };
        this.chatbotService.addBotResponse(errorResponse);
        this.isLoading = false;
      }
    });
  }

  handleQuickAction(action: string): void {
    this.currentMessage = action;
    this.sendMessage();
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    this.chatbotService.clearChat();
    this.quickActions = [];
  }

  toggleSupport(): void {
    this.showSupport = !this.showSupport;
  }

  navigateAndClose(path: string): void {
    this.router.navigate([path]);
    this.chatbotService.closeChat();
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  private focusInput(): void {
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }
}
