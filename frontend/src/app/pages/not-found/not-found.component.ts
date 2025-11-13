import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'bg-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center max-w-md mx-auto px-4">
        <div class="mb-8">
          <h1 class="text-9xl font-bold text-primary/20">404</h1>
        </div>
        <h2 class="text-3xl font-bold mb-4">Strona nie została znaleziona</h2>
        <p class="text-muted-foreground mb-8">
          Przepraszamy, ale strona której szukasz nie istnieje lub została przeniesiona.
        </p>
        <div class="space-y-4">
          <a 
            routerLink="/" 
            class="inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Wróć do strony głównej
          </a>
          <div class="text-sm text-muted-foreground">
            <p>Lub skorzystaj z nawigacji powyżej</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {}

