import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Category } from '../../models';

@Component({
  selector: 'bg-category-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="group cursor-pointer bg-card border border-card-border rounded-lg overflow-hidden hover:shadow-lg transition-all"
      (click)="navigateToProducts()"
      [attr.data-testid]="'card-category-' + category.name"
    >
      <div class="relative aspect-[4/3] overflow-hidden">
        <img 
          [src]="category.image" 
          [alt]="category.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div class="absolute bottom-4 left-4 text-white">
          <h3 class="font-heading font-bold text-xl mb-1" data-testid="text-category-name">
            {{ category.name }}
          </h3>
          <p class="text-sm opacity-90" data-testid="text-product-count">
            {{ category.productCount }} produktów
          </p>
        </div>
      </div>
      
      <div class="p-4">
        <p class="text-sm text-muted-foreground" data-testid="text-category-description">
          {{ category.description }}
        </p>
      </div>
    </div>
  `,
  styleUrls: ['./category-card.component.scss']
})
export class CategoryCardComponent {
  @Input() category!: Category;

  constructor(private router: Router) {}

  navigateToProducts(): void {
    this.router.navigate(['/products'], { 
      queryParams: { category: this.category.id } 
    });
  }
}

