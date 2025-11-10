import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { ChatMessage, ChatResponse, ChatRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly apiUrl = 'http://localhost:3000/api/chatbot'; // Adjust URL as needed
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
      content: 'Cześć! Jestem Twoim asystentem. Mogę pomóc Ci znaleźć produkty, odpowiedzieć na pytania o nasze balie ogrodowe lub pomóc w nawigacji po stronie. W czym mogę Ci pomóc?',
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

    // Prepare request
    const request: ChatRequest = {
      message: content,
      context: {
        currentPage: currentPage || 'home',
        sessionId: this.sessionId
      }
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Send to API (with fallback for development)
    return this.http.post<ChatResponse>(this.apiUrl, request, { headers })
      .pipe(
        catchError(() => this.getFallbackResponse(content)),
        delay(1000) // Simulate network delay
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
    const message = userMessage.toLowerCase();
    let response: ChatResponse;

    if (message.includes('balia') || message.includes('kadź') || message.includes('produkt')) {
      response = {
        message: 'Mamy szeroki wybór drewnianych bali ogrodowych! Możesz przeglądać nasze kategorie lub sprawdzić wyróżnione produkty. Czy szukasz konkretnego typu bali?',
        suggestions: ['Pokaż kategorie', 'Wyróżnione produkty', 'Balie do kąpieli', 'Kadzie ogrodowe'],
        actions: [
          { type: 'navigate', label: 'Zobacz kategorie', data: { section: 'kategorie' } },
          { type: 'navigate', label: 'Produkty', data: { section: 'produkty' } }
        ]
      };
    } else if (message.includes('cena') || message.includes('koszt') || message.includes('ile')) {
      response = {
        message: 'Nasze ceny są bardzo konkurencyjne! Ceny bali zaczynają się od 299 zł. Dokładne ceny znajdziesz przy każdym produkcie. Czy chcesz zobaczyć konkretną kategorię?',
        suggestions: ['Najtańsze produkty', 'Promocje', 'Porównaj ceny'],
        actions: [
          { type: 'filter', label: 'Sortuj po cenie', data: { sort: 'price' } }
        ]
      };
    } else if (message.includes('dostawa') || message.includes('wysyłka')) {
      response = {
        message: 'Oferujemy szybką dostawę w ciągu 3-5 dni roboczych na terenie całej Polski. Dostawa jest bezpłatna przy zamówieniach powyżej 500 zł.',
        suggestions: ['Koszty dostawy', 'Czas realizacji', 'Obszar dostawy']
      };
    } else if (message.includes('kontakt') || message.includes('telefon') || message.includes('email')) {
      response = {
        message: 'Możesz skontaktować się z nami telefonicznie lub przez email. Nasz zespół chętnie pomoże Ci w wyborze odpowiedniej bali!',
        actions: [
          { type: 'contact', label: 'Pokaż kontakt', data: { section: 'contact' } }
        ]
      };
    } else if (message.includes('pomoc') || message.includes('help') || message.includes('co możesz')) {
      response = {
        message: 'Mogę pomóc Ci w:\n• Znalezieniu odpowiednich produktów\n• Nawigacji po stronie\n• Odpowiedzi na pytania o balie\n• Informacjach o dostawie i cenach\n• Kontakcie z naszym zespołem',
        suggestions: ['Pokaż produkty', 'Informacje o firmie', 'Kontakt', 'Często zadawane pytania']
      };
    } else {
      response = {
        message: 'Dziękuję za wiadomość! Czy mogę pomóc Ci znaleźć konkretny produkt lub masz pytania o nasze balie ogrodowe?',
        suggestions: ['Pokaż produkty', 'Informacje o dostawie', 'Kontakt', 'Pomoc']
      };
    }

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
