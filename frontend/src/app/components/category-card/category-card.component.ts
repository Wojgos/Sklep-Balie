import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Category } from '../../models';

@Component({
  selector: 'bg-category-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article 
      class="category-card"
      (click)="navigateToFeaturedCategory()"
      [attr.data-testid]="'card-category-' + category.name"
    >
      <div class="category-card__image">
        <img 
          [src]="category.image" 
          [alt]="category.name"
          loading="lazy"
        />
        <div class="category-card__overlay">
          <p class="category-card__count" data-testid="text-product-count">
            {{ totalProductCount }} {{ totalProductCount === 1 ? 'produkt' : 'produktów' }}
          </p>
        </div>
      </div>

      <div class="category-card__content">
        <h3 data-testid="text-category-name">{{ category.name }}</h3>
        <p class="category-card__description" data-testid="text-category-description">
          {{ category.description }}
        </p>
        <button class="category-card__cta" type="button" (click)="navigateToFeaturedCategory($event)">
          Zobacz produkty
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  `,
  styleUrls: ['./category-card.component.scss']
})
export class CategoryCardComponent {
  @Input() category!: Category;

  constructor(private router: Router) {}

  get totalProductCount(): number {
    return this.category.totalProductCount ?? this.category.productCount ?? 0;
  }

  get childCategories(): Category[] {
    return this.category.childCategories ?? [];
  }

  navigateToCategory(target: Category, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    this.router.navigate(['/products'], { 
      queryParams: { category: target.id } 
    });
  }

  navigateToFeaturedCategory(event?: MouseEvent): void {
    const preferredTarget = this.childCategories[0] ?? this.category;
    this.navigateToCategory(preferredTarget, event);
  }
}

