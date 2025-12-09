import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './components/notification/notification.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ModalContainerComponent } from './components/modal-container/modal-container.component';

@Component({
  selector: 'bg-root',
  standalone: true,
  imports: [RouterOutlet, NotificationComponent, ChatbotComponent, HeaderComponent, FooterComponent, ModalContainerComponent],
  template: `
    <div class="min-h-screen bg-background text-foreground flex flex-col">
      <bg-header></bg-header>
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>
      <bg-footer></bg-footer>
      <bg-notifications></bg-notifications>
      <bg-chatbot></bg-chatbot>
      <app-modal-container></app-modal-container>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'BarrelGarden';
}

