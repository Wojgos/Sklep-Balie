import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'bg-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full max-w-md">
      <div class="relative">
        <input
          type="search"
          [(ngModel)]="searchQuery"
          (input)="onSearch()"
          (keyup.enter)="onSearch()"
          placeholder="Szukaj produktów..."
          class="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          data-testid="input-search"
        />
        <svg 
          class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      
      <!-- Search Results Dropdown -->
      <div 
        *ngIf="searchQuery && searchResults.length > 0" 
        class="absolute top-full left-0 right-0 mt-1 bg-popover border border-popover-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
      >
        <div class="p-2">
          <div class="text-xs text-muted-foreground mb-2 px-2">
            Znaleziono {{ searchResults.length }} produktów
          </div>
          <div 
            *ngFor="let result of searchResults" 
            class="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
            (click)="selectResult(result)"
          >
            <img 
              [src]="result.image" 
              [alt]="result.name"
              class="w-8 h-8 object-cover rounded"
            />
            <div class="flex-1">
              <div class="font-medium text-sm">{{ result.name }}</div>
              <div class="text-xs text-muted-foreground">{{ result.price }} PLN</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- No Results -->
      <div 
        *ngIf="searchQuery && searchResults.length === 0 && !isSearching" 
        class="absolute top-full left-0 right-0 mt-1 bg-popover border border-popover-border rounded-lg shadow-lg z-50"
      >
        <div class="p-4 text-center text-muted-foreground text-sm">
          Nie znaleziono produktów dla "{{ searchQuery }}"
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  
  searchQuery = '';
  searchResults: any[] = [];
  isSearching = false;

  ngOnInit(): void {}

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    
    // Mock search - replace with actual API call
    setTimeout(() => {
      this.searchResults = this.mockSearch(this.searchQuery);
      this.isSearching = false;
    }, 300);
  }

  selectResult(result: any): void {
    // Navigate to product or handle selection
    console.log('Selected product:', result);
    this.close.emit();
  }

  private mockSearch(query: string): any[] {
    const mockProducts = [
      {
        id: '1',
        name: 'Balia Ogrodowa Dębowa Duża',
        price: '1899.99',
        image: '/assets/generated_images/Oak_barrel_water_tub_da291514.png'
      },
      {
        id: '2',
        name: 'Owalna Kadź Kąpielowa',
        price: '3499.99',
        image: '/assets/generated_images/Oval_garden_bathtub_565f5ffe.png'
      }
    ];

    return mockProducts.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

