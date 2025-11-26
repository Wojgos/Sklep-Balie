import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { ChatMessage, ChatResponse, ChatRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly apiUrl = 'http://localhost:8000/api/v1/chatbot/ask/'; // Django backend (trailing slash required)
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  private sessionId: string;

  public messages$ = this.messagesSubject.asObservable();
  public isOpen$ = this.isOpenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.sessionId = this.generateSessionId();
    this.initializeChat();
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private initializeChat(): void {
    const welcomeMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: 'Cześć! Jestem wirtualnym asystentem. Możesz zapytać mnie o status zamówienia, ofertę produktów lub dane kontaktowe. W czym mogę Ci pomóc?',
      isUser: false,
      timestamp: new Date()
    };
    this.messagesSubject.next([welcomeMessage]);
  }

  private generateMessageId(): string {
    return 'msg_' + Math.random().toString(36).substr(2, 9);
  }

  toggleChat(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  openChat(): void {
    this.isOpenSubject.next(true);
  }

  closeChat(): void {
    this.isOpenSubject.next(false);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  private generateSuggestions(response: string): string[] {
    const lowerResponse = response.toLowerCase();
    const suggestions: string[] = [];

    // Generuj sugestie bazując na odpowiedzi
    if (lowerResponse.includes('zamówien') || lowerResponse.includes('status')) {
      suggestions.push('Jakie masz numery śledzenia?');
      suggestions.push('Jak zmienić adres dostawy?');
    }
    
    if (lowerResponse.includes('produkt') || lowerResponse.includes('oferc') || lowerResponse.includes('bali')) {
      suggestions.push('Pokaż popularne produkty');
      suggestions.push('Jakie są ceny?');
    }
    
    if (lowerResponse.includes('kontakt') || lowerResponse.includes('telefon') || lowerResponse.includes('email')) {
      suggestions.push('Jakie są godziny otwarcia?');
      suggestions.push('Formularz kontaktowy');
    }

    if (lowerResponse.includes('zwrot') || lowerResponse.includes('reklamacj') || lowerResponse.includes('wsparcie')) {
      suggestions.push('Jak złożyć reklamację?');
      suggestions.push('Polityka zwrotów');
    }

    // Domyślne sugestie jeśli nic nie pasuje
    if (suggestions.length === 0) {
      suggestions.push('Status zamówienia');
      suggestions.push('Oferta produktów');
      suggestions.push('Kontakt');
    }

    return suggestions.slice(0, 4); // Max 4 sugestie
  }

  sendMessage(content: string, currentPage?: string): Observable<ChatResponse> {
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: content,
      isUser: true,
      timestamp: new Date()
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, userMessage]);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing',
      role: 'assistant',
      content: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: true
    };
    this.messagesSubject.next([...this.messagesSubject.value, typingMessage]);

    // Prepare simple request for Django backend
    const request = {
      message: content
    };

    // Get auth headers with JWT token if available
    const headers = this.getAuthHeaders();

    // Send to Django API
    return this.http.post<{response: string}>(this.apiUrl, request, { headers })
      .pipe(
        map((response: {response: string}) => ({
          message: response.response,
          suggestions: this.generateSuggestions(response.response)
        } as ChatResponse)),
        catchError(error => {
          console.error('Chatbot API error:', error);
          return this.getFallbackResponse(content);
        })
      );
  }

  addBotResponse(response: ChatResponse): void {
    // Remove typing indicator
    const messagesWithoutTyping = this.messagesSubject.value.filter(msg => msg.id !== 'typing');
    
    // Add bot response
    const botMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: response.message,
      isUser: false,
      timestamp: new Date()
    };

    this.messagesSubject.next([...messagesWithoutTyping, botMessage]);
  }

  private getFallbackResponse(userMessage: string): Observable<ChatResponse> {
    // Prosty fallback gdy backend jest niedostępny
    const response: ChatResponse = {
      message: 'Przepraszam, mam obecnie problem z połączeniem. Spróbuj ponownie za chwilę lub skontaktuj się z nami przez formularz wsparcia.',
      suggestions: ['Spróbuj ponownie', 'Formularz wsparcia', 'Kontakt']
    };

    return of(response);
  }

  clearChat(): void {
    this.messagesSubject.next([]);
    this.initializeChat();
  }

  getMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }
}
