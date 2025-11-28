import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { LoyaltyProgram, LoyaltyReward, UserLoyaltyPoints, RedeemedReward } from '../../models';

@Component({
  selector: 'bg-loyalty',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 bg-background py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="font-heading font-bold text-3xl sm:text-4xl mb-2">
            Program Lojalnościowy
          </h1>
          <p class="text-muted-foreground">Zbieraj punkty i wymieniaj je na atrakcyjne nagrody!</p>
        </div>

        <!-- User Points Summary -->
        <div *ngIf="userPoints" class="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-8 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <div>
              <div class="text-5xl font-bold text-primary mb-2">{{ userPoints.availablePoints }}</div>
              <div class="text-sm text-muted-foreground mb-1">Dostępne punkty</div>
              <div class="text-xs text-muted-foreground">Całkowite: {{ userPoints.totalPoints }}</div>
            </div>
            <div>
              <div class="text-4xl font-semibold text-muted-foreground mb-2">{{ userPoints.usedPoints }}</div>
              <div class="text-sm text-muted-foreground">Wykorzystane punkty</div>
            </div>
          </div>
        </div>

        <!-- Program Info -->
        <div *ngIf="loyaltyProgram" class="bg-card border border-card-border rounded-lg p-6 mb-8">
          <h2 class="text-2xl font-semibold mb-3">{{ loyaltyProgram.name }}</h2>
          <p class="text-muted-foreground mb-4">{{ loyaltyProgram.description }}</p>
          <div class="inline-flex items-center gap-2 text-sm bg-primary/10 px-4 py-2 rounded-lg">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            <span class="font-medium">Zdobywasz {{ loyaltyProgram.pointsPerZloty }} punkt{{ loyaltyProgram.pointsPerZloty === 1 ? '' : 'y' }} za każdą złotówkę zakupów!</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-border mb-6">
          <nav class="flex space-x-8" aria-label="Tabs">
            <button
              (click)="activeTab = 'rewards'"
              [class]="activeTab === 'rewards'
                ? 'border-primary text-primary border-b-2 py-4 px-1 text-sm font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted border-b-2 py-4 px-1 text-sm font-medium'"
            >
              Dostępne nagrody
            </button>
            <button
              (click)="activeTab = 'myRewards'"
              [class]="activeTab === 'myRewards'
                ? 'border-primary text-primary border-b-2 py-4 px-1 text-sm font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted border-b-2 py-4 px-1 text-sm font-medium'"
            >
              Moje nagrody
            </button>
          </nav>
        </div>

        <!-- Available Rewards Tab -->
        <div *ngIf="activeTab === 'rewards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let reward of availableRewards$ | async"
               class="bg-card border-2 rounded-lg overflow-hidden hover:border-primary transition-all duration-200 flex flex-col h-full"
               [class.border-card-border]="!canAffordReward(reward)"
               [class.border-primary]="canAffordReward(reward)">
            <!-- Reward Image -->
            <div class="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <svg class="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
              </svg>
            </div>

            <div class="p-4 flex flex-col flex-1">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-semibold text-lg">{{ reward.name }}</h3>
                <span *ngIf="reward.isActive" class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  Aktywna
                </span>
              </div>

              <p class="text-sm text-muted-foreground mb-4 line-clamp-2">{{ reward.description }}</p>

              <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Koszt:</span>
                  <span class="font-bold text-primary">{{ reward.pointsCost }} punktów</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Wartość:</span>
                  <span class="font-semibold">{{ formatRewardValue(reward) }}</span>
                </div>
                <div *ngIf="reward.validUntil" class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Ważna do:</span>
                  <span class="text-xs">{{ reward.validUntil | date:'dd.MM.yyyy' }}</span>
                </div>
              </div>

              <button
                (click)="redeemReward(reward)"
                [disabled]="!canAffordReward(reward) || !reward.isActive"
                class="w-full py-2 rounded-lg font-semibold transition-all duration-200 mt-auto"
                [ngClass]="{
                  'bg-primary text-primary-foreground hover:bg-primary/90': canAffordReward(reward) && reward.isActive,
                  'bg-muted text-muted-foreground cursor-not-allowed': !canAffordReward(reward) || !reward.isActive
                }"
              >
                {{ !canAffordReward(reward) ? 'Brak punktów' : 'Wymień punkty' }}
              </button>
            </div>
          </div>
        </div>

        <!-- My Rewards Tab -->
        <div *ngIf="activeTab === 'myRewards'">
          <div *ngIf="(redeemedRewards$ | async)?.length === 0" class="text-center py-16">
            <svg class="w-24 h-24 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <p class="text-muted-foreground mb-2">Nie masz jeszcze żadnych wymienionych nagród</p>
            <button
              (click)="activeTab = 'rewards'"
              class="text-primary hover:underline font-medium"
            >
              Przeglądaj dostępne nagrody →
            </button>
          </div>

          <div *ngIf="(redeemedRewards$ | async)?.length! > 0" class="space-y-4">
            <div *ngFor="let redemption of redeemedRewards$ | async"
                 class="bg-card border border-card-border rounded-lg p-6">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-semibold">{{ redemption.rewardName || redemption.reward?.name || 'Nagroda' }}</h3>
                    <span
                      class="px-3 py-1 rounded-full text-xs font-medium"
                      [ngClass]="redemption.isUsed ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'"
                    >
                      {{ redemption.isUsed ? 'Wykorzystane' : 'Do użycia' }}
                    </span>
                  </div>
                  <p class="text-sm text-muted-foreground mb-3" *ngIf="redemption.reward?.description">
                    {{ redemption.reward?.description }}
                  </p>

                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-muted-foreground">Kod kuponu:</span>
                      <div class="font-mono font-bold text-primary mt-1">{{ redemption.code }}</div>
                    </div>
                    <div>
                      <span class="text-muted-foreground">Punkty:</span>
                      <div class="font-semibold mt-1">{{ redemption.pointsSpent }}</div>
                    </div>
                    <div>
                      <span class="text-muted-foreground">Data wymiany:</span>
                      <div class="mt-1">{{ redemption.createdAt | date:'dd.MM.yyyy' }}</div>
                    </div>
                    <div *ngIf="redemption.expiresAt">
                      <span class="text-muted-foreground">Wygasa:</span>
                      <div class="mt-1">{{ redemption.expiresAt | date:'dd.MM.yyyy' }}</div>
                    </div>
                  </div>
                </div>

                <div *ngIf="!redemption.isUsed" class="text-right">
                  <button
                    class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                    (click)="copyCode(redemption.code)"
                  >
                    Kopiuj kod
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styleUrls: ['./loyalty.component.scss']
})
export class LoyaltyComponent implements OnInit {
  activeTab: 'rewards' | 'myRewards' = 'rewards';
  
  loyaltyProgram: LoyaltyProgram | null = null;
  userPoints: UserLoyaltyPoints | null = null;
  availableRewards$: Observable<LoyaltyReward[]>;
  redeemedRewards$: Observable<RedeemedReward[]>;

  constructor(private apiService: ApiService) {
    this.availableRewards$ = this.apiService.getLoyaltyOffers();
    this.redeemedRewards$ = this.apiService.getMyRedeemedRewards();
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Hardcoded loyalty program info (backend doesn't have this endpoint)
    this.loyaltyProgram = {
      id: '1',
      name: 'Program Lojalnościowy EStore',
      description: 'Zbieraj punkty za każde zamówienie i wymieniaj je na atrakcyjne nagrody!',
      pointsPerZloty: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.apiService.getUserLoyaltyPoints().subscribe({
      next: (points) => {
        this.userPoints = points;
      },
      error: (err) => {
        console.error('Error loading user points:', err);
      }
    });
  }

  canAffordReward(reward: LoyaltyReward): boolean {
    if (!this.userPoints) return false;
    return this.userPoints.availablePoints >= reward.pointsCost;
  }

  redeemReward(reward: LoyaltyReward): void {
    if (!this.canAffordReward(reward)) {
      alert('Nie masz wystarczającej liczby punktów!');
      return;
    }

    if (!confirm(`Czy na pewno chcesz wymienić ${reward.pointsCost} punktów na ${reward.name}?`)) {
      return;
    }

    this.apiService.redeemReward(reward.id).subscribe({
      next: (redemption) => {
        if (redemption.couponDetails && redemption.couponCode) {
          const expiryDate = new Date(redemption.couponDetails.validTo);
          alert(`Gratulacje! Otrzymałeś nagrodę: ${reward.name}\n\nKod kuponu: ${redemption.couponCode}\nWażny do: ${expiryDate.toLocaleDateString('pl-PL')}\n\nKod został skopiowany do schowka!`);
          navigator.clipboard.writeText(redemption.couponCode);
        } else {
          alert(`Gratulacje! Otrzymałeś nagrodę: ${reward.name}`);
        }
        this.loadData();
        this.redeemedRewards$ = this.apiService.getMyRedeemedRewards();
        this.activeTab = 'myRewards';
      },
      error: (err) => {
        console.error('Error redeeming reward:', err);
        const errorMsg = err.error?.error || 'Błąd podczas wymiany nagrody';
        alert(errorMsg);
      }
    });
  }

  formatRewardValue(reward: LoyaltyReward): string {
    if (reward.isPercentage) {
      return `${reward.rewardValue}% zniżki`;
    } else {
      return `${reward.rewardValue} PLN zniżki`;
    }
  }

  copyCode(code?: string): void {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      alert('Kod kuponu został skopiowany do schowka!');
    }).catch(err => {
      console.error('Error copying code:', err);
      alert('Nie udało się skopiować kodu');
    });
  }
}
