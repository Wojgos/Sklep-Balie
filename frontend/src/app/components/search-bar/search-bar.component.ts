import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, filter, finalize } from 'rxjs';
import { ApiService } from '../../services/api.service';

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
          (keyup.enter)="onEnter()"
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
        *ngIf="searchQuery && searchResults.length === 0 && !isSearching && hasSearched" 
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
export class SearchBarComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  
  searchQuery = '';
  searchResults: any[] = [];
  isSearching = false;
  hasSearched = false;
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged(),
      filter(query => {
        if (!query.trim()) {
          this.searchResults = [];
          this.isSearching = false;
          this.hasSearched = false;
          return false;
        }
        return true;
      }),
      switchMap(query => {
        this.isSearching = true;
        this.hasSearched = false;
        return this.apiService.searchProducts(query).pipe(
          finalize(() => this.isSearching = false)
        );
      })
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.hasSearched = true;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.searchResults = [];
        this.isSearching = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onEnter(): void {
    this.onSearch();
  }

  selectResult(result: any): void {
    const identifier = result.slug || result.id;
    this.router.navigate(['/product', identifier]);
    this.searchQuery = '';
    this.searchResults = [];
    this.hasSearched = false;
    this.close.emit();
  }
}
