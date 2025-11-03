import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './components/notification/notification.component';

@Component({
  selector: 'bg-root',
  standalone: true,
  imports: [RouterOutlet, NotificationComponent],
  template: `
    <div class="min-h-screen bg-background text-foreground">
      <router-outlet></router-outlet>
      <bg-notifications></bg-notifications>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'BarrelGarden';
}

