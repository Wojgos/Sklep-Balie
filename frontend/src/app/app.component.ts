import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './components/notification/notification.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

@Component({
  selector: 'bg-root',
  standalone: true,
  imports: [RouterOutlet, NotificationComponent, ChatbotComponent],
  template: `
    <div class="min-h-screen bg-background text-foreground">
      <router-outlet></router-outlet>
      <bg-notifications></bg-notifications>
      <bg-chatbot></bg-chatbot>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'BarrelGarden';
}

